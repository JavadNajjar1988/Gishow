from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from ..database import get_db
from ..models import RunTurn, ChairInBarname, ChairInPart, PartOfSalon
from ..schemas import SeatItemOut, SeatLockRequest

router = APIRouter(prefix="/seats", tags=["صندلی‌ها و پلان سالن (Seats & Salon Plan)"])

@router.get("/plan/{run_turn_id}", response_model=List[SeatItemOut], summary="دریافت پلان و وضعیت لحظه‌ای صندلی‌های یک سانس")
def get_seat_plan_for_sans(run_turn_id: int, db: Session = Depends(get_db)):
    sans = db.query(RunTurn).filter(RunTurn.id == run_turn_id).first()
    if not sans:
        raise HTTPException(status_code=404, detail="سانس مورد نظر یافت نشد.")
    if not sans.barname.is_active:
        raise HTTPException(404, detail="برنامه منتشر نشده است.")

    now = datetime.utcnow()
    # Expire old temporary locks
    db.query(ChairInBarname).filter(
        ChairInBarname.run_turn_id == run_turn_id,
        ChairInBarname.status == "reserved",
        ChairInBarname.locked_until < now
    ).update({"status": "available", "locked_until": None, "reservation_id": None})
    db.commit()

    chair_statuses = db.query(ChairInBarname).filter(ChairInBarname.run_turn_id == run_turn_id).all()
    results = []
    for cs in chair_statuses:
        chair = cs.chair
        part = chair.part if chair else None
        results.append({
            "id": cs.id,
            "part_id": part.id if part else 0,
            "part_name": part.name if part else "",
            "row": chair.row_number if chair else 0,
            "number": chair.seat_number if chair else 0,
            "price": cs.price,
            "status": cs.status,
        })
    return results

@router.post('/lock')
def legacy_lock():
    raise HTTPException(501,'رزرو بدون مالک غیرفعال است؛ از مسیر رزرو حساب کاربری استفاده کنید.')
