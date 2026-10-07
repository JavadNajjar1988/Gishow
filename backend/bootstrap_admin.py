"""Create the first administrator locally; never exposes a public bootstrap API."""
import argparse
import getpass
from .database import SessionLocal
from .models import UserList, Role, UserRole
from .security import normalize_mobile, hash_password, make_recovery_codes, audit

def create_first_admin(db, mobile, name, password):
    mobile = normalize_mobile(mobile)
    name = name.strip()
    if not 2 <= len(name) <= 150 or not 12 <= len(password) <= 128:
        raise ValueError('Invalid name or password length')
    role = db.query(Role).filter_by(code='admin').with_for_update().one()
    if db.query(UserRole).filter_by(role_id=role.id).first():
        raise ValueError('Administrator already exists; use authorized account management')
    if db.query(UserList).filter_by(mobile=mobile).first():
        raise ValueError('Mobile already exists; no existing account was changed')
    user = UserList(full_name=name, mobile=mobile, password_hash=hash_password(password), is_active=True, role='customer')
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    codes = make_recovery_codes(db, user.id)
    audit(db, user.id, 'account.bootstrap', user.id)
    db.commit()
    return user.id, codes

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mobile', required=True)
    parser.add_argument('--name', required=True)
    args = parser.parse_args()
    password = getpass.getpass('New password (12-128 characters): ')
    if password != getpass.getpass('Repeat password: '):
        raise SystemExit('Password confirmation invalid')
    with SessionLocal() as db:
        try:
            _, codes = create_first_admin(db, args.mobile, args.name, password)
        except ValueError as error:
            raise SystemExit(str(error))
        print('Administrator created. Store these one-time recovery codes offline:')
        for code in codes:
            print(code)

if __name__ == '__main__':
    main()
