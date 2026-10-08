import os
from sqlalchemy import update
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import FactorList, RunTurn, SaleTicket, SaleOrder, SaleReservation
from ..security import require, permitted_event_ids
from ..schemas import TicketCheckRequest, TicketCheckResponse

router = APIRouter(prefix="/checker", tags=["سامانه کنترل بلیت گیت (Ticket Checker)"])

@router.post("/verify", response_model=TicketCheckResponse, summary="استعلام و اعتبارسنجی بلیت در گیت ورودی")
def verify_ticket(req: TicketCheckRequest, db: Session = Depends(get_db), user=Depends(require('tickets.check'))):
    clean_code = req.code.strip().upper()
    now_str = datetime.now().strftime("%H:%M:%S")

    if not clean_code:
        raise HTTPException(422, 'کد بلیت خالی است.')
    ids = permitted_event_ids(db, user, 'tickets.check')
    if req.code.strip().startswith('GISHOW:TICKET:'):
        ticket_id=req.code.strip()[len('GISHOW:TICKET:'):]
        query=db.query(SaleTicket,SaleOrder).join(SaleOrder,SaleOrder.id==SaleTicket.order_id).join(SaleReservation,SaleReservation.id==SaleOrder.reservation_id).join(RunTurn,RunTurn.id==SaleReservation.run_turn_id).filter(SaleTicket.id==ticket_id,SaleOrder.status=='paid')
        if ids is not None:query=query.filter(RunTurn.barname_id.in_(ids))
        if os.getenv('ZARINPAL_MODE','sandbox')=='live':query=query.filter(SaleOrder.gateway_mode=='live')
        result=query.first()
        invalid=dict(status='invalid',message='بلیت معتبر در محدوده دسترسی شما یافت نشد.',timestamp=now_str,factor=None)
        if not result:return invalid
        ticket,order=result
        accepted=db.execute(update(SaleTicket).where(SaleTicket.id==ticket.id,SaleTicket.checked_in_at.is_(None)).values(checked_in_at=datetime.utcnow(),checked_by=user.id))
        if accepted.rowcount!=1:
            db.rollback()
            return dict(status='already_checked',message='این بلیت قبلاً پذیرش شده است.',timestamp=now_str,factor=None)
        db.commit()
        test=' بلیت آزمایشی است و پرداخت واقعی ندارد.' if order.gateway_mode=='sandbox' else ''
        return dict(status='valid',message='ورود صاحب این صندلی تأیید شد.'+test,timestamp=now_str,factor=None)
    query = db.query(FactorList).join(RunTurn)
    if ids is not None:
        query = query.filter(RunTurn.barname_id.in_(ids))
    factor = query.filter(
        (FactorList.factor_number == clean_code) |
        (FactorList.tracking_code == clean_code) |
        (FactorList.qr_payload == req.code.strip())
    ).first()

    if not factor:
        return {
            "status": "invalid",
            "message": "بلیت نامعتبر یا جعلی است و در سامانه یافت نشد!",
            "timestamp": now_str,
            "factor": None
        }

    if factor.is_checked_in:
        return {
            "status": "already_checked",
            "message": f"اخطار: این بلیت قبلاً در ساعت {factor.checked_in_at.strftime('%H:%M')} پذیرش شده است!",
            "timestamp": now_str,
            "factor": {
                "factor_number": factor.factor_number,
                "tracking_code": factor.tracking_code,
                "ref_id": factor.ref_id,
                "event_title": factor.run_turn.barname.title if factor.run_turn and factor.run_turn.barname else "",
                "salon_name": factor.run_turn.barname.salon.name if factor.run_turn and factor.run_turn.barname and factor.run_turn.barname.salon else "",
                "sans_date": factor.run_turn.date if factor.run_turn else "",
                "sans_time": factor.run_turn.time if factor.run_turn else "",
                "customer_name": factor.customer_name,
                "customer_mobile": factor.customer_mobile,
                "customer_national_code": factor.customer_national_code,
                "subtotal": factor.subtotal,
                "discount_amount": factor.discount_amount,
                "final_amount": factor.final_amount,
                "payment_gateway": factor.payment_gateway,
                "paid_at": factor.paid_at,
                "qr_payload": factor.qr_payload,
                "is_checked_in": factor.is_checked_in,
                "checked_in_at": factor.checked_in_at,
            }
        }

    # Mark checked in
    factor.is_checked_in = True
    factor.checked_in_at = datetime.utcnow()
    db.commit()

    return {
        "status": "valid",
        "message": "بلیت معتبر است. ورود تماشاگر با موفقیت تأیید شد.",
        "timestamp": now_str,
        "factor": {
            "factor_number": factor.factor_number,
            "tracking_code": factor.tracking_code,
            "ref_id": factor.ref_id,
            "event_title": factor.run_turn.barname.title if factor.run_turn and factor.run_turn.barname else "",
            "salon_name": factor.run_turn.barname.salon.name if factor.run_turn and factor.run_turn.barname and factor.run_turn.barname.salon else "",
            "sans_date": factor.run_turn.date if factor.run_turn else "",
            "sans_time": factor.run_turn.time if factor.run_turn else "",
            "customer_name": factor.customer_name,
            "customer_mobile": factor.customer_mobile,
            "customer_national_code": factor.customer_national_code,
            "subtotal": factor.subtotal,
            "discount_amount": factor.discount_amount,
            "final_amount": factor.final_amount,
            "payment_gateway": factor.payment_gateway,
            "paid_at": factor.paid_at,
            "qr_payload": factor.qr_payload,
            "is_checked_in": factor.is_checked_in,
            "checked_in_at": factor.checked_in_at,
        }
    }
