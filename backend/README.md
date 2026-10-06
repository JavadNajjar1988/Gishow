# مستندات و راهنمای راه‌اندازی بک‌اند گیشو (FastAPI)

این پکیج بازنویسی کامل، مدرن و بهینه‌سازی‌شده بک‌اند پروژه **گیشو (LinduTicket_Site)** با زبان **پایتون (Python 3.10+)** و فریم‌ورک سریع **FastAPI** است.

---

### ۱. معماری و ساختار فایل‌ها

```
backend/
├── main.py                  # نقطه ورود اصلی اپلیکیشن و راه‌اندازی CORS
├── database.py              # اتصال دیتابیس (SQLAlchemy Engine & Session)
├── models.py                # مدل‌های ORM معادل جداول دیتابیس gishowir_LinduTicket
├── schemas.py               # مدل‌های اعتبارسنجی ورودی/خروجی (Pydantic v2)
├── routers/
│   ├── events.py            # روتر رویدادها، کنسرت‌ها و سانس‌ها
│   ├── seats.py             # روتر پلان سالن و قفل موقت صندلی با تایمر ۱۰ دقیقه
│   ├── checkout.py          # روتر ایجاد فاکتور، کد تخفیف و صدور بلیت
│   ├── checker.py           # روتر گیت ورود و استعلام بلیت (checker.gishow.ir)
│   └── admin.py             # روتر گزارش‌های مالی و آمار مدیریتی
├── services/
│   ├── payment_service.py   # وب‌سرویس‌های درگاه بانکی شاپرک (ملت، پارسیان، زرین‌پال)
│   └── sms_service.py       # سرویس پیامک کاوه‌نگار (ارسال لینک بلیت به خریدار)
├── requirements.txt         # لیست کتابخانه‌های پایتون
├── Dockerfile               # فایل ساخت ایمیج داکر
└── docker-compose.yml       # راه‌اندازی هم‌زمان FastAPI و دیتابیس PostgreSQL
```

---

### ۲. نحوه اجرای محلی (Local Development)

۱. ایجاد و فعال‌سازی محیط مجازی:
```bash
python3 -m venv venv
source venv/bin/activate  # در ویندوز: venv\Scripts\activate
```

۲. نصب پیش‌نیازها:
```bash
pip install -r requirements.txt
```

۳. اجرای سرور توسعه با Uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

۴. دسترسی به مستندات تعاملی Swagger و تست روت‌ها:
* مستندات Swagger UI: `http://localhost:8000/docs`
* مستندات ReDoc: `http://localhost:8000/redoc`

---

### ۳. اتصال به فرانت‌اند ری‌اکت

فرانت‌اند ری‌اکت با تنظیم آدرس پایه API به `http://localhost:8000/api` مستقیماً به این بک‌اند متصل می‌شود. کلیه هدرهای CORS به طور کامل در `main.py` تنظیم شده‌اند.
