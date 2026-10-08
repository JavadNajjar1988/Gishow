import os,json
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import httpx,pytest
from sqlalchemy import select
from backend.models import SaleReservation,SaleOrder,SaleTicket,ChairInBarname,RunTurn
from backend.services.sales import utcnow
from backend.services import payment_service
from backend.tests.test_catalog import site,admin,create_salon,create_event,turn_body,EVENTS
from backend.tests.test_accounts import register

BASE='/api/sales'
AUTHORITY='S'+'a'*35
def inventory(site):
    client,factory,_=admin(site)
    salon=create_salon(client);event=create_event(client,salon['id'],True)
    body=turn_body(salon);body['starts_at']='2030-11-15T18:30:00+03:30'
    turn=client.post(f"{EVENTS}/{event['id']}/run-turns",json=body).json()
    seats=client.get(f"/api/catalog/run-turns/{turn['id']}/seats").json()
    return client,factory,turn,[s['id'] for s in seats]
def reserve(client,turn,seats):return client.post(BASE+'/reservations',json={'run_turn_id':turn['id'],'seat_ids':seats})
def order(client,reservation):return client.post(BASE+'/orders',json={'reservation_id':reservation['id']}).json()
def gateway(monkeypatch,verify_code=100):
    monkeypatch.setenv('ZARINPAL_MERCHANT_ID','11111111-1111-4111-8111-111111111111')
    monkeypatch.setenv('ZARINPAL_CALLBACK_URL','http://localhost:5193/api/sales/zarinpal/callback')
    monkeypatch.setenv('ZARINPAL_MODE','sandbox')
    calls=[]
    def post(url,**kwargs):
        calls.append((url,kwargs['json']))
        data={'code':100,'authority':AUTHORITY} if '/request.' in url else {'code':verify_code,'ref_id':9999}
        return httpx.Response(200,json={'data':data},request=httpx.Request('POST',url))
    monkeypatch.setattr(payment_service.httpx,'post',post)
    return calls

def test_reservation_atomicity_owner_and_immutable_order(site):
    client,factory,turn,seats=inventory(site)
    assert reserve(client,turn,[seats[0],999999]).status_code==409
    with factory() as db:
        assert db.get(ChairInBarname,seats[0]).status=='available'
        assert db.query(SaleReservation).count()==0
    assert reserve(client,turn,[seats[0],seats[0]]).status_code==422
    held=reserve(client,turn,seats[:2]).json();saved=order(client,held)
    assert saved['amount_irr']==2400000 and saved['status']=='pending' and saved['tickets']==[]
    assert order(client,held)['id']==saved['id']
    # Client-supplied totals and lock durations cannot override the contract.
    assert client.post(BASE+'/orders',json={'reservation_id':held['id'],'amount_irr':1}).status_code==422
    assert client.post(BASE+'/reservations',json={'run_turn_id':turn['id'],'seat_ids':[seats[2]],'lock_duration_seconds':999999}).status_code==422
    register(client,'09111111111')
    assert client.get(BASE+'/orders/'+saved['id']).status_code==404
    assert client.delete(BASE+'/reservations/'+held['id']).status_code==404
    assert reserve(client,turn,seats[:2]).status_code==409
    assert client.get(BASE+'/orders').json()==[]

def test_expiration_and_cancellation_cannot_release_reassigned_seat(site):
    client,factory,turn,seats=inventory(site)
    held=reserve(client,turn,seats[:1]).json();saved=order(client,held)
    with factory() as db:
        db.get(SaleReservation,held['id']).expires_at=utcnow()-timedelta(seconds=1)
        db.get(ChairInBarname,seats[0]).locked_until=utcnow()-timedelta(seconds=1);db.commit()
    assert client.get(BASE+'/orders/'+saved['id']).json()['status']=='expired'
    newer=reserve(client,turn,seats[:1]).json()
    assert client.delete(BASE+'/reservations/'+held['id']).status_code==204
    with factory() as db:assert db.get(ChairInBarname,seats[0]).reservation_id==newer['id']
    assert client.delete(BASE+'/reservations/'+newer['id']).status_code==204
    with factory() as db:assert db.get(ChairInBarname,seats[0]).status=='available'

def test_payment_verified_once_with_server_amount_and_independent_tickets(site,monkeypatch):
    client,factory,turn,seats=inventory(site);calls=gateway(monkeypatch,101)
    held=reserve(client,turn,seats[:2]).json();saved=order(client,held)
    path=BASE+'/orders/'+saved['id']+'/payment'
    first=client.post(path);second=client.post(path)
    assert first.status_code==200 and second.json()==first.json()
    assert len(calls)==1 and calls[0][1]['amount']==2400000 and calls[0][1]['currency']=='IRR'
    callback=BASE+'/zarinpal/callback?Authority='+AUTHORITY+'&Status=OK'
    assert client.get(callback).status_code==200
    assert client.get(callback).status_code==200
    assert len(calls)==2 and calls[1][1]['amount']==2400000
    result=client.get(BASE+'/orders/'+saved['id']).json()
    assert result['status']=='paid' and len(result['tickets'])==2
    assert len({t['id'] for t in result['tickets']})==2
    with factory() as db:
        assert db.query(SaleTicket).count()==2
        assert all(db.get(ChairInBarname,id).status=='sold' for id in seats[:2])
    assert reserve(client,turn,seats[:1]).status_code==409
    assert client.get(BASE+'/orders').headers['cache-control']=='no-store'

