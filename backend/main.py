from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Salon, PartOfSalon, ChairInPart, Barname, RunTurn, ChairInBarname, MarkdownList, FactorList
from .routers import events, seats, checkout, checker, admin
from datetime import datetime

# Auto-create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="سامانه جامع رزرواسیون و فروش آنلاین بلیت گیشو (Gishow API)",
    description="وب‌سرویس‌های مدرن بک‌اند توسعه داده شده با Python و FastAPI معادل سیستم LinduTicket_Site",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(events.router, prefix="/api")
app.include_router(seats.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(checker.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/", tags=["وضعیت سرور"])
def root():
    return {
        "status": "online",
        "service": "Gishow Ticket Reservation FastAPI Backend",
        "version": "2.0.0",
        "docs": "/docs",
        "message": "سامانه فروش آنلاین بلیت گیشو با موفقیت در حال اجرا است."
    }

# Seed default data on startup if database is fresh
@app.on_event("startup")
def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Salon).count() == 0:
            # Seed Salon
            shahr_ma = Salon(
                name="سالن همایش‌های شهرما مشهد",
                city="مشهد",
                address="مشهد مقدس - میدان طالقانی - سالن شهرما",
                capacity=380
            )
            db.add(shahr_ma)
            db.commit()
            db.refresh(shahr_ma)

            # Seed Parts
            vip_part = PartOfSalon(
                salon_id=shahr_ma.id,
                name="جایگاه ویژه (VIP)",
                tier="vip",
                rows=3,
                seats_per_row=14,
                default_price=850000
            )
            ground_part = PartOfSalon(
                salon_id=shahr_ma.id,
                name="همکف وسط",
                tier="ground",
                rows=8,
                seats_per_row=18,
                default_price=650000
            )
            db.add_all([vip_part, ground_part])
            db.commit()

            # Seed Event
            concert = Barname(
                salon_id=shahr_ma.id,
                title="کنسرت بزرگ علیرضا قربانی",
                sub_title="تور کنسرت‌های آواز پارسی و ارکستر سازهای زهی",
                category="concert",
                city="مشهد",
                date_range="۱۸ الی ۲۲ آبان ۱۴۰۵",
                duration_minutes=110,
                description="کنسرت باشکوه علیرضا قربانی در سالن شهرما مشهد",
                min_price=320000,
                max_price=850000,
                is_featured=True,
                is_active=True
            )
            db.add(concert)
            db.commit()
            db.refresh(concert)

            # Seed Sans
            sans = RunTurn(
                barname_id=concert.id,
                date="۱۴۰۵/۰۸/۱۸",
                time="۱۸:۳۰",
                weekday="چهارشنبه"
            )
            db.add(sans)
            db.commit()

            # Seed Promo Codes
            disc = MarkdownList(
                code="GISHOW20",
                discount_percent=20,
                description="۲۰٪ تخفیف ویژه کاربران سامانه گیشو"
            )
            db.add(disc)
            db.commit()
    finally:
        db.close()
