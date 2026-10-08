import uuid
from datetime import datetime,timezone
from pydantic import BaseModel,ConfigDict,Field,AwareDatetime,StrictInt,StrictBool,model_validator
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import or_,and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import require,authorize_event,global_allowed,permitted_event_ids
from ..models import SaleDiscount,SaleOrder,SaleReservation,RunTurn
router=APIRouter(prefix='/admin/discounts',tags=['تخفیف'])
class DiscountInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    code:str=Field(pattern=r'^[A-Za-z0-9_-]{3,40}$')
    event_id:StrictInt|None=Field(default=None,gt=0)
    run_turn_id:StrictInt|None=Field(default=None,gt=0)
    percent:StrictInt|None=Field(default=None,gt=0,le=99)
    fixed_amount_irr:StrictInt|None=Field(default=None,gt=0,le=9007199254740991)
    min_seats:StrictInt=Field(default=1,ge=1,le=10)
    max_uses:StrictInt=Field(ge=1,le=1000000)
    starts_at:AwareDatetime
    ends_at:AwareDatetime
    @model_validator(mode='after')
    def valid(self):
        if (self.percent is None)==(self.fixed_amount_irr is None):raise ValueError('یک نوع تخفیف انتخاب کنید.')
        if self.ends_at<=self.starts_at:raise ValueError('بازه تخفیف معتبر نیست.')
        if self.run_turn_id and not self.event_id:raise ValueError('برنامه سانس لازم است.')
        return self
class ActiveInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    is_active:StrictBool
def usage(db,discount,now):
    return db.query(SaleOrder).join(SaleReservation,SaleOrder.reservation_id==SaleReservation.id).filter(
        SaleOrder.discount_id==discount.id,or_(SaleOrder.status=='paid',and_(SaleOrder.status.in_(['pending','payment_pending']),
        SaleReservation.status=='active',SaleReservation.expires_at>now))).count()
def view(db,row):
    now=datetime.now(timezone.utc).replace(tzinfo=None)
    return dict(id=row.id,code=row.code,event_id=row.event_id,run_turn_id=row.run_turn_id,percent=row.percent,
        fixed_amount_irr=row.fixed_amount_irr,min_seats=row.min_seats,max_uses=row.max_uses,
        starts_at=row.starts_at.isoformat()+'Z',ends_at=row.ends_at.isoformat()+'Z',is_active=row.is_active,
        claimed_uses=usage(db,row,now))
@router.get('')
def listing(db:Session=Depends(get_db),user=Depends(require('events.manage'))):
    ids=permitted_event_ids(db,user,'events.manage');query=db.query(SaleDiscount)
    if ids is not None:query=query.filter(SaleDiscount.event_id.in_(ids))
    return [view(db,d) for d in query.order_by(SaleDiscount.code).all()]
@router.post('',status_code=201)
def create(body:DiscountInput,db:Session=Depends(get_db),user=Depends(require('events.manage'))):
    if body.event_id:authorize_event(db,user,'events.manage',body.event_id)
    elif not global_allowed(db,user,'events.manage'):raise HTTPException(403,'تخفیف سراسری نیازمند دسترسی سراسری است.')
    if body.run_turn_id:
        turn=db.get(RunTurn,body.run_turn_id)
        if not turn or turn.barname_id!=body.event_id:raise HTTPException(422,'سانس متعلق به برنامه نیست.')
    data=body.model_dump();data['code']=body.code.upper()
    for key in ('starts_at','ends_at'):data[key]=data[key].astimezone(timezone.utc).replace(tzinfo=None)
    row=SaleDiscount(id=str(uuid.uuid4()),**data,is_active=True);db.add(row)
    try:db.commit()
    except IntegrityError:db.rollback();raise HTTPException(409,'کد تخفیف تکراری یا برنامه نامعتبر است.')
    return view(db,row)
@router.patch('/{id}')
def activate(id:str,body:ActiveInput,db:Session=Depends(get_db),user=Depends(require('events.manage'))):
    row=db.query(SaleDiscount).filter_by(id=id).with_for_update().first()
    if not row:raise HTTPException(404,'کد یافت نشد.')
    if row.event_id:authorize_event(db,user,'events.manage',row.event_id)
    elif not global_allowed(db,user,'events.manage'):raise HTTPException(403,'دسترسی سراسری لازم است.')
    row.is_active=body.is_active;db.commit();return view(db,row)

def apply_discount(db,code,turn,count,subtotal):
    if not code:return None,0
    now=datetime.now(timezone.utc).replace(tzinfo=None)
    row=db.query(SaleDiscount).filter_by(code=code.upper()).populate_existing().with_for_update().first()
    if not row or not row.is_active or not row.starts_at<=now<row.ends_at or count<row.min_seats or (
        row.event_id and row.event_id!=turn.barname_id) or (row.run_turn_id and row.run_turn_id!=turn.id):
        raise HTTPException(409,'کد تخفیف برای این سفارش معتبر نیست.')
    if usage(db,row,now)>=row.max_uses:raise HTTPException(409,'سقف استفاده از کد تخفیف پر شده است.')
    amount=(subtotal*row.percent+50)//100 if row.percent else row.fixed_amount_irr
    if amount>=subtotal:raise HTTPException(409,'این تخفیف برای مبلغ سفارش قابل استفاده نیست.')
    return row,amount
