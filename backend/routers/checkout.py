from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import random
from ..database import get_db
from ..models import RunTurn, ChairInBarname, FactorList, MarkdownList
from ..schemas import CheckoutRequest, FactorOut

router = APIRouter(prefix="/checkout", tags=["خرید و صدور بلیت (Checkout & Invoicing)"])

@router.post("/process", response_model=FactorOut, summary="نهایی‌سازی خرید، تسویه بانکی و صدور بلیت دیجیتال")
def process_checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    sans = db.query(RunTurn).filter(RunTurn.id == req.run_turn_id).first()
    if not sans:
        raise HTTPException(status_code=404, detail="سانس رویداد نامعتبر است.")

    # Fetch selected chairs
    chairs = db.query(ChairInBarname).filter(
        ChairInBarname.run_turn_id == req.run_turn_id,
        ChairInBarname.id.in_(req.seat_ids)
    ).all()

    if len(chairs) != len(req.seat_ids):
        raise HTTPException(status_code=400, detail="برخی صندلی‌های انتخابی معتبر نیستند.")

    subtotal = sum(c.price for c in chairs)
    discount_amount = 0.0

    # Apply Discount Code if provided
    if req.discount_code:
        disc = db.query(MarkdownList).filter(
            MarkdownList.code == req.discount_code.strip().upper(),
            MarkdownList.is_active == True
        ).first()
        if disc:
            if disc.discount_percent > 0:
                discount_amount = (subtotal * disc.discount_percent) / 100.0
            elif disc.fixed_amount > 0:
                discount_amount = disc.fixed_amount

    final_amount = max(0.0, subtotal - discount_amount)

    # Mark chairs as permanently sold
    for c in chairs:
        c.status = "sold"
        c.locked_until = None

    # Generate codes
    rand_num = random.randint(100000, 999999)
    factor_number = f"GSH-{rand_num}"
    tracking_code = f"TRK-{random.randint(100000, 999999)}"
    ref_id = f"{req.payment_gateway.upper()[:3]}-{random.randint(100000000, 999999999)}"

    qr_payload = f"GISHOW:{factor_number}:{sans.barname_id}:{sans.id}:SEATS-{','.join(str(s) for s in req.seat_ids)}"

    factor = FactorList(
        factor_number=factor_number,
        tracking_code=tracking_code,
        ref_id=ref_id,
        run_turn_id=sans.id,
        customer_name=req.customer_name,
        customer_mobile=req.customer_mobile,
        customer_national_code=req.customer_national_code,
        subtotal=subtotal,
        discount_amount=discount_amount,
        final_amount=final_amount,
        payment_gateway=req.payment_gateway,
        paid_at=datetime.utcnow(),
        qr_payload=qr_payload,
        is_checked_in=False,
    )

    db.add(factor)
    db.commit()
    db.refresh(factor)

    return {
        "factor_number": factor.factor_number,
        "tracking_code": factor.tracking_code,
        "ref_id": factor.ref_id,
        "event_title": sans.barname.title if sans.barname else "",
        "salon_name": sans.barname.salon.name if sans.barname and sans.barname.salon else "",
        "sans_date": sans.date,
        "sans_time": sans.time,
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
