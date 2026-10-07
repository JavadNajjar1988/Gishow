"""Account credentials, revocable sessions, and live database authorization."""
import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database import get_db
from .models import (UserList, Role, Permission, RolePermission, UserRole, EventRole,
                     UserPermission, AuthSession, RecoveryCode, AuthThrottle, SecurityAudit)

PERMISSIONS = {
    'accounts.manage': ('مدیریت حساب‌ها و تخصیص دسترسی', 'global'),
    'roles.manage': ('مدیریت نقش‌ها و مجوزها', 'global'),
    'terminals.read': ('مشاهده پایانه‌ها', 'global'),
    'salons.manage': ('مدیریت سالن‌ها', 'global'),
    'events.read': ('مشاهده برنامه‌های مدیریتی', 'event'),
    'reports.read': ('مشاهده فروش برنامه', 'event'),
    'seats.manage': ('مسدودسازی صندلی برنامه', 'event'),
    'tickets.check': ('کنترل ورود برنامه', 'event'),
}
ROLE_DEFINITIONS = {
    'admin': ('مدیر سامانه', 'global', tuple(PERMISSIONS)),
    'customer': ('خریدار', 'global', ()),
    'producer': ('برگزارکننده', 'event', ('events.read', 'reports.read', 'seats.manage')),
    'checker': ('متصدی ورود', 'event', ('events.read', 'tickets.check')),
}
bearer = HTTPBearer(auto_error=False)
COOKIE = 'gishow_session'
ITERATIONS = 600_000

def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def normalize_mobile(value):
    value = value.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')).strip()
    if value.startswith('+98'):
        value = '0' + value[3:]
    elif value.startswith('98') and len(value) == 12:
        value = '0' + value[2:]
    elif len(value) == 10 and value.startswith('9'):
        value = '0' + value
    if not re.fullmatch(r'09[0-9]{9}', value):
        raise ValueError('شماره همراه معتبر نیست.')
    return value

def hash_password(password):
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), ITERATIONS).hex()
    return f'pbkdf2_sha256${ITERATIONS}${salt}${hashed}'

def verify_password(password, encoded):
    try:
        kind, iterations, salt, expected = (encoded or '').split('$')
        rounds = int(iterations)
        if kind != 'pbkdf2_sha256' or rounds != ITERATIONS:
            raise ValueError()
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), rounds).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        # Similar work for missing accounts and retired legacy hashes.
        hashlib.pbkdf2_hmac('sha256', password.encode(), b'unknown-account', ITERATIONS)
        return False

def browser_write(request: Request, x_gishow_request: str | None = Header(default=None)):
    if request.method in ('GET', 'HEAD', 'OPTIONS'):
        return
    # JSON forms from other origins cannot send this header without CORS preflight.
    if request.headers.get('X-Gishow-Request') != '1':
        raise HTTPException(403, 'درخواست معتبر نیست.')
    origin = request.headers.get('origin')
    allowed = {item.strip() for item in os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173').split(',')}
    allowed.add(str(request.base_url).rstrip('/'))
    if origin and origin not in allowed:
        raise HTTPException(403, 'مبدأ درخواست مجاز نیست.')

def current_user(request: Request, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    browser_write(request)
    token = credentials.credentials if credentials else request.cookies.get(COOKIE, '')
    session = db.get(AuthSession, digest(token)) if token else None
    user = db.get(UserList, session.user_id) if session and session.expires_at > now() else None
    if not user or not user.is_active:
        raise HTTPException(401, 'برای ادامه وارد حساب شوید.', headers={'WWW-Authenticate': 'Bearer'})
    request.state.session_hash = session.token_hash
    return user

def global_allowed(db, user, permission):
    override = db.get(UserPermission, (user.id, permission))
    if override is not None:
        return override.allowed
    return db.query(UserRole).join(Role, Role.id == UserRole.role_id).join(
        RolePermission, RolePermission.role_id == Role.id).filter(
        UserRole.user_id == user.id, Role.scope == 'global',
        RolePermission.permission_code == permission).first() is not None

def permitted_event_ids(db, user, permission):
    if global_allowed(db, user, permission):
        return None  # Global authorization explicitly assigned by an administrator.
    override = db.get(UserPermission, (user.id, permission))
    if override is not None and not override.allowed:
        return []
    return [row[0] for row in db.query(EventRole.event_id).join(Role, Role.id == EventRole.role_id).join(
        RolePermission, RolePermission.role_id == Role.id).filter(
        EventRole.user_id == user.id, Role.scope == 'event',
        RolePermission.permission_code == permission).distinct().all()]

def require(permission):
    def dependency(user: UserList = Depends(current_user), db: Session = Depends(get_db)):
        permitted = global_allowed(db, user, permission)
        if PERMISSIONS[permission][1] == 'event':
            permitted = permitted or bool(permitted_event_ids(db, user, permission))
        if not permitted:
            raise HTTPException(403, 'دسترسی لازم را ندارید.')
        return user
    return dependency

def authorize_event(db, user, permission, event_id):
    ids = permitted_event_ids(db, user, permission)
    if ids is not None and event_id not in ids:
        raise HTTPException(403, 'دسترسی به این برنامه مجاز نیست.')

def revoke_sessions(db, user_id):
    db.execute(delete(AuthSession).where(AuthSession.user_id == user_id))

def audit(db, actor_id, action, target_id=None):
    db.add(SecurityAudit(actor_id=actor_id, action=action, target_id=target_id))

def make_recovery_codes(db, user_id):
    db.execute(delete(RecoveryCode).where(RecoveryCode.user_id == user_id))
    codes = [secrets.token_hex(16) for _ in range(5)]
    db.add_all([RecoveryCode(user_id=user_id, code_hash=digest(code)) for code in codes])
    return codes

def issue_session(db, user, response):
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=digest(token), user_id=user.id, expires_at=now() + timedelta(hours=12)))
    response.set_cookie(COOKIE, token, httponly=True, secure=os.getenv('COOKIE_SECURE', 'false').lower() == 'true',
                        samesite='strict', max_age=43200, path='/api')
    return token

