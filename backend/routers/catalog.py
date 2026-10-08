"""Persisted catalog, isolated from the legacy price/date contract."""
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Literal, Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import update
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Salon, PartOfSalon, ChairInPart, Barname, RunTurn, ChairInBarname, FactorList, EventRole, EventImage, SaleReservation, SaleDiscount
from ..posters import normalize_poster, MAX_UPLOAD_BYTES
from ..security import require, global_allowed, permitted_event_ids, authorize_event

router = APIRouter(tags=['مدیریت فهرست و پلان'])
SAFE_MONEY = 9007199254740991

def config(row):
    return json.loads(row.config_json or '{}')

def dump(value):
    return json.dumps(value, ensure_ascii=False)

def find(db, model, id):
    row = db.get(model, id)
    if row is None:
        raise HTTPException(404, 'مورد موردنظر یافت نشد.')
    return row

class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

class LayoutRect(Input):
    x: float = Field(ge=0, le=100, allow_inf_nan=False)
    y: float = Field(ge=0, le=100, allow_inf_nan=False)
    width: float = Field(ge=2, le=100, allow_inf_nan=False)
    height: float = Field(ge=2, le=100, allow_inf_nan=False)

    @model_validator(mode='after')
    def bounds(self):
        if self.x + self.width > 100 or self.y + self.height > 100:
            raise ValueError('محدوده عنصر از کادر سالن بیرون است.')
        return self

class PlanFixture(LayoutRect):
    id: str = Field(min_length=1, max_length=80)
    kind: Literal['aisle', 'door']
    label: str = Field(min_length=1, max_length=100)

class FloorPlan(Input):
    stage: LayoutRect
    fixtures: list[PlanFixture] = Field(default_factory=list, max_length=30)

    @model_validator(mode='after')
    def unique_ids(self):
        if len({f.id for f in self.fixtures}) != len(self.fixtures):
            raise ValueError('شناسه عناصر چیدمان تکراری است.')
        if any(f.id == 'stage' or f.id.startswith('part:') for f in self.fixtures):
            raise ValueError('شناسه عنصر چیدمان معتبر نیست.')
        return self

class PlanPart(Input):
    id: int | None = Field(None, gt=0)
    name: str = Field(min_length=1, max_length=100)
    tier: Literal['vip', 'ground', 'balcony', 'lodge'] = 'ground'
    rows: int = Field(ge=1, le=100, strict=True)
    seats_per_row: int = Field(ge=1, le=100, strict=True)
    amount_irr: int = Field(ge=0, le=SAFE_MONEY, strict=True)
    shape: Literal['straight', 'arc', 'angled_left', 'angled_right'] = 'straight'
    is_accessible: bool = False
    door_access: str = Field('', max_length=200)
    placement: LayoutRect | None = None
    aisle_after: list[Annotated[int, Field(strict=True, ge=1, le=99)]] = Field(default_factory=list, max_length=20)

    @model_validator(mode='after')
    def aisles(self):
        if len(set(self.aisle_after)) != len(self.aisle_after) or any(type(n) is not int or n < 1 or n >= self.seats_per_row for n in self.aisle_after):
            raise ValueError('راهرو باید بین شماره‌های معتبر صندلی باشد.')
        return self

class SalonInput(Input):
    name: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    address: str = Field('', max_length=500)
    is_active: bool = True
    layout_template: Literal['arena', 'theater', 'blackbox', 'cinema', 'custom'] = 'theater'
    stage_position: Literal['top', 'center', 'thrust', 'bottom'] = 'top'
    aisles_count: int = Field(2, ge=0, le=20, strict=True)
    version: int = Field(0, ge=0, strict=True)
    parts: list[PlanPart] = Field(min_length=1, max_length=30)
    floor_plan: FloorPlan | None = None

    @model_validator(mode='after')
    def unique_parts(self):
        if len({p.name for p in self.parts}) != len(self.parts):
            raise ValueError('نام جایگاه‌ها تکراری است.')
        ids = [p.id for p in self.parts if p.id is not None]
        if len(set(ids)) != len(ids):
            raise ValueError('شناسه جایگاه‌ها تکراری است.')
        if sum(p.rows * p.seats_per_row for p in self.parts) > 20000:
            raise ValueError('ظرفیت پلان بیش از حد مجاز است.')
        if self.floor_plan and any(p.placement is None for p in self.parts):
            raise ValueError('در چیدمان اختصاصی، محل همه جایگاه‌ها لازم است.')
        return self

