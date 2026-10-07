import os
import subprocess
import sys
import uuid
from datetime import timedelta
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import get_db
from backend.models import (Role, UserRole, EventRole, UserPermission, UserList, AuthSession,
                            RecoveryCode, Salon, Barname, RunTurn, FactorList, BankTerminal)
from backend.security import now

ROOT = Path(__file__).resolve().parents[2]
HEADERS = {'X-Gishow-Request': '1'}
PASSWORD = 'a long test password 42'

@pytest.fixture
def site(tmp_path):
    schema = None
    base_engine = None
    if os.getenv('TEST_PG') == '1':
        # Each test owns a new private schema; application data is untouched.
        schema = 'gishow_test_' + uuid.uuid4().hex
        base_url = make_url(os.environ['DATABASE_URL'])
        assert base_url.get_backend_name() == 'postgresql'
        base_engine = create_engine(base_url)
        with base_engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{schema}"'))
        url = base_url.update_query_dict({'options': f'-csearch_path={schema}'}).render_as_string(hide_password=False)
        engine = create_engine(url)
    else:
        url = f"sqlite:///{(tmp_path / 'accounts.db').as_posix()}"
        engine = create_engine(url, connect_args={'check_same_thread': False})
    env = dict(os.environ, DATABASE_URL=url)
    subprocess.run([sys.executable, '-m', 'alembic', '-c', 'backend/alembic.ini', 'upgrade', 'head'],
                   cwd=ROOT, env=env, check=True, capture_output=True)
    factory = sessionmaker(bind=engine)
    def database():
        with factory() as db:
            yield db
    app.dependency_overrides[get_db] = database
    with TestClient(app, headers=HEADERS) as client:
        yield client, factory
    app.dependency_overrides.clear()
    engine.dispose()
    if schema:
        assert schema.startswith('gishow_test_') and len(schema) == 44 and schema[12:].isalnum()
        with base_engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        base_engine.dispose()

def register(client, mobile='09123456789'):
    result = client.post('/api/auth/register', json={'mobile': mobile, 'full_name': 'کاربر آزمایشی', 'password': PASSWORD})
    assert result.status_code == 201, result.text
    return result.json()

def promote(factory, user_id):
    with factory() as db:
        role = db.query(Role).filter_by(code='admin').one()
        db.add(UserRole(user_id=user_id, role_id=role.id))
        db.commit()

def events(factory):
    with factory() as db:
        salon = Salon(name='سالن آزمایشی')
        db.add(salon); db.flush()
        event_rows = [Barname(salon_id=salon.id, title=f'برنامه {i}', date_range='آزمایشی') for i in (1, 2)]
        db.add_all(event_rows); db.flush()
        ids = [row.id for row in event_rows]
        for i, event in enumerate(event_rows):
            turn = RunTurn(barname_id=event.id, date='آزمایشی', time='18:00', weekday='شنبه')
            db.add(turn); db.flush()
            db.add(FactorList(run_turn_id=turn.id, factor_number=f'GSH-{i}', tracking_code=f'TRK-{i}',
                qr_payload=f'GISHOW:FACTOR-{i}', customer_name='آزمایشی', customer_mobile='09123456789',
                customer_national_code='0000000000', subtotal=100, final_amount=100))
        db.commit()
        return ids

def grant_event(factory, user_id, event_id, role='producer'):
    with factory() as db:
        role_id = db.query(Role).filter_by(code=role).one().id
        db.add(EventRole(user_id=user_id, event_id=event_id, role_id=role_id)); db.commit()