def test_failed_verify_and_untrusted_cancel_do_not_issue_or_free(site,monkeypatch):
    client,factory,turn,seats=inventory(site);gateway(monkeypatch,-51)
    held=reserve(client,turn,seats[:1]).json();saved=order(client,held)
    assert client.post(BASE+'/orders/'+saved['id']+'/payment').status_code==200
    callback=BASE+'/zarinpal/callback?Authority='+AUTHORITY
    assert client.get(callback+'&Status=NOK').status_code==200
    assert client.get(callback+'&Status=OK').status_code==502
    with factory() as db:
        assert db.query(SaleTicket).count()==0
        assert db.get(ChairInBarname,seats[0]).status=='reserved'
        assert db.get(SaleOrder,saved['id']).ref_id is None
    assert client.get(BASE+'/zarinpal/callback?Authority=unknown&Status=OK').status_code==404

def test_late_paid_callback_never_sells_another_reservation(site,monkeypatch):
    client,factory,turn,seats=inventory(site);gateway(monkeypatch)
    old=reserve(client,turn,seats[:1]).json();saved=order(client,old)
    assert client.post(BASE+'/orders/'+saved['id']+'/payment').status_code==200
    with factory() as db:
        db.get(SaleReservation,old['id']).expires_at=utcnow()-timedelta(seconds=1)
        db.get(ChairInBarname,seats[0]).locked_until=utcnow()-timedelta(seconds=1);db.commit()
    new=reserve(client,turn,seats[:1]).json()
    assert client.get(BASE+'/zarinpal/callback?Authority='+AUTHORITY+'&Status=OK').status_code==200
    with factory() as db:
        assert db.get(SaleOrder,saved['id']).status=='payment_review'
        assert db.get(ChairInBarname,seats[0]).reservation_id==new['id']
        assert db.query(SaleTicket).count()==0

def test_sale_window_auth_and_missing_gateway(site,monkeypatch):
    client,factory,turn,seats=inventory(site)
    monkeypatch.delenv('ZARINPAL_MERCHANT_ID',raising=False)
    held=reserve(client,turn,seats[:1]).json();saved=order(client,held)
    assert client.post(BASE+'/orders/'+saved['id']+'/payment').status_code==503
    with factory() as db:
        row=db.get(RunTurn,turn['id']);data=json.loads(row.config_json);data['sale_starts_at']='2030-01-01T00:00:00+03:30';row.config_json=json.dumps(data);db.commit()
    assert reserve(client,turn,seats[1:2]).status_code==409
    client.cookies.clear()
    assert reserve(client,turn,seats[1:2]).status_code==401

def test_per_account_limit_and_reservation_recovery(site):
    client,factory,turn,seats=inventory(site)
    held=reserve(client,turn,seats).json()
    assert client.get(BASE+'/reservations').json()[0]['id']==held['id']
    salon=create_salon(client,'سالن دیگر')
    event=create_event(client,salon['id'],True)
    body=turn_body(salon);body['starts_at']='2030-11-15T18:30:00+03:30'
    second=client.post(f"{EVENTS}/{event['id']}/run-turns",json=body).json()
    seats2=[s['id'] for s in client.get(f"/api/catalog/run-turns/{second['id']}/seats").json()]
    assert reserve(client,second,seats2).status_code==409
    with factory() as db:assert db.query(SaleReservation).count()==1
    assert client.delete(BASE+'/reservations/'+held['id']).status_code==204
    assert client.get(BASE+'/reservations').json()==[]

@pytest.mark.skipif(os.getenv('TEST_PG')!='1',reason='Real competing PostgreSQL transactions')
def test_two_buyers_cannot_reserve_the_same_seat_concurrently(site):
    client,factory,turn,seats=inventory(site)
    first=register(client,'09111111111')['access_token'];second=register(client,'09222222222')['access_token']
    barrier=Barrier(2)
    def attempt(token):
        barrier.wait(timeout=10)
        return client.post(BASE+'/reservations',json={'run_turn_id':turn['id'],'seat_ids':seats[:1]},headers={'Authorization':'Bearer '+token}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(attempt,[first,second]))
    assert sorted(results)==[201,409]
    with factory() as db:assert db.query(SaleReservation).count()==1