class EventInput(Input):
    title: str = Field(min_length=1, max_length=250)
    salon_id: int = Field(gt=0, strict=True)
    category: Literal['concert', 'theater', 'comedy', 'cinema', 'conference'] = 'concert'
    sub_title: str = Field('', max_length=300)
    description: str = Field('', max_length=20000)
    duration_minutes: int = Field(90, ge=1, le=1440, strict=True)
    rules: list[str] = Field(default_factory=list, max_length=100)
    cast: list[dict[str, str]] = Field(default_factory=list, max_length=100)
    is_featured: bool = False
    publication_status: Literal['draft', 'published', 'archived'] = 'draft'
    ticket_description: str = Field('', max_length=2000)
    language: Literal['fa', 'en'] = 'fa'

class PartPrice(Input):
    part_id: int = Field(gt=0, strict=True)
    amount_irr: int = Field(ge=0, le=SAFE_MONEY, strict=True)

class TurnInput(Input):
    salon_id: int = Field(gt=0, strict=True)
    starts_at: datetime
    sale_starts_at: datetime | None = None
    sale_ends_at: datetime | None = None
    is_visible: bool = True
    description: str = Field('', max_length=2000)
    part_prices: list[PartPrice] = Field(min_length=1, max_length=30)

    @model_validator(mode='after')
    def dates(self):
        for date in (self.starts_at, self.sale_starts_at, self.sale_ends_at):
            if date and date.utcoffset() is None:
                raise ValueError('زمان باید دارای اختلاف ساعت باشد.')
        if self.sale_starts_at and self.sale_ends_at and self.sale_ends_at < self.sale_starts_at:
            raise ValueError('پایان فروش پیش از شروع فروش است.')
        if self.sale_ends_at and self.sale_ends_at > self.starts_at:
            raise ValueError('پایان فروش پس از شروع برنامه است.')
        if len({p.part_id for p in self.part_prices}) != len(self.part_prices):
            raise ValueError('قیمت جایگاه تکراری است.')
        return self

def salon_view(salon):
    return dict(id=salon.id, name=salon.name, city=salon.city, address=salon.address or '',
        capacity=salon.capacity, version=salon.plan_version, **config(salon), parts=[dict(
            id=p.id, name=p.name, tier=p.tier, rows=p.rows, seats_per_row=p.seats_per_row,
            amount_irr=int(p.default_price) if config(salon).get('money_unit') == 'IRR' else None,
            **config(p), seats=[dict(id=c.id, row=c.row_number, number=c.seat_number) for c in sorted(p.chairs, key=lambda c: (c.row_number,c.seat_number))]
        ) for p in sorted(salon.parts, key=lambda p: config(p).get('sort_order', p.id))])

