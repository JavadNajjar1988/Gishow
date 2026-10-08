import json,uuid,secrets
from datetime import timedelta
from fastapi import APIRouter,Depends,HTTPException,Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel,ConfigDict,Field,StrictInt
from sqlalchemy import update,or_,and_
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import current_user
from ..models import SaleReservation,SaleOrder,SaleTicket,ChairInBarname,Barname,RunTurn,UserList,Salon
from ..services.sales import utcnow,turn_for_sale,owned,reservation_view,order_view,valid_chairs,release
from .discounts import apply_discount
from ..services.payment_service import get_gateway,gateway_for_mode

router=APIRouter(prefix='/sales',tags=['رزرو و سفارش'])
class ReserveInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    run_turn_id:StrictInt=Field(gt=0)
    seat_ids:list[StrictInt]=Field(min_length=1,max_length=10)
class OrderInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    reservation_id:str=Field(min_length=36,max_length=36)
    discount_code:str|None=Field(default=None,pattern=r'^[A-Za-z0-9_-]{3,40}$')

@router.get('/payment-status')
def payment_status(user=Depends(current_user)):
    try:
        gateway=get_gateway()
        return dict(configured=True,mode=gateway.mode)
    except HTTPException:
        return dict(configured=False,mode=None)

@router.get('/reservations')
def my_reservations(db:Session=Depends(get_db),user=Depends(current_user)):
    return [reservation_view(r) for r in db.query(SaleReservation).filter_by(user_id=user.id,status='active').filter(SaleReservation.expires_at>utcnow()).all()]

@router.post('/reservations',status_code=201)
def reserve(body:ReserveInput,db:Session=Depends(get_db),user=Depends(current_user)):
    if len(set(body.seat_ids))!=len(body.seat_ids) or any(id<=0 for id in body.seat_ids):
        raise HTTPException(422,'شناسه صندلی تکراری یا نامعتبر است.')
    now=utcnow()
    account=db.query(UserList).filter_by(id=user.id).populate_existing().with_for_update().one()
    if not account.is_active:raise HTTPException(401,'حساب غیرفعال شده است.')
    holds=db.query(SaleReservation).filter_by(user_id=user.id,status='active').filter(SaleReservation.expires_at>now).all()
    if sum(len(json.loads(h.seat_ids_json)) for h in holds)+len(body.seat_ids)>10:
        raise HTTPException(409,'سقف رزرو هم‌زمان ده صندلی است؛ رزرو قبلی را لغو کنید.')
    turn_for_sale(db,body.run_turn_id)
    row=SaleReservation(id=str(uuid.uuid4()),user_id=user.id,run_turn_id=body.run_turn_id,
        seat_ids_json=json.dumps(sorted(body.seat_ids)),expires_at=now+timedelta(minutes=10),status='active')
    db.add(row);db.flush()
    for id in sorted(body.seat_ids):
        changed=db.execute(update(ChairInBarname).where(ChairInBarname.id==id,
            ChairInBarname.run_turn_id==body.run_turn_id,
            or_(ChairInBarname.status=='available',and_(ChairInBarname.status=='reserved',ChairInBarname.locked_until<=now))
        ).values(status='reserved',locked_until=row.expires_at,reservation_id=row.id))
        if changed.rowcount!=1:
            db.rollback();raise HTTPException(409,'یکی از صندلی‌ها آزاد نیست؛ موجودی را دوباره دریافت کنید.')
    db.commit();return reservation_view(row)

@router.get('/reservations/{id}')
def read_reservation(id:str,db:Session=Depends(get_db),user=Depends(current_user)):
    return reservation_view(owned(db,SaleReservation,id,user))

@router.delete('/reservations/{id}',status_code=204)
def cancel_reservation(id:str,db:Session=Depends(get_db),user=Depends(current_user)):
    row=owned(db,SaleReservation,id,user,True)
    order=db.query(SaleOrder).filter_by(reservation_id=id).first()
    if order and order.authority and row.expires_at>utcnow():raise HTTPException(409,'پرداخت آغاز شده است؛ نتیجه درگاه یا پایان مهلت را بررسی کنید.')
    if row.status=='active':release(db,row);row.status='cancelled'
    if order and order.status=='pending':order.status='cancelled'
    db.commit()

@router.post('/orders',status_code=201)
def create_order(body:OrderInput,db:Session=Depends(get_db),user=Depends(current_user)):
    row=owned(db,SaleReservation,body.reservation_id,user,True)
    existing=db.query(SaleOrder).filter_by(reservation_id=row.id).first()
    if existing:
        if existing.discount_code!=(body.discount_code.upper() if body.discount_code else None):raise HTTPException(409,'مبلغ سفارش ثبت‌شده تغییر نمی‌کند؛ برای انتخاب تخفیف تازه رزرو را دوباره انجام دهید.')
        return order_view(db,existing)
    turn=turn_for_sale(db,row.run_turn_id);chairs=valid_chairs(db,row)
    salon=db.get(Salon,turn.salon_id or turn.barname.salon_id)
    items=[]
    for s in chairs:
        if not 0<=s.price<=9007199254740991 or int(s.price)!=s.price:raise HTTPException(409,'مبلغ صندلی معتبر نیست.')
        items.append(dict(seat_id=s.id,amount_irr=int(s.price),row=s.chair.row_number,number=s.chair.seat_number,
            part_name=s.chair.part.name,event_title=turn.barname.title,run_turn_id=turn.id,
            salon_name=salon.name,address=salon.address,
            starts_at=json.loads(turn.config_json)['starts_at']))
    amount=sum(i['amount_irr'] for i in items)
    if amount<=0 or amount>9007199254740991:raise HTTPException(409,'مبلغ سفارش برای پرداخت معتبر نیست.')
    discount,discount_amount=apply_discount(db,body.discount_code,turn,len(chairs),amount)
    order=SaleOrder(id=str(uuid.uuid4()),reservation_id=row.id,user_id=user.id,amount_irr=amount-discount_amount,
        subtotal_irr=amount,discount_amount_irr=discount_amount,discount_id=discount.id if discount else None,
        discount_code=discount.code if discount else None,customer_name=user.full_name,customer_mobile=user.mobile,
        items_json=json.dumps(items,ensure_ascii=False),status='pending')
    db.add(order);db.commit();return order_view(db,order)

