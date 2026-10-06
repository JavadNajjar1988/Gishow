from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import FactorList, RunTurn
from ..schemas import TicketCheckRequest, TicketCheckResponse

router = APIRouter(prefix="/checker", tags=["سامانه کنترل بلیت گیت (Ticket Checker)"])

@router.post("/verify", response_model=TicketCheckResponse, summary="استعلام و اعتبارسنجی بلیت در گیت ورودی")
def verify_ticket(req: TicketCheckRequest, db: Session = Depends(get_db)):
    clean_code = req.code.strip().upper()
    now_str = datetime.now().strftime("%H:%M:%S")

    factor = db.query(FactorList).filter(
        (FactorList.factor_number.ilike(clean_code)) |
        (FactorList.tracking_code.ilike(clean_code)) |
        (FactorList.qr_payload.ilike(f"%{clean_code}%"))
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
