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

    now = datetime.utcnow()
    # Expire old temporary locks
    db.query(ChairInBarname).filter(
        ChairInBarname.run_turn_id == run_turn_id,
        ChairInBarname.status == "reserved",
        ChairInBarname.locked_until < now
    ).update({"status": "available", "locked_until": None})
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

@router.post("/lock", summary="قفل موقت صندلی‌ها به مدت ۱۰ دقیقه جهت پرداخت")
def lock_seats_temporarily(req: SeatLockRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    expire_time = now + timedelta(seconds=req.lock_duration_seconds)

    # Check if any seat is already sold or locked
    existing_locks = db.query(ChairInBarname).filter(
        ChairInBarname.run_turn_id == req.run_turn_id,
        ChairInBarname.id.in_(req.seat_ids),
        ChairInBarname.status.in_(["sold", "reserved"])
    ).all()

    for item in existing_locks:
        if item.status == "sold":
            raise HTTPException(status_code=400, detail=f"صندلی {item.id} قبلاً فروخته شده است.")
        if item.status == "reserved" and item.locked_until and item.locked_until > now:
            raise HTTPException(status_code=400, detail=f"صندلی {item.id} در حال حاضر توسط خریدار دیگری در حال پرداخت است.")

    # Lock the seats
    db.query(ChairInBarname).filter(
        ChairInBarname.run_turn_id == req.run_turn_id,
        ChairInBarname.id.in_(req.seat_ids)
    ).update({"status": "reserved", "locked_until": expire_time}, synchronize_session=False)

    db.commit()
    return {
        "success": True,
        "message": "صندلی‌ها به مدت ۱۰ دقیقه قفل گردیدند.",
        "expires_at": expire_time.isoformat()
    }
