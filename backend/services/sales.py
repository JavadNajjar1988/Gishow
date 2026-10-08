import json
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import update, or_, and_
from ..models import Barname, RunTurn, ChairInBarname, SaleReservation, SaleOrder
from ..routers.catalog import config, public_event

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def turn_for_sale(db,id):
    turn=db.get(RunTurn,id)
    if not turn:raise HTTPException(404,'سانس یافت نشد.')
    # Same lock order as catalog edits: event first, inventory second.
    db.query(Barname).filter_by(id=turn.barname_id).populate_existing().with_for_update().one()
    db.refresh(turn)
    public_event(db,turn.barname_id)
    data=config(turn)
    if not data.get('is_visible') or turn.is_sold_out:
        raise HTTPException(409,'فروش این سانس در دسترس نیست.')
    if config(turn.barname).get('money_unit')!='IRR':
        raise HTTPException(409,'واحد مبلغ برنامه قدیمی هنوز تعیین نشده است.')
    now=datetime.now(timezone.utc)
    for key,earliest in (('starts_at',False),('sale_starts_at',True),('sale_ends_at',False)):
        value=data.get(key)
        if value:
            boundary=datetime.fromisoformat(value)
            if (earliest and now<boundary) or (not earliest and now>=boundary):
                raise HTTPException(409,'فروش در این زمان مجاز نیست.')
    return turn

def owned(db,model,id,user,lock=False):
    query=db.query(model).filter_by(id=id,user_id=user.id)
    row=(query.with_for_update() if lock else query).first()
    if row is None:raise HTTPException(404,'مورد موردنظر یافت نشد.')
    return row

def reservation_view(row):
    expired=row.expires_at<=utcnow() and row.status=='active'
    return dict(id=row.id,run_turn_id=row.run_turn_id,seat_ids=json.loads(row.seat_ids_json),
                expires_at=row.expires_at.isoformat()+'Z',status='expired' if expired else row.status)

def order_view(db,row):
    from ..models import SaleTicket
    reservation=db.get(SaleReservation,row.reservation_id)
    status='expired' if row.status in ('pending','payment_pending') and reservation.expires_at<=utcnow() else row.status
    return dict(id=row.id,reservation_id=row.reservation_id,status=status,amount_irr=row.amount_irr,
        items=json.loads(row.items_json),expires_at=reservation.expires_at.isoformat()+'Z',
        ref_id=row.ref_id,gateway_mode=row.gateway_mode,paid_at=row.paid_at.isoformat()+'Z' if row.paid_at else None,
        tickets=[dict(id=t.id,seat_id=t.seat_id) for t in db.query(SaleTicket).filter_by(order_id=row.id).all()])

def release(db,reservation):
    db.execute(update(ChairInBarname).where(ChairInBarname.reservation_id==reservation.id,
        ChairInBarname.status=='reserved').values(status='available',locked_until=None,reservation_id=None))

def valid_chairs(db,reservation):
    chairs=db.query(ChairInBarname).filter(ChairInBarname.id.in_(json.loads(reservation.seat_ids_json))).order_by(ChairInBarname.id).with_for_update().all()
    if reservation.status!='active' or reservation.expires_at<=utcnow() or any(
        s.reservation_id!=reservation.id or s.status!='reserved' for s in chairs):
        raise HTTPException(409,'رزرو منقضی یا لغو شده است؛ صندلی‌ها را دوباره انتخاب کنید.')
    return chairs
