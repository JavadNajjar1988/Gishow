import json
import pytest
from sqlalchemy import select
from backend.models import Salon, ChairInBarname, Barname, RunTurn, UserPermission, PartOfSalon, Role, RolePermission
from backend.tests.test_accounts import site, register, promote, grant_event

SALONS = '/api/admin/catalog/salons'
EVENTS = '/api/admin/catalog/events'

def salon_body(name='سالن آزمایشی'):
    return dict(name=name,city='تهران',address='نشانی آزمایشی',parts=[dict(name='همکف',rows=2,seats_per_row=3,amount_irr=1200000)])

def admin(site):
    client,factory = site
    id = register(client)['user']['id']; promote(factory,id)
    return client,factory,id

def create_salon(client,name='سالن آزمایشی'):
    result = client.post(SALONS,json=salon_body(name))
    assert result.status_code == 201,result.text
    return result.json()

def event_body(salon_id, published=False):
    return dict(title='برنامه آزمایشی',salon_id=salon_id,publication_status='published' if published else 'draft')

def create_event(client,salon_id,published=False):
    result = client.post(EVENTS,json=event_body(salon_id,published))
    assert result.status_code == 201,result.text
    return result.json()

def turn_body(salon):
    return dict(salon_id=salon['id'],starts_at='2026-11-15T18:30:00+03:30',
        part_prices=[dict(part_id=p['id'],amount_irr=1200000) for p in salon['parts']])

def edit_body(salon):
    body = salon_body(salon['name']);body['version']=salon['version']
    body['parts'][0]['id']=salon['parts'][0]['id']
    return body

def test_catalog_anonymous_customer_and_header(site):
    client,factory=site
    assert client.get(SALONS).status_code==401
    assert client.post(SALONS,json=salon_body()).status_code==401
    register(client)
    assert client.get(SALONS).status_code==403
    assert client.post(SALONS,json=salon_body()).status_code==403
    client.headers.pop('X-Gishow-Request')
    assert client.post(SALONS,json=salon_body()).status_code==403

def test_plan_persistence_identity_version_and_atomic_failure(site):
    client,factory,_=admin(site)
    salon=create_salon(client)
    assert salon['capacity']==6 and salon['version']==1
    ids=[s['id'] for s in salon['parts'][0]['seats']]
    assert len(set(ids))==6
    body=edit_body(salon);body['name']='نام ویرایش‌شده'
    result=client.patch(f"{SALONS}/{salon['id']}",json=body)
    assert result.status_code==200,result.text
    assert [s['id'] for s in result.json()['parts'][0]['seats']]==ids
    assert client.patch(f"{SALONS}/{salon['id']}",json=body).status_code==409
    # New sessions still read the same persisted plan; stale failed writes are rolled back.
    with factory() as db:
        stored=db.get(Salon,salon['id'])
        assert stored.name=='نام ویرایش‌شده' and stored.plan_version==2
    bad=edit_body(result.json());bad['parts'][0]['id']=999999
    assert client.patch(f"{SALONS}/{salon['id']}",json=bad).status_code==422
    assert client.get(f"{SALONS}/{salon['id']}/plan").json()['version']==2
    invalid=salon_body();invalid['parts'][0]['amount_irr']=0.5
    assert client.post(SALONS,json=invalid).status_code==422
    invalid=salon_body();invalid['parts'][0]['amount_irr']=9007199254740992
    assert client.post(SALONS,json=invalid).status_code==422

def test_independent_venues_inventory_and_draft_visibility(site):
    client,factory,_=admin(site)
    first=create_salon(client,'سالن نخست');second=create_salon(client,'سالن دوم')
    event=create_event(client,first['id'])
    assert client.get('/api/catalog/events').json()==[]
    assert client.get(f"/api/catalog/events/{event['id']}").status_code==404
    assert client.get(f"/api/events/{event['id']}").status_code==404
    turns=[]
    for salon in (first,second):
        result=client.post(f"{EVENTS}/{event['id']}/run-turns",json=turn_body(salon))
        assert result.status_code==201,result.text
        turn=result.json();turns.append(turn)
        assert turn['available_seats']==6 and turn['total_seats']==6
        assert turn['salon_id']==salon['id']
        assert client.get(f"/api/catalog/run-turns/{turn['id']}/seats").status_code==404
    assert client.patch(f"{EVENTS}/{event['id']}",json=event_body(first['id'],True)).status_code==200
    public=client.get('/api/catalog/events').json()[0]
    assert [t['salon_id'] for t in public['run_turns']]==[first['id'],second['id']]
    for turn,salon in zip(turns,(first,second)):
        assert client.get(f"/api/catalog/run-turns/{turn['id']}/salon").json()['name']==salon['name']
        response=client.get(f"/api/catalog/run-turns/{turn['id']}/seats")
        assert response.headers['cache-control']=='no-store'
        seats=response.json();assert len(seats)==6
        assert {s['price_irr'] for s in seats}=={1200000}
        with factory() as db:
            db.get(ChairInBarname,seats[0]['id']).status='sold';db.commit()
        public=client.get(f"/api/catalog/events/{event['id']}").json()
        assert next(t for t in public['run_turns'] if t['id']==turn['id'])['available_seats']==5
    assert client.delete(f"{SALONS}/{first['id']}").status_code==409
    body=edit_body(first);body['parts'][0]['rows']=3
    assert client.patch(f"{SALONS}/{first['id']}",json=body).status_code==409
    assert client.post('/api/seats/lock',json={'run_turn_id':turns[0]['id'],'seat_ids':[seats[0]['id']]}).status_code==501
    assert client.post('/api/checkout/process',json={'run_turn_id':turns[0]['id'],'seat_ids':[seats[0]['id']],
        'customer_name':'آزمایشی','customer_mobile':'09123456789','customer_national_code':'0000000000'}).status_code==501

