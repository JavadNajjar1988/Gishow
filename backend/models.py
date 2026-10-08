from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, LargeBinary, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Salon(Base):
    __tablename__ = "tbl_salons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False, default="مشهد")
    address = Column(String(500), nullable=True)
    capacity = Column(Integer, default=0)
    plan_version = Column(Integer, nullable=False, default=0, server_default="0")
    config_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parts = relationship("PartOfSalon", back_populates="salon", cascade="all, delete-orphan")
    barnames = relationship("Barname", back_populates="salon")


class PartOfSalon(Base):
    __tablename__ = "tbl_part_of_salons"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("tbl_salons.id"), nullable=False)
    name = Column(String(100), nullable=False) # e.g. "جایگاه ویژه VIP", "همکف وسط", "بالکن"
    tier = Column(String(50), default="ground") # 'vip', 'ground', 'balcony'
    rows = Column(Integer, default=5)
    seats_per_row = Column(Integer, default=10)
    default_price = Column(Float, default=300000)
    config_json = Column(Text, nullable=True)

    salon = relationship("Salon", back_populates="parts")
    chairs = relationship("ChairInPart", back_populates="part", cascade="all, delete-orphan")


class ChairInPart(Base):
    __tablename__ = "tbl_chairs_in_part"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("tbl_part_of_salons.id"), nullable=False)
    row_number = Column(Integer, nullable=False)
    seat_number = Column(Integer, nullable=False)

    part = relationship("PartOfSalon", back_populates="chairs")


class Barname(Base):
    __tablename__ = "tbl_barnames"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("tbl_salons.id"), nullable=False)
    title = Column(String(250), nullable=False)
    sub_title = Column(String(300), nullable=True)
    category = Column(String(50), default="concert") # 'concert', 'theater', 'comedy', 'cinema', 'conference'
    city = Column(String(100), default="مشهد")
    date_range = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, default=90)
    description = Column(Text, nullable=True)
    cast_json = Column(Text, nullable=True) # JSON list of cast members
    config_json = Column(Text, nullable=True)
    min_price = Column(Float, default=200000)
    max_price = Column(Float, default=800000)
    banner_gradient = Column(String(100), default="from-amber-600 via-stone-900 to-slate-950")
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    salon = relationship("Salon", back_populates="barnames")
    run_turns = relationship("RunTurn", back_populates="barname", cascade="all, delete-orphan")
    images = relationship("EventImage", cascade="all, delete-orphan")


