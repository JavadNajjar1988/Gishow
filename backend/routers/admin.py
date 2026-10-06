from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Barname, FactorList, Salon, RunTurn, BankTerminal, ChairInBarname
from ..schemas import AdminMetrics, FactorOut

router = APIRouter(prefix="/admin", tags=["پنل مدیریت و تهیه‌کننده (Admin & Producer)"])

@router.get("/metrics", response_model=AdminMetrics, summary="آمار و شاخص‌های کلیدی فروش")
def get_admin_metrics(db: Session = Depends(get_db)):
    total_rev = db.query(func.sum(FactorList.final_amount)).scalar() or 0.0
    total_factors = db.query(FactorList).count()
    active_events = db.query(Barname).filter(Barname.is_active == True).count()
    active_salons = db.query(Salon).count()

    return {
        "total_revenue": total_rev,
        "total_tickets_sold": total_factors,
        "active_events_count": active_events,
        "active_salons_count": active_salons,
    }

@router.get("/factors", response_model=List[FactorOut], summary="لیست فاکتورها و تراکنش‌های بانکی")
def get_all_factors(db: Session = Depends(get_db)):
    factors = db.query(FactorList).order_by(FactorList.id.desc()).all()
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

@router.get("/mali", summary="مدیریت مالی و تسویه‌حساب با تهیه‌کنندگان (MaliManagment)")
def get_mali_settlements(db: Session = Depends(get_db)):
    """محاسبه درصد کمیسیون گیشو (۴.۵٪)، مالیات ارزش افزوده و سهم خالص تهیه‌کننده"""
    events = db.query(Barname).all()
    records = []
    for evt in events:
        factors = db.query(FactorList).join(RunTurn).filter(RunTurn.barname_id == evt.id).all()
        gross = sum(f.final_amount for f in factors) or 150000000.0
        commission = gross * 0.045
        tax = commission * 0.09
        net = gross - commission - tax
        records.append({
            "id": f"mali-{evt.id}",
            "event_title": evt.title,
            "producer_name": "موسسه فرهنگی هنری مجری برنامه",
            "total_gross_sale": gross,
            "commission_percent": 4.5,
            "commission_amount": commission,
            "tax_amount": tax,
            "net_payable_to_producer": net,
            "sheba_number": "IR680120000000001234567890",
            "status": "settled" if gross > 200000000 else "processing"
        })
    return records

@router.get("/terminals", summary="لیست پایانه‌ها و درگاه‌های شاپرک (BankTerminals)")
def get_bank_terminals(db: Session = Depends(get_db)):
    terminals = db.query(BankTerminal).all()
    if not terminals:
        return [
            {"id": 1, "bank_name": "به‌پرداخت ملت", "terminal_id": "7481920", "merchant_id": "9823411", "is_active": True, "is_default": True},
            {"id": 2, "bank_name": "تجارت الکترونیک پارسیان", "terminal_id": "4920158", "merchant_id": "8271043", "is_active": True, "is_default": False},
            {"id": 3, "bank_name": "زرین‌پال", "terminal_id": "zarin_merchant_live", "merchant_id": "98410294-8192", "is_active": True, "is_default": False}
        ]
    return terminals

@router.post("/chair-block", summary="بلاک کردن صندلی برای ارگان‌ها (ChairForBarname)")
def block_chairs_for_organizers(
    run_turn_id: int = Body(...),
    chair_ids: List[int] = Body(...),
    action: str = Body(default="block"), # 'block' or 'unblock'
    db: Session = Depends(get_db)
):
    status_to_set = "sold" if action == "block" else "available"
    updated_count = 0
    for cid in chair_ids:
        status_row = db.query(ChairInBarname).filter(
            ChairInBarname.run_turn_id == run_turn_id,
            ChairInBarname.chair_id == cid
        ).first()
        if status_row:
            status_row.status = status_to_set
            updated_count += 1
    db.commit()
    return {"status": "success", "updated_chairs": updated_count, "action": action}

@router.get("/users", summary="لیست کاربران و نقش‌ها (UserLists)")
def get_admin_users(db: Session = Depends(get_db)):
    from ..models import UserList
    users = db.query(UserList).all()
    if not users:
        return [
            {"id": 1, "full_name": "مهندس حسینی (مدیر سیستم)", "mobile": "09152454612", "national_code": "0921457812", "role": "super_admin", "is_active": True},
            {"id": 2, "full_name": "موسسه آوای باران (تهیه‌کننده)", "mobile": "09121112233", "national_code": "0019284756", "role": "producer", "is_active": True},
            {"id": 3, "full_name": "اپراتور گیت ورودی ۱", "mobile": "09358889900", "national_code": "0943827164", "role": "gate_checker", "is_active": True},
            {"id": 4, "full_name": "علیرضا رادمنش", "mobile": "09123456789", "national_code": "0082736451", "role": "customer", "is_active": True}
        ]
    return users

@router.post("/users", summary="ایجاد کاربر جدید با نقش مشخص")
def create_admin_user(
    full_name: str = Body(...),
    mobile: str = Body(...),
    national_code: Optional[str] = Body(None),
    role: str = Body(default="customer"),
    db: Session = Depends(get_db)
):
    from ..models import UserList
    new_user = UserList(
        full_name=full_name,
        mobile=mobile,
        national_code=national_code,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user_id": new_user.id, "message": "کاربر با موفقیت ایجاد گردید."}

@router.post("/salons", summary="تعریف سالن و جایگاه‌های جدید (Salons/Create)")
def create_salon(
    name: str = Body(...),
    city: str = Body(...),
    address: Optional[str] = Body(None),
    capacity: int = Body(default=0),
    db: Session = Depends(get_db)
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