def test_registration_session_and_secret_redaction(site):
    client, factory = site
    result = register(client, '+989123456789')
    assert result['user']['mobile'] == '09123456789'
    assert result['user']['roles'] == ['customer']
    assert result['user']['global_permissions'] == []
    assert len(result['recovery_codes']) == 5
    assert client.get('/api/auth/me').status_code == 200
    assert client.get('/api/auth/me').headers['Cache-Control'] == 'no-store'
    with factory() as db:
        stored = db.get(UserList, result['user']['id'])
        assert stored.password_hash != PASSWORD and stored.password_hash.startswith('pbkdf2_sha256$600000$')
        assert result['access_token'] not in {s.token_hash for s in db.query(AuthSession).all()}
        assert not set(result['recovery_codes']) & {c.code_hash for c in db.query(RecoveryCode).all()}
    assert 'password' not in client.get('/api/auth/me').text
    assert client.post('/api/auth/register', json={'mobile': '۰۹۱۲۳۴۵۶۷۸۹', 'full_name': 'کاربر', 'password': PASSWORD}).status_code == 409
    assert client.post('/api/auth/logout').status_code == 204
    assert client.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login', json={'mobile': '9123456789', 'password': PASSWORD}).status_code == 200

def test_public_cannot_assign_privilege_or_read_admin(site):
    client, factory = site
    for path in ('/api/admin/users', '/api/admin/factors', '/api/admin/metrics', '/api/access/roles'):
        assert client.get(path).status_code == 401
    assert client.post('/api/checker/verify', json={'code': 'GSH-1'}).status_code == 401
    bad = {'mobile': '09123456789', 'full_name': 'کاربر', 'password': PASSWORD, 'role': 'admin'}
    assert client.post('/api/auth/register', json=bad).status_code == 422
    register(client)
    assert client.get('/api/admin/users').status_code == 403
    assert client.get('/api/admin/factors').status_code == 403
    assert client.post('/api/access/users/1/roles', json={'role_id': 1}).status_code == 403
    assert client.patch('/api/auth/me', json={'full_name':'کاربر', 'current_password':PASSWORD, 'is_active':False}).status_code == 422

def test_scoped_reports_gate_and_live_revocation(site):
    client, factory = site
    result = register(client)
    first, second = events(factory)
    grant_event(factory, result['user']['id'], first)
    assert [f['factor_number'] for f in client.get('/api/admin/factors').json()] == ['GSH-0']
    assert client.get('/api/admin/metrics').json()['total_revenue'] == 100
    assert [e['id'] for e in client.get('/api/admin/events').json()] == [first]
    assert client.post('/api/checker/verify', json={'code':'GSH-0'}).status_code == 403
    grant_event(factory, result['user']['id'], first, 'checker')
    assert client.post('/api/checker/verify', json={'code':'GSH-1'}).json()['status'] == 'invalid'
    for code in ('', ' ', '%', 'GSH', 'FACTOR'):
        reply = client.post('/api/checker/verify', json={'code':code})
        assert reply.status_code == 422 or reply.json()['status'] == 'invalid'
    assert client.post('/api/checker/verify', json={'code':'GSH-0'}).json()['status'] == 'valid'
    assert client.post('/api/checker/verify', json={'code':'GSH-0'}).json()['status'] == 'already_checked'
    with factory() as db:
        db.query(EventRole).filter_by(user_id=result['user']['id']).delete(); db.commit()
    assert client.get('/api/admin/factors').status_code == 403

def test_global_deny_overrides_event_role(site):
    client, factory = site
    account = register(client)['user']['id']
    first, second = events(factory)
    grant_event(factory, account, first)
    with factory() as db:
        db.add(UserPermission(user_id=account, permission_code='reports.read', allowed=False)); db.commit()
    assert client.get('/api/admin/factors').status_code == 403
    assert client.get('/api/admin/events').status_code == 200