def throttle(db, request, operation, mobile='', limit=10):
    ip = request.client.host if request.client else 'unknown'
    # Never trust an arbitrary forwarded IP supplied by the caller.
    keys = [(digest(f'{operation}:ip:{ip}'), limit * 5), (digest(f'{operation}:account:{mobile}'), limit)] if mobile else [(digest(f'{operation}:ip:{ip}'), limit)]
    for key, maximum in keys:
        instant = now()
        # Atomic increment survives workers/restarts; expired windows reset lazily.
        changed = db.execute(update(AuthThrottle).where(AuthThrottle.key == key, AuthThrottle.expires_at > instant).values(attempts=AuthThrottle.attempts + 1)).rowcount
        if not changed:
            changed = db.execute(update(AuthThrottle).where(AuthThrottle.key == key, AuthThrottle.expires_at <= instant).values(attempts=1, expires_at=instant + timedelta(minutes=15))).rowcount
            if not changed:
                try:
                    with db.begin_nested():
                        db.add(AuthThrottle(key=key, attempts=1, expires_at=instant + timedelta(minutes=15)))
                        db.flush()
                except IntegrityError:
                    db.execute(update(AuthThrottle).where(AuthThrottle.key == key).values(attempts=AuthThrottle.attempts + 1))
        db.commit()
        row = db.get(AuthThrottle, key, populate_existing=True)
        if row.attempts > maximum:
            raise HTTPException(429, 'تعداد تلاش‌ها زیاد است؛ پانزده دقیقه بعد دوباره تلاش کنید.', headers={'Retry-After': '900'})

def user_view(db, user):
    global_permissions = [code for code in PERMISSIONS if global_allowed(db, user, code)]
    grants = db.query(EventRole, Role).join(Role, Role.id == EventRole.role_id).filter(EventRole.user_id == user.id).all()
    event_permissions = {str(event_id): [code for code in PERMISSIONS if PERMISSIONS[code][1] == 'event' and
                         (permitted_event_ids(db, user, code) is None or event_id in permitted_event_ids(db, user, code))]
                         for event_id in {grant.event_id for grant, role in grants}}
    return {'id': user.id, 'full_name': user.full_name, 'mobile': user.mobile,
            'national_code': user.national_code, 'is_active': user.is_active,
            'roles': [role.code for role in db.query(Role).join(UserRole).filter(UserRole.user_id == user.id).all()],
            'global_permissions': global_permissions, 'event_permissions': event_permissions,
            'event_roles': [{'event_id': grant.event_id, 'role': role.code} for grant, role in grants]}

def require_any(*permissions):
    def dependency(user: UserList = Depends(current_user), db: Session = Depends(get_db)):
        if not any(global_allowed(db, user, permission) for permission in permissions):
            raise HTTPException(403, 'دسترسی لازم را ندارید.')
        return user
    return dependency
