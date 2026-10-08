import os
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import pytest
from backend.tests.test_sales import site,inventory,reserve,gateway,BASE,AUTHORITY
from backend.tests.test_catalog import create_salon,create_event,turn_body,EVENTS
from backend.tests.test_accounts import register,grant_event
from backend.models import SaleReservation,SaleTicket,SaleOrder,Barname,Role,RolePermission
from backend.services.sales import utcnow
CODES='/api/admin/discounts'
def coupon(client,turn,**extra):
    body=dict(code='SAVE10',event_id=turn['event_id'] if 'event_id' in turn else turn['barname_id'],percent=10,max_uses=2,starts_at=(utcnow()-timedelta(days=1)).isoformat()+'Z',ends_at=(utcnow()+timedelta(days=1)).isoformat()+'Z')
    body.update(extra);return client.post(CODES,json=body)
def quote(client,held,code='SAVE10'):
    return client.post(BASE+'/orders',json=dict(reservation_id=held['id'],discount_code=code))
def pay(client,saved):
    assert client.post(BASE+'/orders/'+saved['id']+'/payment').status_code==200
    assert client.get(BASE+'/zarinpal/callback?Authority='+AUTHORITY+'&Status=OK').status_code==200

def test_discount_quote_identity_claim_release_and_immutable_total(site):
    client,factory,turn,seats=inventory(site)
    code=coupon(client,turn,max_uses=1,min_seats=2);assert code.status_code==201,code.text
    first=reserve(client,turn,seats[:1]).json();assert quote(client,first).status_code==409
    assert client.delete(BASE+'/reservations/'+first['id']).status_code==204
    held=reserve(client,turn,seats[:2]).json();saved=quote(client,held,'save10').json()
    assert saved['subtotal_irr']==2400000 and saved['discount_amount_irr']==240000 and saved['amount_irr']==2160000
    assert quote(client,held,'SAVE10').json()['id']==saved['id']
    assert quote(client,held,'OTHER').status_code==409
    assert client.get(CODES).json()[0]['claimed_uses']==1
    assert client.patch(CODES+'/'+code.json()['id'],json={'is_active':False}).status_code==200
    assert quote(client,held).json()['amount_irr']==2160000
    client.delete(BASE+'/reservations/'+held['id'])
    assert client.get(CODES).json()[0]['claimed_uses']==0

def test_discount_scope_time_fixed_amount_validation_and_owner_access(site):
    client,factory,turn,seats=inventory(site)
    assert coupon(client,turn,percent=100).status_code==422
    assert coupon(client,turn,code='BAD',fixed_amount_irr=10).status_code==422
    fixed=coupon(client,turn,code='FIXED',percent=None,fixed_amount_irr=12345);assert fixed.status_code==201
    expired=coupon(client,turn,code='EXPIRED',starts_at=(utcnow()-timedelta(days=2)).isoformat()+'Z',ends_at=(utcnow()-timedelta(days=1)).isoformat()+'Z');assert expired.status_code==201
    held=reserve(client,turn,seats[:1]).json();assert quote(client,held,'EXPIRED').status_code==409
    assert quote(client,held,'UNKNOWN').status_code==409
    assert quote(client,held,'FIXED').json()['amount_irr']==1187655
    assert coupon(client,turn,code='FIXED').status_code==409
    other=register(client,'09111111111')['user']['id']
    assert client.get(CODES).status_code==403
    with factory() as db:
        role=Role(code='discount_editor',name='مدیر تخفیف',scope='event');db.add(role);db.flush()
        db.add(RolePermission(role_id=role.id,permission_code='events.manage'));db.commit()
    grant_event(factory,other,turn.get('event_id',turn.get('barname_id')),'discount_editor')
    assert len(client.get(CODES).json())==2
    assert coupon(client,turn,code='GLOBAL',event_id=None).status_code==403
    assert coupon(client,turn,code='WRONG',event_id=99999).status_code==403

