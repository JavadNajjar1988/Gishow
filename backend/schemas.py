from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CastMemberSchema(BaseModel):
    name: str
    role: str

class RunTurnOut(BaseModel):
    id: int
    date: str
    time: str
    weekday: str
    is_sold_out: bool = False
    available_seats: Optional[int] = None

    class Config:
        from_attributes = True

class PartOfSalonOut(BaseModel):
    id: int
    name: str
    tier: str
    rows: int
    seats_per_row: int
    default_price: float

    class Config:
        from_attributes = True

class SalonOut(BaseModel):
    id: int
    name: str
    city: str
    address: Optional[str] = None
    capacity: int
    parts: List[PartOfSalonOut] = []

    class Config:
        from_attributes = True

class BarnameOut(BaseModel):
    id: int
    title: str
    sub_title: Optional[str] = None
    category: str
    city: str
    salon_name: Optional[str] = None
    salon_id: int
    date_range: str
    duration_minutes: int
    description: Optional[str] = None
    min_price: float
    max_price: float
    banner_gradient: Optional[str] = None
    is_featured: bool = False
    run_turns: List[RunTurnOut] = []

    class Config:
        from_attributes = True

class SeatItemOut(BaseModel):
    id: int
    part_id: int
    part_name: str
    row: int
    number: int
    price: float
    status: str # 'available', 'reserved', 'sold'

class SeatLockRequest(BaseModel):
    run_turn_id: int
    seat_ids: List[int]
    lock_duration_seconds: int = 600 # 10 minutes temporary lock

class CheckoutRequest(BaseModel):
    run_turn_id: int
    seat_ids: List[int]
    customer_name: str
    customer_mobile: str
    customer_national_code: str
    discount_code: Optional[str] = None
    payment_gateway: str = "mellat" # 'mellat', 'parsian', 'zarinpal'

class FactorOut(BaseModel):
    factor_number: str
    tracking_code: str
    ref_id: Optional[str] = None
    event_title: str
    salon_name: str
    sans_date: str
    sans_time: str
    customer_name: str
    customer_mobile: str
    customer_national_code: str
    subtotal: float
    discount_amount: float
    final_amount: float
    payment_gateway: str
    paid_at: datetime
    qr_payload: str
    is_checked_in: bool
    checked_in_at: Optional[datetime] = None

class TicketCheckRequest(BaseModel):
    code: str = Field(..., description="شماره فاکتور یا کد رهگیری بلیت")

class TicketCheckResponse(BaseModel):
    status: str # 'valid', 'already_checked', 'invalid'
    message: str
    timestamp: str
    factor: Optional[FactorOut] = None

class AdminMetrics(BaseModel):
    total_revenue: float
    total_tickets_sold: int
    active_events_count: int
    active_salons_count: int
