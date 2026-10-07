from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import UserList, Role, Permission, RolePermission, UserRole, EventRole, UserPermission, Barname, SecurityAudit
from ..auth_schemas import RoleInput, AssignRole, Override, UserState
from ..security import require, require_any, user_view, revoke_sessions, audit

router = APIRouter(prefix='/access', tags=['نقش‌ها و دسترسی'])

def target_user(db, user_id):
    user = db.query(UserList).filter_by(id=user_id).with_for_update().populate_existing().first()
    if not user:
        raise HTTPException(404, 'حساب یافت نشد.')
    return user

def lock_admin_role(db):
    return db.query(Role).filter_by(code='admin').with_for_update().one()

def preserve_last_admin(db, target_id, admin_role):
    is_admin = db.get(UserRole, (target_id, admin_role.id)) is not None
    active_admins = db.query(UserRole).join(UserList, UserList.id == UserRole.user_id).filter(
        UserRole.role_id == admin_role.id, UserList.is_active.is_(True)).count()
    if is_admin and db.get(UserList, target_id).is_active and active_admins <= 1:
        raise HTTPException(409, 'آخرین مدیر فعال سامانه را نمی‌توان حذف یا غیرفعال کرد.')

@router.get('/permissions')
def permissions(user=Depends(require('roles.manage')), db: Session = Depends(get_db)):
    return [{'code': p.code, 'name': p.name, 'scope': p.scope} for p in db.query(Permission).all()]

@router.get('/roles')
def roles(user=Depends(require_any('accounts.manage', 'roles.manage')), db: Session = Depends(get_db)):
    return [{'id': r.id, 'code': r.code, 'name': r.name, 'scope': r.scope,
             'permissions': [p.permission_code for p in db.query(RolePermission).filter_by(role_id=r.id).all()]}
            for r in db.query(Role).order_by(Role.id).all()]

def validate_permissions(db, body):
    if len(set(body.permissions)) != len(body.permissions):
        raise HTTPException(422, 'مجوز تکراری است.')
    rows = db.query(Permission).filter(Permission.code.in_(body.permissions)).all()
    if len(rows) != len(body.permissions) or (body.scope == 'event' and any(p.scope != 'event' for p in rows)):
        raise HTTPException(422, 'مجوز با محدوده نقش سازگار نیست.')

@router.post('/roles', status_code=201)
def create_role(body: RoleInput, user=Depends(require('roles.manage')), db: Session = Depends(get_db)):
    validate_permissions(db, body)
    if db.query(Role).filter_by(code=body.code).first():
        raise HTTPException(409, 'شناسه نقش موجود است.')
    role = Role(code=body.code, name=body.name, scope=body.scope)
    db.add(role)
    db.flush()
    db.add_all([RolePermission(role_id=role.id, permission_code=p) for p in body.permissions])
    audit(db, user.id, 'role.create', role.id)
    db.commit()
    return {'id': role.id}

@router.patch('/roles/{role_id}')
def edit_role(role_id: int, body: RoleInput, user=Depends(require('roles.manage')), db: Session = Depends(get_db)):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(404, 'نقش یافت نشد.')
    if role.code in ('admin', 'customer', 'producer', 'checker'):
        raise HTTPException(409, 'نقش پایه ثابت است؛ نقش اختصاصی بسازید.')
    if role.scope != body.scope or role.code != body.code:
        raise HTTPException(409, 'شناسه و محدوده نقش قابل تغییر نیست.')
    validate_permissions(db, body)
    role.name = body.name
    db.query(RolePermission).filter_by(role_id=role.id).delete()
    db.add_all([RolePermission(role_id=role.id, permission_code=p) for p in body.permissions])
    audit(db, user.id, 'role.update', role.id)
    db.commit()
    return {'status': 'updated'}

@router.get('/users/{user_id}')
def user_access(user_id: int, response: Response, user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    response.headers['Cache-Control'] = 'no-store'
    data = user_view(db, target_user(db, user_id))
    data['overrides'] = [{'permission_code': p.permission_code, 'allowed': p.allowed}
                         for p in db.query(UserPermission).filter_by(user_id=user_id).all()]
    return data

@router.post('/users/{user_id}/roles', status_code=201)
def assign_role(user_id: int, body: AssignRole, user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    lock_admin_role(db)
    target_user(db, user_id)
    role = db.get(Role, body.role_id)
    if not role or (role.scope == 'event') != (body.event_id is not None):
        raise HTTPException(422, 'محدوده نقش و برنامه سازگار نیست.')
    if body.event_id is not None:
        if not db.get(Barname, body.event_id):
            raise HTTPException(404, 'برنامه یافت نشد.')
        if not db.get(EventRole, (user_id, body.event_id, role.id)):
            db.add(EventRole(user_id=user_id, event_id=body.event_id, role_id=role.id))
    elif not db.get(UserRole, (user_id, role.id)):
        db.add(UserRole(user_id=user_id, role_id=role.id))
    audit(db, user.id, 'access.assign_role', user_id)
    db.commit()
    return {'status': 'assigned'}

@router.delete('/users/{user_id}/roles/{role_id}', status_code=204)
def remove_role(user_id: int, role_id: int, event_id: int | None = None,
                user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    admin_role = lock_admin_role(db)
    target_user(db, user_id)
    if role_id == admin_role.id and event_id is None:
        preserve_last_admin(db, user_id, admin_role)
    grant = db.get(EventRole, (user_id, event_id, role_id)) if event_id is not None else db.get(UserRole, (user_id, role_id))
    if grant:
        db.delete(grant)
    audit(db, user.id, 'access.remove_role', user_id)
    db.commit()

@router.post('/users/{user_id}/permissions')
def override_permission(user_id: int, body: Override, user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    admin_role = lock_admin_role(db)
    target_user(db, user_id)
    if not db.get(Permission, body.permission_code):
        raise HTTPException(422, 'مجوز معتبر نیست.')
    if db.get(UserRole, (user_id, admin_role.id)) and body.permission_code in ('accounts.manage', 'roles.manage') and not body.allowed:
        raise HTTPException(409, 'دسترسی پایه مدیر قابل مسدودسازی نیست.')
    row = db.get(UserPermission, (user_id, body.permission_code))
    if row:
        row.allowed = body.allowed
    else:
        db.add(UserPermission(user_id=user_id, permission_code=body.permission_code, allowed=body.allowed))
    audit(db, user.id, 'access.override', user_id)
    db.commit()
    return {'status': 'updated'}

@router.delete('/users/{user_id}/permissions/{permission_code}', status_code=204)
def delete_override(user_id: int, permission_code: str, user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    row = db.get(UserPermission, (user_id, permission_code))
    if row:
        db.delete(row)
    audit(db, user.id, 'access.remove_override', user_id)
    db.commit()

@router.patch('/users/{user_id}')
def set_user_state(user_id: int, body: UserState, user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    admin_role = lock_admin_role(db)
    target = target_user(db, user_id)
    if not body.is_active:
        preserve_last_admin(db, user_id, admin_role)
        revoke_sessions(db, user_id)
    target.is_active = body.is_active
    audit(db, user.id, 'access.activate' if body.is_active else 'access.deactivate', user_id)
    db.commit()
    return {'status': 'updated'}

@router.get('/audit')
def audit_log(user=Depends(require('accounts.manage')), db: Session = Depends(get_db)):
    return [{'id': row.id, 'actor_id': row.actor_id, 'target_id': row.target_id,
             'action': row.action, 'created_at': row.created_at}
            for row in db.query(SecurityAudit).order_by(SecurityAudit.id.desc()).limit(100).all()]