@router.get('/orders')
def my_orders(db:Session=Depends(get_db),user=Depends(current_user)):
    return [order_view(db,o) for o in db.query(SaleOrder).filter_by(user_id=user.id).order_by(SaleOrder.created_at.desc()).limit(100)]

@router.get('/orders/{id}')
def read_order(id:str,db:Session=Depends(get_db),user=Depends(current_user)):
    return order_view(db,owned(db,SaleOrder,id,user))

@router.post('/orders/{id}/payment')
def start_payment(id:str,db:Session=Depends(get_db),user=Depends(current_user),gateway=Depends(get_gateway)):
    order=owned(db,SaleOrder,id,user,True)
    reservation=owned(db,SaleReservation,order.reservation_id,user,True)
    if order.status not in ('pending','payment_pending'):raise HTTPException(409,'سفارش آماده پرداخت نیست.')
    turn_for_sale(db,reservation.run_turn_id);valid_chairs(db,reservation)
    if not order.authority:
        order.authority=gateway.request(order.id,order.amount_irr)
        order.gateway_mode=gateway.mode;order.status='payment_pending';db.commit()
    active_gateway=gateway_for_mode(order.gateway_mode)
    return dict(payment_url=active_gateway.payment_url(order.authority),order_id=order.id)

@router.get('/zarinpal/callback',response_class=HTMLResponse)
def callback(Authority:str=Query(min_length=1,max_length=100),Status:str=Query(pattern='^(OK|NOK)$'),db:Session=Depends(get_db)):
    order=db.query(SaleOrder).filter_by(authority=Authority).with_for_update().first()
    if not order:raise HTTPException(404,'درخواست پرداخت یافت نشد.')
    reservation=db.query(SaleReservation).filter_by(id=order.reservation_id).with_for_update().one()
    if order.ref_id:
        message='پرداخت قبلاً ثبت شده است. نتیجه را در سفارش‌های من ببینید.'
    elif Status=='NOK':
        # A browser query cannot prove the bank did not debit. Keep the hold until its deadline.
        db.commit()
        message='پرداخت تکمیل نشد. بلیتی صادر نشده است.'
    else:
        gateway=gateway_for_mode(order.gateway_mode)
        ref=gateway.verify(order.authority,order.amount_irr)
        turn=db.get(RunTurn,reservation.run_turn_id)
        db.query(Barname).filter_by(id=turn.barname_id).with_for_update().one()
        order.ref_id=ref;order.paid_at=utcnow()
        try:chairs=valid_chairs(db,reservation)
        except HTTPException:
            release(db,reservation);reservation.status='review';order.status='payment_review'
            message='پرداخت تأیید شد، اما مهلت یا موجودی رزرو تغییر کرده است. سفارش برای بررسی ثبت شد؛ بلیتی صادر نشده است.'
        else:
            for chair in chairs:
                chair.status='sold';chair.locked_until=None
                db.add(SaleTicket(id=secrets.token_urlsafe(32),order_id=order.id,seat_id=chair.id))
            reservation.status='completed';order.status='paid'
            message='پرداخت تأیید و بلیت هر صندلی ثبت شد. نتیجه را در سفارش‌های من ببینید.'
        db.commit()
    return '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>نتیجه پرداخت | لیندو تیکت</title><style>body{margin:0;padding:24px;min-height:90vh;display:grid;place-items:center;background:#f8fafc;color:#0f172a;font-family:Tahoma,sans-serif;line-height:2}main{max-width:560px;padding:32px;border:1px solid #e2e8f0;border-radius:24px;background:white;box-shadow:0 12px 36px #0f172a14}small{color:#b45309}a{display:inline-block;background:linear-gradient(110deg,#f59e0b,#ea580c);color:white;text-decoration:none;border-radius:12px;padding:10px 20px;margin-top:16px}@media(prefers-color-scheme:dark){body{background:#020617;color:#f1f5f9}main{background:#0f172a;border-color:#334155}}</style><main><small>لیندو تیکت</small><h1>نتیجه پرداخت</h1><p>'+message+'</p><p>بلیت‌ها و جزئیات را از بخش سفارش‌های من دریافت کنید.</p><a href="/">بازگشت به سایت</a></main></html>'


@router.get('/orders/{id}/receipt',response_class=HTMLResponse)
def receipt(id:str,download:bool=True,db:Session=Depends(get_db),user=Depends(current_user)):
    from ..services.receipts import render_receipt
    order=owned(db,SaleOrder,id,user)
    if order.status!='paid':raise HTTPException(409,'رسید و بلیت فقط برای سفارش تأییدشده قابل دریافت است.')
    return HTMLResponse(render_receipt(db,order),headers={'Content-Disposition':f'{"attachment" if download else "inline"}; filename="gishow-{order.id}.html"',
        'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; img-src data:; style-src 'unsafe-inline'"})