def test_receipt_private_escaped_jalali_and_independent_gate_acceptance(site,monkeypatch):
    client,factory,turn,seats=inventory(site);gateway(monkeypatch)
    assert coupon(client,turn).status_code==201
    with factory() as db:
        event=db.get(Barname,turn.get('event_id',turn.get('barname_id')));event.title='<script>alert(1)</script>';db.commit()
    held=reserve(client,turn,seats[:2]).json();saved=quote(client,held).json();url=BASE+'/orders/'+saved['id']+'/receipt'
    assert client.get(url).status_code==409
    pay(client,saved)
    with factory() as db:db.get(SaleOrder,saved['id']).paid_at=utcnow().replace(year=2026,month=3,day=21);db.commit()
    receipt=client.get(url)
    assert receipt.status_code==200 and receipt.headers['cache-control']=='no-store'
    assert 'attachment' in receipt.headers['content-disposition']
    assert 'inline' in client.get(url+'?download=false').headers['content-disposition']
    assert '<script>' not in receipt.text and '&lt;script&gt;' in receipt.text
    assert '۱۴۰۵/۰۱/۰۱' in receipt.text and receipt.text.count('data:image/png;base64,')==2
    assert "default-src 'none'" in receipt.headers['content-security-policy']
    tickets=client.get(BASE+'/orders/'+saved['id']).json()['tickets']
    codes=['GISHOW:TICKET:'+t['id'] for t in tickets]
    assert all(code in receipt.text for code in codes)
    assert client.post('/api/checker/verify',json={'code':codes[0]}).json()['status']=='valid'
    assert client.post('/api/checker/verify',json={'code':codes[0]}).json()['status']=='already_checked'
    assert client.post('/api/checker/verify',json={'code':codes[1]}).json()['status']=='valid'
    with factory() as db:assert all(t.checked_by is not None for t in db.query(SaleTicket).all())
    monkeypatch.setenv('ZARINPAL_MODE','live')
    assert client.post('/api/checker/verify',json={'code':codes[0]}).json()['status']=='invalid'
    register(client,'09111111111')
    assert client.get(url).status_code==404
    assert client.post('/api/checker/verify',json={'code':codes[0]}).status_code==403
    client.cookies.clear();assert client.get(url).status_code==401

@pytest.mark.skipif(os.getenv('TEST_PG')!='1',reason='Requires competing PostgreSQL transactions')
def test_last_coupon_claim_is_atomic_between_buyers(site):
    client,factory,turn,seats=inventory(site);assert coupon(client,turn,max_uses=1,event_id=None).status_code==201
    salon=create_salon(client,'برنامه مستقل');event=create_event(client,salon['id'],True)
    other=client.post(f"{EVENTS}/{event['id']}/run-turns",json=turn_body(salon)).json()
    other_seat=client.get(f"/api/catalog/run-turns/{other['id']}/seats").json()[0]['id']
    inventories=[(turn,seats[0]),(other,other_seat)]
    held=[]
    for index,mobile in enumerate(['09111111111','09222222222']):
        token=register(client,mobile)['access_token'];selected,seat=inventories[index];r=reserve(client,selected,[seat]).json();held.append((token,r['id']))
    barrier=Barrier(2)
    def attempt(item):
        barrier.wait(timeout=10)
        return client.post(BASE+'/orders',json={'reservation_id':item[1],'discount_code':'SAVE10'},headers={'Authorization':'Bearer '+item[0]}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(attempt,held))
    assert sorted(results)==[201,409]
    with factory() as db:assert db.query(SaleOrder).count()==1


def test_expired_quote_releases_coupon_and_paid_order_consumes_it(site,monkeypatch):
    client,factory,turn,seats=inventory(site);gateway(monkeypatch)
    assert coupon(client,turn,max_uses=1).status_code==201
    held=reserve(client,turn,seats[:1]).json();saved=quote(client,held).json()
    with factory() as db:db.get(SaleReservation,held['id']).expires_at=utcnow()-timedelta(seconds=1);db.commit()
    assert client.get(CODES).json()[0]['claimed_uses']==0
    second=reserve(client,turn,seats[1:2]).json();paid=quote(client,second).json();pay(client,paid)
    assert client.get(CODES).json()[0]['claimed_uses']==1
    third=reserve(client,turn,seats[2:3]).json();assert quote(client,third).status_code==409

@pytest.mark.skipif(os.getenv('TEST_PG')!='1',reason='Requires competing PostgreSQL transactions')
def test_gate_accepts_same_ticket_only_once_concurrently(site,monkeypatch):
    client,factory,turn,seats=inventory(site);gateway(monkeypatch)
    held=reserve(client,turn,seats[:1]).json();saved=quote(client,held,None).json();pay(client,saved)
    code='GISHOW:TICKET:'+client.get(BASE+'/orders/'+saved['id']).json()['tickets'][0]['id']
    barrier=Barrier(2)
    def check(_):
        barrier.wait(timeout=10)
        return client.post('/api/checker/verify',json={'code':code}).json()['status']
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(check,[0,1]))
    assert sorted(results)==['already_checked','valid']
