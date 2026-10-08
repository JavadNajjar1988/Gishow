from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import UserList, Role, UserRole, AuthSession, RecoveryCode
from ..auth_schemas import Register, Login, Profile, PasswordChange, CurrentPassword, PasswordRecovery
from ..security import (browser_write, current_user, hash_password, verify_password, digest, now,
                        issue_session, revoke_sessions, make_recovery_codes, throttle, audit, user_view, COOKIE)

router = APIRouter(prefix='/auth', tags=['حساب کاربری'], dependencies=[Depends(browser_write)])

@router.post('/register', status_code=201)
def register(body: Register, request: Request, response: Response, db: Session = Depends(get_db)):
    throttle(db, request, 'register', limit=10)
    user = UserList(full_name=body.full_name, mobile=body.mobile, national_code=body.national_code,
                    password_hash=hash_password(body.password), role='customer', is_active=True)
    try:
        db.add(user)
        db.flush()
        role = db.query(Role).filter_by(code='customer').one()
        db.add(UserRole(user_id=user.id, role_id=role.id))
        codes = make_recovery_codes(db, user.id)
        token = issue_session(db, user, response)
        audit(db, user.id, 'account.register', user.id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'ثبت‌نام با این شماره ممکن نیست؛ ورود یا بازیابی را امتحان کنید.')
    response.headers['Cache-Control'] = 'no-store'
    return {'user': user_view(db, user), 'access_token': token, 'token_type': 'bearer', 'recovery_codes': codes}

@router.post('/login')
def login(body: Login, request: Request, response: Response, db: Session = Depends(get_db)):
    throttle(db, request, 'login', body.mobile)
    user = db.query(UserList).filter_by(mobile=body.mobile).with_for_update().first()
    valid = verify_password(body.password, user.password_hash if user else None)
    if not user or not valid or not user.is_active:
        raise HTTPException(401, 'شماره همراه یا گذرواژه صحیح نیست.')
    token = issue_session(db, user, response)
    audit(db, user.id, 'account.login', user.id)
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return {'user': user_view(db, user), 'access_token': token, 'token_type': 'bearer'}

@router.get('/me')
def me(response: Response, user=Depends(current_user), db: Session = Depends(get_db)):
    response.headers['Cache-Control'] = 'no-store'
    return user_view(db, user)

@router.post('/logout', status_code=204)
def logout(request: Request, response: Response, user=Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(AuthSession).where(AuthSession.token_hash == request.state.session_hash))
    audit(db, user.id, 'account.logout', user.id)
    db.commit()
    response.delete_cookie(COOKIE, path='/api')

@router.post('/logout-all', status_code=204)
def logout_all(response: Response, user=Depends(current_user), db: Session = Depends(get_db)):
    revoke_sessions(db, user.id)
    audit(db, user.id, 'account.logout_all', user.id)
    db.commit()
    response.delete_cookie(COOKIE, path='/api')

@router.patch('/me')
def edit_profile(body: Profile, request: Request, user=Depends(current_user), db: Session = Depends(get_db)):
    throttle(db, request, 'profile', str(user.id))
    user = db.query(UserList).filter_by(id=user.id, is_active=True).with_for_update().populate_existing().first()
    if not user:
        raise HTTPException(401, 'حساب فعال نیست.')
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, 'گذرواژه فعلی صحیح نیست.')
    user.full_name, user.national_code = body.full_name, body.national_code
    audit(db, user.id, 'account.profile', user.id)
    db.commit()
    return user_view(db, user)

@router.post('/password', status_code=204)
def change_password(body: PasswordChange, request: Request, response: Response, user=Depends(current_user), db: Session = Depends(get_db)):
    throttle(db, request, 'password', str(user.id))
    user = db.query(UserList).filter_by(id=user.id, is_active=True).with_for_update().populate_existing().first()
    if not user:
        raise HTTPException(401, 'حساب فعال نیست.')
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, 'گذرواژه فعلی صحیح نیست.')
    user.password_hash = hash_password(body.password)
    revoke_sessions(db, user.id)
    audit(db, user.id, 'account.password', user.id)
    db.commit()
    response.delete_cookie(COOKIE, path='/api')

@router.post('/recovery-codes')
def rotate_codes(body: CurrentPassword, request: Request, response: Response, user=Depends(current_user), db: Session = Depends(get_db)):
    throttle(db, request, 'recovery_rotate', str(user.id))
    user = db.query(UserList).filter_by(id=user.id, is_active=True).with_for_update().populate_existing().first()
    if not user:
        raise HTTPException(401, 'حساب فعال نیست.')
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, 'گذرواژه فعلی صحیح نیست.')
    codes = make_recovery_codes(db, user.id)
    audit(db, user.id, 'account.recovery_rotate', user.id)
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return {'recovery_codes': codes}

@router.post('/recover', status_code=204)
def recover(body: PasswordRecovery, request: Request, response: Response, db: Session = Depends(get_db)):
    throttle(db, request, 'recovery', body.mobile, limit=5)
    user = db.query(UserList).filter_by(mobile=body.mobile, is_active=True).with_for_update().first()
    if not user:
        raise HTTPException(400, 'اطلاعات بازیابی صحیح نیست.')
    consumed = db.execute(update(RecoveryCode).where(RecoveryCode.user_id == user.id,
                          RecoveryCode.code_hash == digest(body.recovery_code), RecoveryCode.used_at.is_(None)).values(used_at=now())).rowcount
    if consumed != 1:
        db.rollback()
        raise HTTPException(400, 'اطلاعات بازیابی صحیح نیست.')
    user.password_hash = hash_password(body.password)
    revoke_sessions(db, user.id)
    audit(db, user.id, 'account.recover', user.id)
    db.commit()
    response.delete_cookie(COOKIE, path='/api')