def save_salon(db, salon, body):
    if salon.parts and config(salon).get('money_unit') != 'IRR':
        raise HTTPException(409, 'واحد مبلغ پلان قدیمی نامشخص است؛ ابتدا داده‌های قدیمی بررسی شوند.')
    changed = db.execute(update(Salon).where(Salon.id == salon.id, Salon.plan_version == body.version)
        .values(plan_version=body.version + 1), execution_options={'synchronize_session': False}).rowcount
    if not changed:
        raise HTTPException(409, 'پلان هم‌زمان تغییر کرده است؛ دوباره دریافت کنید.')
    old_parts = {p.id: p for p in salon.parts}
    ids = {p.id for p in body.parts if p.id is not None}
    if not ids.issubset(old_parts):
        raise HTTPException(422, 'جایگاه متعلق به این سالن نیست.')
    # Once inventory references a chair, never silently rebuild or remove it.
    chair_ids = [c.id for p in salon.parts for c in p.chairs]
    used = db.query(ChairInBarname.id).filter(ChairInBarname.chair_id.in_(chair_ids)).first() is not None
    dimensions_changed = ids != set(old_parts) or any(p.id is None or
        (p.rows, p.seats_per_row) != (old_parts[p.id].rows, old_parts[p.id].seats_per_row) for p in body.parts)
    if used and dimensions_changed:
        raise HTTPException(409, 'پلان در سانس استفاده شده است؛ تغییر تعداد یا هویت صندلی مجاز نیست.')
    for old in list(salon.parts):
        if old.id not in ids:
            db.delete(old)
    for order, part in enumerate(body.parts):
        stored = old_parts.get(part.id)
        if stored is None:
            stored = PartOfSalon(salon_id=salon.id)
            db.add(stored)
        stored.name, stored.tier = part.name, part.tier
        stored.rows, stored.seats_per_row = part.rows, part.seats_per_row
        stored.default_price = part.amount_irr
        stored.config_json = dump(dict(shape=part.shape, is_accessible=part.is_accessible,
            door_access=part.door_access, sort_order=order,
            placement=part.placement.model_dump() if part.placement else None, aisle_after=part.aisle_after))
        db.flush()
        old_chairs = {(c.row_number,c.seat_number): c for c in stored.chairs}
        wanted = {(r,n) for r in range(1,part.rows+1) for n in range(1,part.seats_per_row+1)}
        for key,c in old_chairs.items():
            if key not in wanted:
                db.delete(c)
        for r,n in wanted - set(old_chairs):
            db.add(ChairInPart(part_id=stored.id, row_number=r, seat_number=n))
    salon.name, salon.city, salon.address = body.name, body.city, body.address
    salon.capacity = sum(p.rows*p.seats_per_row for p in body.parts)
    salon.config_json = dump(dict(is_active=body.is_active, layout_template=body.layout_template,
        stage_position=body.stage_position, aisles_count=body.aisles_count, money_unit='IRR',
        floor_plan=body.floor_plan.model_dump() if body.floor_plan else None))
    db.commit()
    db.expire_all()
    return salon_view(find(db, Salon, salon.id))

@router.get('/admin/catalog/salons')
def salons(db: Session = Depends(get_db), user=Depends(require('salons.manage'))):
    return [salon_view(s) for s in db.query(Salon).order_by(Salon.id).all()]

