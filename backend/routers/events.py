from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Barname, RunTurn, Salon
from ..schemas import BarnameOut

router = APIRouter(prefix="/events", tags=["رویدادها و کنسرت‌ها (Events)"])

@router.get("/", response_model=List[BarnameOut], summary="دریافت لیست رویدادها با فیلتر دسته‌بندی و شهر")
def get_events(
    category: Optional[str] = Query(None, description="دسته‌بندی (concert, theater, comedy, ...)"),
    city: Optional[str] = Query(None, description="نام شهر (مشهد، تهران)"),
    search: Optional[str] = Query(None, description="کلمه کلیدی جهت جستجو در عنوان"),
    db: Session = Depends(get_db)
):
    query = db.query(Barname).filter(Barname.is_active == True)
    if category and category != "all":
        query = query.filter(Barname.category == category)
    if city and city != "همه شهرها":
        query = query.filter(Barname.city == city)
    if search:
        query = query.filter(Barname.title.ilike(f"%{search}%"))

    events = query.all()
    results = []
    for evt in events:
        evt_dict = {
            "id": evt.id,
            "title": evt.title,
            "sub_title": evt.sub_title,
            "category": evt.category,
            "city": evt.city,
            "salon_name": evt.salon.name if evt.salon else "",
            "salon_id": evt.salon_id,
            "date_range": evt.date_range,
            "duration_minutes": evt.duration_minutes,
            "description": evt.description,
            "min_price": evt.min_price,
            "max_price": evt.max_price,
            "banner_gradient": evt.banner_gradient,
            "is_featured": evt.is_featured,
            "run_turns": [
                {
                    "id": rt.id,
                    "date": rt.date,
                    "time": rt.time,
                    "weekday": rt.weekday,
                    "is_sold_out": rt.is_sold_out,
                }
                for rt in evt.run_turns
            ]
        }
        results.append(evt_dict)
    return results

@router.get("/{event_id}", response_model=BarnameOut, summary="دریافت جزئیات کامل رویداد")
def get_event_detail(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Barname).filter(Barname.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="رویداد مورد نظر یافت نشد.")

    return {
        "id": event.id,
        "title": event.title,
        "sub_title": event.sub_title,
        "category": event.category,
        "city": event.city,
        "salon_name": event.salon.name if event.salon else "",
        "salon_id": event.salon_id,
        "date_range": event.date_range,
        "duration_minutes": event.duration_minutes,
        "description": event.description,
        "min_price": event.min_price,
        "max_price": event.max_price,
        "banner_gradient": event.banner_gradient,
        "is_featured": event.is_featured,
        "run_turns": [
            {
                "id": rt.id,
                "date": rt.date,
                "time": rt.time,
                "weekday": rt.weekday,
                "is_sold_out": rt.is_sold_out,
            }
            for rt in event.run_turns
        ]
    }
