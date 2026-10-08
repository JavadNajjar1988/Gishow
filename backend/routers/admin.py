from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Barname, FactorList, Salon, RunTurn, BankTerminal, ChairInBarname
from ..schemas import AdminMetrics, FactorOut
from ..security import require, permitted_event_ids, authorize_event, user_view
from ..models import UserList

router = APIRouter(prefix="/admin", tags=["پنل مدیریت و تهیه‌کننده (Admin & Producer)"])

@router.get("/metrics", response_model=AdminMetrics, summary="آمار و شاخص‌های کلیدی فروش")
def get_admin_metrics(db: Session = Depends(get_db), user=Depends(require('reports.read'))):
    ids = permitted_event_ids(db, user, 'reports.read')
    factors = db.query(FactorList).join(RunTurn)
    events = db.query(Barname)
    salons = db.query(Salon)
    if ids is not None:
        factors = factors.filter(RunTurn.barname_id.in_(ids))
        events = events.filter(Barname.id.in_(ids))
        salons = salons.filter(Salon.id.in_(events.with_entities(Barname.salon_id)))
    total_rev = factors.with_entities(func.sum(FactorList.final_amount)).scalar() or 0.0
    total_factors = factors.count()
    active_events = events.filter(Barname.is_active == True).count()
    active_salons = salons.count()

    return {
        "total_revenue": total_rev,
        "total_tickets_sold": total_factors,
        "active_events_count": active_events,
        "active_salons_count": active_salons,
    }

@router.get("/factors", response_model=List[FactorOut], summary="لیست فاکتورها و تراکنش‌های بانکی")
def get_all_factors(db: Session = Depends(get_db), user=Depends(require('reports.read'))):
    ids = permitted_event_ids(db, user, 'reports.read')
    query = db.query(FactorList).join(RunTurn)
    if ids is not None:
        query = query.filter(RunTurn.barname_id.in_(ids))
    factors = query.order_by(FactorList.id.desc()).all()
    results = []
    for f in factors:
        results.append({
            "factor_number": f.factor_number,
            "tracking_code": f.tracking_code,
            "ref_id": f.ref_id,
            "event_title": f.run_turn.barname.title if f.run_turn and f.run_turn.barname else "",
            "salon_name": f.run_turn.barname.salon.name if f.run_turn and f.run_turn.barname and f.run_turn.barname.salon else "",
            "sans_date": f.run_turn.date if f.run_turn else "",
            "sans_time": f.run_turn.time if f.run_turn else "",
            "customer_name": f.customer_name,
            "customer_mobile": f.customer_mobile,
            "customer_national_code": f.customer_national_code,
            "subtotal": f.subtotal,
            "discount_amount": f.discount_amount,
            "final_amount": f.final_amount,
            "payment_gateway": f.payment_gateway,
            "paid_at": f.paid_at,
            "qr_payload": f.qr_payload,
            "is_checked_in": f.is_checked_in,
            "checked_in_at": f.checked_in_at,
        })
    return results

@router.get("/mali")
def get_mali_settlements(user=Depends(require('reports.read'))):
    raise HTTPException(501, 'محاسبه و تسویه واقعی در گام مالی پیاده می‌شود.')

@router.get("/terminals")
def get_bank_terminals(db: Session = Depends(get_db), user=Depends(require('terminals.read'))):
    return [{'id': t.id, 'bank_name': t.bank_name, 'terminal_id': t.terminal_id, 'is_active': t.is_active}
            for t in db.query(BankTerminal).all()]

@router.post("/chair-block", summary="بلاک کردن صندلی برای ارگان‌ها (ChairForBarname)")
def block_chairs_for_organizers(
    run_turn_id: int = Body(...),
    chair_ids: List[int] = Body(...),
    action: str = Body(default="block"), # 'block' or 'unblock'
    db: Session = Depends(get_db),
    user=Depends(require('seats.manage'))
):
    sans = db.get(RunTurn, run_turn_id)
    if not sans:
        raise HTTPException(404, 'سانس یافت نشد.')
    authorize_event(db, user, 'seats.manage', sans.barname_id)
    if action not in ('block', 'unblock'):
        raise HTTPException(422, 'عملیات معتبر نیست.')
    status_to_set = "blocked" if action == "block" else "available"
    updated_count = 0
    for cid in sorted(set(chair_ids)):
        status_row = db.query(ChairInBarname).filter(
            ChairInBarname.run_turn_id == run_turn_id,
            ChairInBarname.chair_id == cid
        ).with_for_update().first()
        if status_row:
            expected = 'available' if action == 'block' else 'blocked'
            if status_row.status != expected:
                db.rollback()
                raise HTTPException(409, 'وضعیت صندلی اجازه این عملیات را نمی‌دهد.')
            status_row.status = status_to_set
            updated_count += 1
    db.commit()
    return {"status": "success", "updated_chairs": updated_count, "action": action}

@router.get("/users")
def get_admin_users(db: Session = Depends(get_db), user=Depends(require('accounts.manage'))):
    return [user_view(db, account) for account in db.query(UserList).order_by(UserList.id).all()]

@router.post("/users")
def create_admin_user(user=Depends(require('accounts.manage'))):
    raise HTTPException(410, 'حساب از مسیر ثبت‌نام ساخته شود؛ تخصیص نقش از بخش دسترسی انجام شود.')

@router.get("/events")
def authorized_events(db: Session = Depends(get_db), user=Depends(require('events.read'))):
    ids = permitted_event_ids(db, user, 'events.read')
    query = db.query(Barname)
    if ids is not None:
        query = query.filter(Barname.id.in_(ids))
    return [{'id': e.id, 'title': e.title, 'is_active': e.is_active} for e in query.all()]

@router.post("/salons", summary="تعریف سالن و جایگاه‌های جدید (Salons/Create)")
def create_salon(
    name: str = Body(...),
    city: str = Body(...),
    address: Optional[str] = Body(None),
    capacity: int = Body(default=0),
    db: Session = Depends(get_db),
    user=Depends(require('salons.manage'))
):
    new_salon = Salon(
        name=name,
        city=city,
        address=address,
        capacity=capacity
    )
    db.add(new_salon)
    db.commit()
    db.refresh(new_salon)
    return {"status": "success", "salon_id": new_salon.id, "message": "سالن با موفقیت ثبت شد."}