class EventImage(Base):
    __tablename__ = 'catalog_event_images'
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey('tbl_barnames.id'), nullable=False, unique=True)
    content = Column(LargeBinary, nullable=False)
    content_hash = Column(String(64), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    alt = Column(String(500), nullable=False, default='')


class RunTurn(Base):
    __tablename__ = "tbl_run_turns"

    id = Column(Integer, primary_key=True, index=True)
    barname_id = Column(Integer, ForeignKey("tbl_barnames.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("tbl_salons.id"), nullable=True)
    config_json = Column(Text, nullable=True)
    date = Column(String(50), nullable=False) # e.g. "۱۴۰۵/۰۸/۱۸"
    time = Column(String(20), nullable=False) # e.g. "۱۸:۳۰"
    weekday = Column(String(50), nullable=False) # e.g. "چهارشنبه"
    is_sold_out = Column(Boolean, default=False)

    barname = relationship("Barname", back_populates="run_turns")
    chair_statuses = relationship("ChairInBarname", back_populates="run_turn", cascade="all, delete-orphan")
    factors = relationship("FactorList", back_populates="run_turn")


class ChairInBarname(Base):
    __tablename__ = "tbl_chair_in_barname"

    id = Column(Integer, primary_key=True, index=True)
    run_turn_id = Column(Integer, ForeignKey("tbl_run_turns.id"), nullable=False)
    chair_id = Column(Integer, ForeignKey("tbl_chairs_in_part.id"), nullable=False)
    status = Column(String(20), default="available") # 'available', 'reserved', 'sold'
    price = Column(Float, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    reservation_id = Column(String(36), ForeignKey('sale_reservations.id'), nullable=True, index=True)

    run_turn = relationship("RunTurn", back_populates="chair_statuses")
    chair = relationship("ChairInPart")


class MarkdownList(Base):
    __tablename__ = "tbl_markdown_lists"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_percent = Column(Float, default=0)
    fixed_amount = Column(Float, default=0)
    description = Column(String(250), nullable=True)
    is_active = Column(Boolean, default=True)


class FactorList(Base):
    __tablename__ = "tbl_factor_lists"

    id = Column(Integer, primary_key=True, index=True)
    factor_number = Column(String(50), unique=True, index=True, nullable=False)
    tracking_code = Column(String(50), unique=True, index=True, nullable=False)
    ref_id = Column(String(100), nullable=True)
    run_turn_id = Column(Integer, ForeignKey("tbl_run_turns.id"), nullable=False)
    customer_name = Column(String(150), nullable=False)
    customer_mobile = Column(String(20), nullable=False)
    customer_national_code = Column(String(20), nullable=False)
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    final_amount = Column(Float, nullable=False)
    payment_gateway = Column(String(50), default="mellat") # 'mellat', 'parsian', 'zarinpal'
    paid_at = Column(DateTime, default=datetime.utcnow)
    qr_payload = Column(String(500), nullable=False)
    is_checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime, nullable=True)

    run_turn = relationship("RunTurn", back_populates="factors")


class UserList(Base):
    __tablename__ = "tbl_user_lists"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    mobile = Column(String(20), unique=True, index=True, nullable=False)
    national_code = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    role = Column(String(50), default="customer") # 'admin', 'producer', 'checker', 'customer'
    created_at = Column(DateTime, default=datetime.utcnow)


class BankTerminal(Base):
    __tablename__ = "tbl_bank_terminals"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(50), nullable=False) # 'Mellat', 'Parsian', 'ZarinPal'
    terminal_id = Column(String(50), nullable=False)
    username = Column(String(50), nullable=True)
    password = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)


class Role(Base):
    __tablename__ = "auth_roles"
    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    scope = Column(String(10), nullable=False)  # global or event


class Permission(Base):
    __tablename__ = "auth_permissions"
    code = Column(String(80), primary_key=True)
    name = Column(String(150), nullable=False)
    scope = Column(String(10), nullable=False)


class RolePermission(Base):
    __tablename__ = "auth_role_permissions"
    role_id = Column(Integer, ForeignKey("auth_roles.id"), primary_key=True)
    permission_code = Column(String(80), ForeignKey("auth_permissions.code"), primary_key=True)


class UserRole(Base):
    __tablename__ = "auth_user_roles"
    user_id = Column(Integer, ForeignKey("tbl_user_lists.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("auth_roles.id"), primary_key=True)


class EventRole(Base):
    __tablename__ = "auth_event_roles"
    user_id = Column(Integer, ForeignKey("tbl_user_lists.id"), primary_key=True)
    event_id = Column(Integer, ForeignKey("tbl_barnames.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("auth_roles.id"), primary_key=True)


class UserPermission(Base):
    __tablename__ = "auth_user_permissions"
    user_id = Column(Integer, ForeignKey("tbl_user_lists.id"), primary_key=True)
    permission_code = Column(String(80), ForeignKey("auth_permissions.code"), primary_key=True)
    allowed = Column(Boolean, nullable=False)


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    token_hash = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("tbl_user_lists.id"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)


class RecoveryCode(Base):
    __tablename__ = "auth_recovery_codes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("tbl_user_lists.id"), nullable=False, index=True)
    code_hash = Column(String(64), unique=True, nullable=False)
    used_at = Column(DateTime, nullable=True)


class AuthThrottle(Base):
    __tablename__ = "auth_throttles"
    key = Column(String(64), primary_key=True)
    attempts = Column(Integer, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class SecurityAudit(Base):
    __tablename__ = "auth_audit"
    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("tbl_user_lists.id"), nullable=True)
    target_id = Column(Integer, nullable=True)
    action = Column(String(80), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class SaleReservation(Base):
    __tablename__ = 'sale_reservations'
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('tbl_user_lists.id'), nullable=False, index=True)
    run_turn_id = Column(Integer, ForeignKey('tbl_run_turns.id'), nullable=False)
    seat_ids_json = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(30), nullable=False, default='active')

class SaleOrder(Base):
    __tablename__ = 'sale_orders'
    id = Column(String(36), primary_key=True)
    reservation_id = Column(String(36), ForeignKey('sale_reservations.id'), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey('tbl_user_lists.id'), nullable=False, index=True)
    amount_irr = Column(BigInteger, nullable=False)
    items_json = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default='pending')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    authority = Column(String(100), nullable=True, unique=True)
    ref_id = Column(String(100), nullable=True, unique=True)
    gateway_mode = Column(String(10), nullable=True)
    paid_at = Column(DateTime, nullable=True)

class SaleTicket(Base):
    __tablename__ = 'sale_tickets'
    id = Column(String(64), primary_key=True)
    order_id = Column(String(36), ForeignKey('sale_orders.id'), nullable=False, index=True)
    seat_id = Column(Integer, ForeignKey('tbl_chair_in_barname.id'), nullable=False, unique=True)
    checked_in_at = Column(DateTime, nullable=True)