def test_password_recovery_one_use_and_session_revocation(site):
    client, factory = site
    result = register(client)
    old_token = result['access_token']
    body = {'mobile':'09123456789', 'password':'another strong password 73', 'recovery_code':result['recovery_codes'][0]}
    assert client.post('/api/auth/recover', json=body).status_code == 204
    assert client.get('/api/auth/me', headers={'Authorization':f'Bearer {old_token}'}).status_code == 401
    assert client.post('/api/auth/recover', json=body).status_code == 400
    assert client.post('/api/auth/login', json={'mobile':body['mobile'], 'password':PASSWORD}).status_code == 401
    assert client.post('/api/auth/login', json={'mobile':body['mobile'], 'password':body['password']}).status_code == 200
    rotated = client.post('/api/auth/recovery-codes', json={'current_password':body['password']}).json()
    assert len(rotated['recovery_codes']) == 5
    body['recovery_code'] = result['recovery_codes'][1]
    assert client.post('/api/auth/recover', json=body).status_code == 400

def test_edit_profile_password_change_and_logout_all(site):
    client, factory = site
    register(client)
    assert client.patch('/api/auth/me', json={'full_name':'نام تازه', 'current_password':'wrong'}).status_code == 400
    assert client.patch('/api/auth/me', json={'full_name':'نام تازه', 'current_password':PASSWORD}).json()['full_name'] == 'نام تازه'
    assert client.post('/api/auth/password', json={'current_password':PASSWORD, 'password':'new strong password 77'}).status_code == 204
    assert client.get('/api/auth/me').status_code == 401
    token = client.post('/api/auth/login', json={'mobile':'09123456789', 'password':'new strong password 77'}).json()['access_token']
    client.post('/api/auth/login', json={'mobile':'09123456789', 'password':'new strong password 77'})
    assert client.post('/api/auth/logout-all').status_code == 204
    assert client.get('/api/auth/me', headers={'Authorization':f'Bearer {token}'}).status_code == 401

def test_permission_management_and_last_admin_protection(site):
    client, factory = site
    admin = register(client)['user']['id']; promote(factory, admin)
    target = register(client, '09123456780')['user']['id']
    client.post('/api/auth/login', json={'mobile':'09123456789', 'password':PASSWORD})
    first, second = events(factory)
    role = client.post('/api/access/roles', json={'code':'event_reader', 'name':'خواننده برنامه', 'scope':'event', 'permissions':['reports.read']})
    assert role.status_code == 201
    role_id = role.json()['id']
    assert role_id > 4
    assert client.post(f'/api/access/users/{target}/roles', json={'role_id':role_id}).status_code == 422
    assert client.post(f'/api/access/users/{target}/roles', json={'role_id':role_id, 'event_id':first}).status_code == 201
    assert client.patch('/api/access/roles/1', json={'code':'admin', 'name':'مدیر', 'scope':'global', 'permissions':[]}).status_code == 409
    assert client.delete(f'/api/access/users/{admin}/roles/1').status_code == 409
    assert client.patch(f'/api/access/users/{admin}', json={'is_active':False}).status_code == 409
    assert client.post(f'/api/access/users/{admin}/permissions', json={'permission_code':'accounts.manage', 'allowed':False}).status_code == 409
    assert client.get('/api/access/audit').status_code == 200
    assert 'password_hash' not in client.get('/api/admin/users').text

def test_disable_expiry_and_legacy_role_string(site):
    client, factory = site
    result = register(client)
    with factory() as db:
        db.get(UserList, result['user']['id']).role = 'admin'; db.commit()
    assert client.get('/api/admin/users').status_code == 403
    with factory() as db:
        session = db.query(AuthSession).one(); session.expires_at = now() - timedelta(seconds=1); db.commit()
    assert client.get('/api/auth/me').status_code == 401
    client.post('/api/auth/login', json={'mobile':'09123456789', 'password':PASSWORD})
    with factory() as db:
        db.get(UserList, result['user']['id']).is_active = False; db.commit()
    assert client.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login', json={'mobile':'09123456789', 'password':PASSWORD}).status_code == 401