def test_event_scope_parent_and_revocation(site):
    client,factory,_=admin(site)
    salon=create_salon(client)
    first=create_event(client,salon['id']);second=create_event(client,salon['id'])
    turn=client.post(f"{EVENTS}/{second['id']}/run-turns",json=turn_body(salon)).json()
    # An authorized administrator still cannot reparent another event's turn.
    assert client.patch(f"{EVENTS}/{first['id']}/run-turns/{turn['id']}",json=turn_body(salon)).status_code==404
    client.post('/api/auth/logout')
    customer=register(client,'09100000001')['user']['id'];grant_event(factory,customer,first['id'])
    assert [e['id'] for e in client.get(EVENTS).json()]==[first['id']]
    assert client.patch(f"{EVENTS}/{second['id']}",json=event_body(salon['id'])).status_code==403
    assert client.post(f"{EVENTS}/{first['id']}/run-turns",json=turn_body(salon)).status_code==403
    with factory() as db:
        role=Role(code='catalog_editor',name='ویرایشگر برنامه',scope='event');db.add(role);db.flush()
        db.add_all([RolePermission(role_id=role.id,permission_code=p) for p in ('events.read','events.manage')]);db.commit()
    grant_event(factory,customer,first['id'],role='catalog_editor')
    assert client.patch(f"{EVENTS}/{first['id']}",json=event_body(salon['id'])).status_code==200
    assert client.patch(f"{EVENTS}/{second['id']}",json=event_body(salon['id'])).status_code==403
    assert client.post(EVENTS,json=event_body(salon['id'])).status_code==403
    with factory() as db:
        db.add(UserPermission(user_id=customer,permission_code='events.read',allowed=False));db.commit()
    assert client.get(EVENTS).status_code==403

def test_datetime_and_price_validation(site):
    client,factory,_=admin(site)
    salon=create_salon(client);event=create_event(client,salon['id'])
    url=f"{EVENTS}/{event['id']}/run-turns"
    for modify in (
        lambda b:b.update(starts_at='2026-11-15T18:30:00'),
        lambda b:b.update(sale_starts_at='2026-11-15T17:00:00+03:30',sale_ends_at='2026-11-15T16:00:00+03:30'),
        lambda b:b.update(part_prices=[dict(part_id=99999,amount_irr=100)]),
    ):
        body=turn_body(salon);modify(body)
        assert client.post(url,json=body).status_code==422
    with factory() as db:
        assert db.query(RunTurn).count()==0

def test_sold_turn_cannot_change_venue_price_or_delete(site):
    client,factory,_=admin(site)
    salon=create_salon(client);other=create_salon(client,'دیگر');event=create_event(client,salon['id'])
    base=f"{EVENTS}/{event['id']}/run-turns"
    turn=client.post(base,json=turn_body(salon)).json()
    with factory() as db:
        chair=db.query(ChairInBarname).filter_by(run_turn_id=turn['id']).first()
        chair.status='sold';db.commit()
    assert client.patch(f"{base}/{turn['id']}",json=turn_body(other)).status_code==409
    body=turn_body(salon);body['part_prices'][0]['amount_irr']=100
    assert client.patch(f"{base}/{turn['id']}",json=body).status_code==409
    assert client.delete(f"{base}/{turn['id']}").status_code==409

def test_legacy_units_are_not_silently_reinterpreted(site):
    client,factory,_=admin(site)
    with factory() as db:
        salon=Salon(name='سالن قدیمی',city='تهران');db.add(salon);db.flush()
        db.add(PartOfSalon(salon_id=salon.id,name='قدیمی',rows=2,seats_per_row=3,default_price=12345))
        event=Barname(salon_id=salon.id,title='برنامه قدیمی',date_range='قدیمی');db.add(event);db.commit()
        sid,eid=salon.id,event.id
    saved=client.get(f"{SALONS}/{sid}/plan").json()
    assert saved['parts'][0]['amount_irr'] is None
    assert client.patch(f"{SALONS}/{sid}",json=edit_body(saved)).status_code==409
    assert client.patch(f"{EVENTS}/{eid}",json=event_body(sid)).status_code==409
    assert client.get('/api/catalog/events').json()==[]
    with factory() as db:
        assert db.get(Salon,sid).plan_version==0
        assert db.query(PartOfSalon).filter_by(salon_id=sid).one().default_price==12345