@router.get('/admin/catalog/venue-options')
def venue_options(db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    return [salon_view(s) for s in db.query(Salon).order_by(Salon.id).all()
        if config(s).get('money_unit') == 'IRR' and config(s).get('is_active',True)]

@router.post('/admin/catalog/salons', status_code=201)
def create_salon(body: SalonInput, db: Session = Depends(get_db), user=Depends(require('salons.manage'))):
    if body.version or any(p.id for p in body.parts):
        raise HTTPException(422, 'سالن تازه نباید شناسه جایگاه یا نسخه قبلی داشته باشد.')
    salon = Salon(name=body.name, city=body.city)
    db.add(salon); db.flush()
    return save_salon(db, salon, body)

@router.patch('/admin/catalog/salons/{id}')
def edit_salon(id: int, body: SalonInput, db: Session = Depends(get_db), user=Depends(require('salons.manage'))):
    return save_salon(db, find(db, Salon, id), body)

@router.get('/admin/catalog/salons/{id}/plan')
def get_plan(id: int, db: Session = Depends(get_db), user=Depends(require('salons.manage'))):
    return salon_view(find(db, Salon, id))

@router.delete('/admin/catalog/salons/{id}', status_code=204)
def delete_salon(id: int, db: Session = Depends(get_db), user=Depends(require('salons.manage'))):
    salon = find(db, Salon, id)
    if db.query(Barname.id).filter_by(salon_id=id).first() or db.query(RunTurn.id).filter_by(salon_id=id).first():
        raise HTTPException(409, 'سالن به برنامه یا سانس متصل است و حذف نمی‌شود.')
    db.delete(salon); db.commit()
    return Response(status_code=204)

def available(row):
    return row.status == 'available' or (row.status == 'reserved' and row.locked_until is not None and row.locked_until < datetime.utcnow())

def turn_view(db, turn):
    data = config(turn)
    salon = find(db, Salon, turn.salon_id or turn.barname.salon_id)
    inventory = db.query(ChairInBarname).filter_by(run_turn_id=turn.id).all()
    return dict(id=turn.id, event_id=turn.barname_id, salon_id=salon.id, salon_name=salon.name,
        salon_address=salon.address or '', date=turn.date, time=turn.time, weekday=turn.weekday,
        available_seats=0 if turn.is_sold_out else sum(available(s) for s in inventory),
        total_seats=len(inventory), is_sold_out=turn.is_sold_out, **data)

def event_view(db, event, public=False):
    data = config(event)
    turns = [t for t in event.run_turns if not public or config(t).get('is_visible', False)]
    prices = [s.price for t in turns for s in t.chair_statuses]
    return dict(id=event.id, title=event.title, sub_title=event.sub_title, category=event.category,
        city=event.city, salon_id=event.salon_id, salon_name=event.salon.name, address=event.salon.address or '',
        date_range=event.date_range, duration_minutes=event.duration_minutes, description=event.description,
        cast=json.loads(event.cast_json or '[]'), min_price=min(prices,default=0), max_price=max(prices,default=0),
        is_featured=event.is_featured, is_active=event.is_active, **data,
        images=[image_view(image) for image in event.images],
        run_turns=[turn_view(db,t) for t in turns])

def image_view(image):
    revision = image.content_hash[:16]
    return dict(id=image.id, event_id=image.event_id, alt=image.alt, width=image.width, height=image.height,
        url=f'/api/catalog/images/{image.id}?v={revision}',
        preview_url=f'/api/admin/catalog/events/{image.event_id}/images/{image.id}?v={revision}')

@router.post('/admin/catalog/events/{id}/images', status_code=201)
def upload_image(id: int, file: UploadFile = File(...), alt: str = Form('', max_length=500),
                 db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    event = scoped_event(db,user,id,'events.manage')
    try:
        content = file.file.read(MAX_UPLOAD_BYTES + 1)
    finally:
        file.file.close()
    normalized,width,height = normalize_poster(content)
    image = db.query(EventImage).filter_by(event_id=event.id).first()
    if image is None:
        image = EventImage(event_id=event.id); db.add(image)
    image.content, image.width, image.height = normalized,width,height
    image.content_hash, image.alt = hashlib.sha256(normalized).hexdigest(),alt.strip()
    db.commit(); db.refresh(image)
    return image_view(image)

@router.get('/admin/catalog/events/{id}/images/{image_id}')
def preview_image(id: int, image_id: int, db: Session = Depends(get_db), user=Depends(require('events.read'))):
    authorize_event(db,user,'events.read',id)
    image = find(db,EventImage,image_id)
    if image.event_id != id:
        raise HTTPException(404,'تصویر متعلق به برنامه نیست.')
    return Response(image.content, media_type='image/webp', headers={'Cache-Control':'no-store'})

@router.delete('/admin/catalog/events/{id}/images/{image_id}', status_code=204)
def delete_image(id: int, image_id: int, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    scoped_event(db,user,id,'events.manage')
    image = find(db,EventImage,image_id)
    if image.event_id != id:
        raise HTTPException(404,'تصویر متعلق به برنامه نیست.')
    db.delete(image); db.commit()
    return Response(status_code=204)

@router.get('/catalog/images/{image_id}')
def public_image(image_id: int, db: Session = Depends(get_db)):
    image = find(db,EventImage,image_id)
    public_event(db,image.event_id)
    return Response(image.content, media_type='image/webp', headers={'Cache-Control':'no-store'})

def scoped_event(db,user,id,permission):
    authorize_event(db,user,permission,id)
    event = db.query(Barname).filter_by(id=id).with_for_update().first()
    if event is None:
        raise HTTPException(404, 'برنامه یافت نشد.')
    return event

@router.get('/admin/catalog/events')
def admin_events(db: Session = Depends(get_db), user=Depends(require('events.read'))):
    ids = permitted_event_ids(db,user,'events.read')
    query = db.query(Barname)
    if ids is not None:
        query = query.filter(Barname.id.in_(ids))
    return [event_view(db,e) for e in query.all()]

def save_event(db,event,body):
    if event.id and config(event).get('money_unit') != 'IRR':
        raise HTTPException(409,'تبدیل قرارداد برنامه قدیمی نیازمند بررسی داده‌هاست.')
    salon = find(db,Salon,body.salon_id)
    if config(salon).get('money_unit') != 'IRR':
        raise HTTPException(409,'پلان سالن باید ابتدا با واحد مبلغ مشخص ذخیره شود.')
    for field in ('title','sub_title','category','description','duration_minutes','salon_id','is_featured'):
        setattr(event,field,getattr(body,field))
    event.city = salon.city
    event.cast_json = dump(body.cast)
    event.is_active = body.publication_status == 'published'
    event.config_json = dump(dict(publication_status=body.publication_status, rules=body.rules,
        ticket_description=body.ticket_description, language=body.language, money_unit='IRR'))
    db.commit(); db.refresh(event)
    return event_view(db,event)

@router.post('/admin/catalog/events', status_code=201)
def create_event(body: EventInput, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    if not global_allowed(db,user,'events.manage'):
        raise HTTPException(403,'ساخت برنامه تازه نیاز به مجوز سراسری دارد.')
    event = Barname(salon_id=body.salon_id,title=body.title,date_range='')
    db.add(event)
    return save_event(db,event,body)

@router.patch('/admin/catalog/events/{id}')
def edit_event(id: int, body: EventInput, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    return save_event(db,scoped_event(db,user,id,'events.manage'),body)

@router.delete('/admin/catalog/events/{id}', status_code=204)
def delete_event(id: int, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    event = scoped_event(db,user,id,'events.manage')
    if db.query(SaleDiscount.id).filter_by(event_id=id).first() or event.run_turns or db.query(EventRole).filter_by(event_id=id).first():
        raise HTTPException(409,'برنامه دارای سانس یا دسترسی تخصیص‌یافته است؛ آن را بایگانی کنید.')
    db.delete(event); db.commit()
    return Response(status_code=204)

def save_turn(db,event,turn,body):
    if turn.id and not turn.config_json:
        raise HTTPException(409,'تبدیل قرارداد سانس قدیمی نیازمند بررسی داده‌هاست.')
    salon = db.query(Salon).filter_by(id=body.salon_id).with_for_update().first()
    if salon is None:
        raise HTTPException(404,'سالن یافت نشد.')
    if config(salon).get('money_unit') != 'IRR' or not config(salon).get('is_active',True):
        raise HTTPException(409,'پلان سالن فعال با واحد مبلغ مشخص لازم است.')
    part_prices = {p.part_id:p.amount_irr for p in body.part_prices}
    if set(part_prices) != {p.id for p in salon.parts}:
        raise HTTPException(422,'قیمت تمام جایگاه‌های همین سالن لازم است.')
    inventory = db.query(ChairInBarname).filter_by(run_turn_id=turn.id).all() if turn.id else []
    has_factors = turn.id and (db.query(FactorList.id).filter_by(run_turn_id=turn.id).first() or db.query(SaleReservation.id).filter_by(run_turn_id=turn.id).first())
    changing_inventory = (turn.salon_id is not None and turn.salon_id != salon.id) or any(
        s.price != part_prices.get(s.chair.part_id) for s in inventory)
    if changing_inventory and (has_factors or any(not available(s) for s in inventory)):
        raise HTTPException(409,'سانس دارای بلیت یا صندلی غیرآزاد است؛ تغییر سالن یا قیمت مجاز نیست.')
    if changing_inventory:
        for s in inventory:
            db.delete(s)
        inventory = []
    turn.salon_id = salon.id
    local = body.starts_at.astimezone(timezone(timedelta(hours=3,minutes=30)))
    turn.date, turn.time, turn.weekday = local.date().isoformat(),local.strftime('%H:%M'),''
    turn.config_json = dump(body.model_dump(mode='json'))
    # IDs are columns, not duplicated in metadata.
    metadata = config(turn); metadata.pop('salon_id'); turn.config_json = dump(metadata)
    db.add(turn); db.flush()
    if not inventory:
        db.add_all([ChairInBarname(run_turn_id=turn.id,chair_id=c.id,status='available',price=part_prices[p.id])
            for p in salon.parts for c in p.chairs])
    db.commit(); db.refresh(turn)
    return turn_view(db,turn)

@router.post('/admin/catalog/events/{id}/run-turns', status_code=201)
def create_turn(id: int, body: TurnInput, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    event = scoped_event(db,user,id,'events.manage')
    return save_turn(db,event,RunTurn(barname_id=event.id),body)

@router.patch('/admin/catalog/events/{id}/run-turns/{turn_id}')
def edit_turn(id: int, turn_id: int, body: TurnInput, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    event = scoped_event(db,user,id,'events.manage')
    turn = find(db,RunTurn,turn_id)
    if turn.barname_id != id:
        raise HTTPException(404,'سانس متعلق به برنامه نیست.')
    return save_turn(db,event,turn,body)

@router.delete('/admin/catalog/events/{id}/run-turns/{turn_id}', status_code=204)
def delete_turn(id: int, turn_id: int, db: Session = Depends(get_db), user=Depends(require('events.manage'))):
    scoped_event(db,user,id,'events.manage')
    turn = find(db,RunTurn,turn_id)
    if turn.barname_id != id:
        raise HTTPException(404,'سانس متعلق به برنامه نیست.')
    if turn.factors or db.query(SaleReservation.id).filter_by(run_turn_id=turn.id).first() or any(not available(s) for s in turn.chair_statuses):
        raise HTTPException(409,'سانس دارای بلیت یا صندلی غیرآزاد است و حذف نمی‌شود.')
    db.delete(turn); db.commit()
    return Response(status_code=204)

def public_event(db,id):
    event = find(db,Barname,id)
    if not event.is_active or config(event).get('publication_status') != 'published':
        raise HTTPException(404,'برنامه منتشر نشده است.')
    return event

@router.get('/catalog/events')
def public_events(db: Session = Depends(get_db)):
    return [event_view(db,e,True) for e in db.query(Barname).filter_by(is_active=True).all()
        if config(e).get('publication_status') == 'published']

@router.get('/catalog/events/{id}')
def public_detail(id: int, db: Session = Depends(get_db)):
    return event_view(db,public_event(db,id),True)

@router.get('/catalog/run-turns/{id}/salon')
def public_salon(id: int, db: Session = Depends(get_db)):
    turn = find(db,RunTurn,id); public_event(db,turn.barname_id)
    if not config(turn).get('is_visible'):
        raise HTTPException(404,'سانس نمایش داده نمی‌شود.')
    return salon_view(find(db,Salon,turn.salon_id or turn.barname.salon_id))

@router.get('/catalog/run-turns/{id}/seats')
def public_seats(id: int, db: Session = Depends(get_db)):
    turn = find(db,RunTurn,id); public_event(db,turn.barname_id)
    if not config(turn).get('is_visible'):
        raise HTTPException(404,'سانس نمایش داده نمی‌شود.')
    return [dict(id=s.id,chair_id=s.chair_id,part_id=s.chair.part_id,part_name=s.chair.part.name,
        row=s.chair.row_number,number=s.chair.seat_number,price_irr=int(s.price),
        status='available' if available(s) and not turn.is_sold_out else (s.status if s.status != 'available' else 'blocked'))
        for s in db.query(ChairInBarname).filter_by(run_turn_id=id).all()]