def test_csrf_and_failed_attempt_limit(site):
    client, factory = site
    assert client.post('/api/auth/login', json={'mobile':'09123456789','password':PASSWORD}, headers={'Origin':'https://untrusted.example'}).status_code == 403
    with TestClient(app) as no_header:
        assert no_header.post('/api/auth/register', json={'mobile':'09123456789','full_name':'کاربر','password':PASSWORD}).status_code == 403
    for _ in range(10):
        assert client.post('/api/auth/login', json={'mobile':'09123456789','password':'wrong'}).status_code == 401
    assert client.post('/api/auth/login', json={'mobile':'09123456789','password':'wrong'}).status_code == 429

def test_terminal_credentials_never_exposed(site):
    client, factory = site
    user_id = register(client)['user']['id']; promote(factory, user_id)
    with factory() as db:
        db.add(BankTerminal(bank_name='آزمایشی', terminal_id='test', username='private-user', password='private-password')); db.commit()
    body = client.get('/api/admin/terminals').text
    assert 'private-user' not in body and 'private-password' not in body and 'password' not in body

def test_bootstrap_is_local_and_cannot_replace_existing_account(site):
    from backend.bootstrap_admin import create_first_admin
    client, factory = site
    with factory() as db:
        user_id, codes = create_first_admin(db, '09100000000', 'مدیر آزمایشی', PASSWORD)
        assert len(codes) == 5
        with pytest.raises(ValueError):
            create_first_admin(db, '09100000001', 'مدیر دیگر', PASSWORD)
        db.rollback()
    assert client.post('/api/auth/login', json={'mobile':'09100000000','password':PASSWORD}).status_code == 200
    assert client.get('/api/admin/users').status_code == 200
def test_seat_management_cannot_cross_event_or_free_sold_seat(site):
    from backend.models import PartOfSalon, ChairInPart, ChairInBarname
    client, factory = site
    account = register(client)['user']['id']
    first, second = events(factory)
    grant_event(factory, account, first)
    with factory() as db:
        salon_id = db.get(Barname, first).salon_id
        part = PartOfSalon(salon_id=salon_id, name='جایگاه')
        db.add(part); db.flush()
        chair = ChairInPart(part_id=part.id, row_number=1, seat_number=1)
        db.add(chair); db.flush()
        own_turn = db.query(RunTurn).filter_by(barname_id=first).one().id
        other_turn = db.query(RunTurn).filter_by(barname_id=second).one().id
        status = ChairInBarname(run_turn_id=own_turn, chair_id=chair.id, status='available', price=100)
        db.add(status); db.commit()
        chair_id, status_id = chair.id, status.id
    assert client.post('/api/admin/chair-block', json={'run_turn_id':other_turn,'chair_ids':[chair_id]}).status_code == 403
    assert client.post('/api/admin/chair-block', json={'run_turn_id':own_turn,'chair_ids':[chair_id]}).status_code == 200
    assert client.post('/api/seats/lock', json={'run_turn_id':own_turn,'seat_ids':[status_id]}).status_code == 409
    assert client.post('/api/checkout/process', json={'run_turn_id':own_turn,'seat_ids':[status_id], 'customer_name':'کاربر', 'customer_mobile':'09123456789','customer_national_code':'0000000000'}).status_code == 409
    with factory() as db:
        db.get(ChairInBarname, status_id).status='sold'; db.commit()
    assert client.post('/api/admin/chair-block', json={'run_turn_id':own_turn,'chair_ids':[chair_id],'action':'unblock'}).status_code == 409
def test_recovery_consumption_is_atomic(site):
    from concurrent.futures import ThreadPoolExecutor
    client, factory = site
    account = register(client)
    body = {'mobile':'09123456789', 'password':'a new concurrent password 42', 'recovery_code':account['recovery_codes'][0]}
    def consume(_):
        with TestClient(app, headers=HEADERS) as worker:
            return worker.post('/api/auth/recover', json=body).status_code
    with ThreadPoolExecutor(max_workers=2) as workers:
        statuses = sorted(workers.map(consume, range(2)))
    assert statuses == [204, 400]
