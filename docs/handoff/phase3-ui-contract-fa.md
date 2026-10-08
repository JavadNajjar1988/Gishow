# قرارداد رابط گام سوم

این سند برای تقسیم کار است. شکل درخواست‌های تازه پیشنهادی است و هنوز در سرور اجرا نشده؛ پس از تحویل رابط، در بررسی ادغام تأیید یا اصلاح می‌شود. وجود مسیر در این سند، شواهد اجرای آن نیست. ساخت سرور، مجوزهای تازه، اعتبارسنجی نهایی، تغییر ساختار و ماندگاری داده با مسئول ادغام است. ابزار سازنده فقط رابط و لایه درخواست را مطابق این پیشنهاد آماده می‌کند.

## بخش موجود و قابل استفاده

چرخه حساب، مدیریت نقش‌ها، خواندن گزارش برنامه مجاز و کنترل کد بلیت در سرور موجود است. ابزار درخواست، پیشوند مسیر و مشخصات نشست را مدیریت می‌کند. ابزار وضعیت حساب، مجوزهای سراسری و مجوزهای هر برنامه را ارائه می‌دهد.

```text
src/auth/api.ts
src/auth/AuthContext.tsx
/api/auth/*
/api/access/*
GET /api/admin/events
GET /api/admin/factors
GET /api/admin/metrics
POST /api/checker/verify
GET /api/events/
GET /api/events/{event_id}
GET /api/seats/plan/{run_turn_id}
POST /api/admin/salons
```

فهرست مدیریتی برنامه فعلی فقط شناسه، عنوان و وضعیت فعال را می‌دهد؛ قرارداد کامل ویرایش برنامه نیست. ساخت سالن موجود فقط نام، شهر، نشانی و ظرفیت می‌پذیرد. مدل فعلی سالن را به برنامه متصل می‌کند؛ رابطه سالن مستقل هر سانس هنوز باید در سرور پیاده شود. مبلغ مسیرهای موجود عدد اعشاری است و واحد نهایی گام سوم در آن‌ها اعمال نشده است. مسیرهای پیشنهادی با پیشوند جدا، مانع اشتباه گرفتن قراردادها می‌شوند.

مجوزهای موجود این‌ها هستند. نقش پایه مدیر آن‌ها را دارد؛ نقش برگزارکننده و متصدی ورود محدود به برنامه‌اند. نام نقش، جایگزین بررسی مجوز نیست.

```text
accounts.manage
roles.manage
salons.manage
terminals.read
events.read
reports.read
seats.manage
tickets.check
```

برای ویرایش برنامه و سانس، مجوز تازه زیر پیشنهاد می‌شود و هنوز ارائه نشده است. ابزار سازنده آن را در داده حساب جعل نکند. در ادغام، تعریف و تخصیص این مجوز سمت سرور انجام می‌شود.

```text
events.manage
```

## مسیرهای پیشنهادی و اجرا‌نشده

| روش | مسیر پیشنهادی | کاربرد |
|---|---|---|
| دریافت | `/api/admin/catalog/salons` | فهرست سالن مدیریتی |
| ایجاد | `/api/admin/catalog/salons` | ساخت سالن |
| دریافت، ویرایش، حذف | `/api/admin/catalog/salons/{id}` | سالن مشخص |
| دریافت، ویرایش | `/api/admin/catalog/salons/{id}/plan` | پلان با نسخه و هویت صندلی |
| دریافت، ایجاد | `/api/admin/catalog/events` | برنامه‌های مجاز مدیریتی |
| دریافت، ویرایش، حذف | `/api/admin/catalog/events/{id}` | برنامه مشخص |
| ایجاد | `/api/admin/catalog/events/{id}/run-turns` | سانس برنامه |
| ویرایش، حذف | `/api/admin/catalog/events/{id}/run-turns/{turn_id}` | سانس مشخص با کنترل برنامه والد |
| ایجاد | `/api/admin/catalog/events/{id}/images` | بارگذاری تصویر واقعی |
| حذف | `/api/admin/catalog/events/{id}/images/{image_id}` | حذف تصویر متعلق به برنامه |
| دریافت | `/api/catalog/events` | برنامه‌های قابل نمایش عمومی |
| دریافت | `/api/catalog/events/{id}` | جزئیات عمومی و سانس‌های قابل نمایش |
| دریافت | `/api/catalog/run-turns/{id}/seats` | پلان و موجودی سانس |

دریافت فهرست در پیشنهاد اولیه، آرایه داده است. دریافت مورد مشخص و پاسخ ایجاد یا ویرایش، شیء کامل ذخیره‌شده است. حذف موفق پاسخ بدون محتوا دارد. شناسه‌های نمونه مسیر برای مستندات‌اند، نه نشانی واقعی قابل فراخوانی بدون داده. روش ویرایش پیشنهادی، به‌روزرسانی جزئی است.

```text
GET
POST
PATCH
DELETE
HTTP 204
```

بارگذاری تصویر، فرم چندبخشی با یک فایل است؛ پاسخ آن شناسه و نشانی دارایی ذخیره‌شده را می‌دهد. اگر ابزار درخواست برای فرم چندبخشی توسعه داده شد، سرآیند نوع محتوا را دستی ثابت نگذارید؛ مرورگر مرز فرم را تعیین می‌کند. نشست و سرآیند درخواست موجود حفظ شوند. مسیر تصویر از پاسخ سرور گرفته شود، نه نشانی خصوصی بایگانی یا متن تصویر در حافظه مرورگر.

## شکل پیشنهادی داده

تعریف‌های زیر قرارداد نمایش و ویرایش‌اند، نه مدل پایگاه داده قطعی. فیلدهای محاسباتی مانند ظرفیت و موجودی را رابط به‌عنوان حقیقت نهایی نفرستد. شناسه صندلی ذخیره‌شده تغییر نمی‌کند؛ صندلی تازه پیش از ذخیره شناسه سرور ندارد. کلید محلی ویرایشگر از شناسه سرور جدا باشد. تغییر نسخه هم‌زمان پلان باید توسط سرور رد شود.

```typescript
type Id = number;
type MoneyIRR = number; // integer, non-negative, Number.isSafeInteger

type SalonCatalog = {
  id: Id;
  name: string;
  city: string;
  address: string | null;
  is_active: boolean;
  capacity: number; // server-calculated from the saved plan
  layout_template: 'arena' | 'theater' | 'blackbox' | 'custom';
  stage_position: 'top' | 'center' | 'thrust';
};

type PlanSeat = {
  id: Id | null; // null for a new seat; assigned by server on save
  row_label: string;
  seat_label: string;
  x: number;
  y: number;
  is_accessible: boolean;
  is_enabled: boolean;
};

type PlanPart = {
  id: Id | null;
  name: string;
  sort_order: number;
  tier: 'vip' | 'ground' | 'balcony' | 'lodge';
  shape: 'straight' | 'arc' | 'angled_left' | 'angled_right';
  door_access: string | null;
  seats: PlanSeat[];
};

type SalonPlan = {
  salon_id: Id;
  version: number;
  parts: PlanPart[];
  aisles: {x: number; y: number; width: number; height: number}[];
};

type EventCatalog = {
  id: Id;
  title: string;
  sub_title: string | null;
  category: 'concert' | 'theater' | 'comedy' | 'cinema' | 'conference';
  description: string | null;
  cast: {name: string; role: string}[];
  duration_minutes: number;
  rules: string[];
  ticket_description: string | null;
  language: 'fa' | 'en';
  sort_order: number;
  is_featured: boolean;
  publication_status: 'draft' | 'published' | 'archived';
  announce_at: string | null;
  sale_currency: 'IRR';
  display_currency: 'IRR' | 'toman';
  images: {id: Id; url: string; alt: string; sort_order: number}[];
  run_turns: RunTurnCatalog[];
};

type RunTurnCatalog = {
  id: Id;
  event_id: Id;
  salon_id: Id;
  salon_name: string; // read-only
  salon_address: string | null; // read-only
  starts_at: string;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  is_visible: boolean;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  part_prices: {part_id: Id; amount_irr: MoneyIRR}[];
  available_seats: number; // read-only, from server inventory
};

type SeatAvailability = {
  id: Id;
  chair_id: Id;
  part_id: Id;
  row_label: string;
  seat_label: string;
  x: number;
  y: number;
  price_irr: MoneyIRR;
  status: string; // preserve raw status; unknown states are unavailable
};
```

رابط ساخت، شناسه یا داده محاسباتی مورد جدید را نفرستد. سرور قرارداد ورودی دقیق را در ادغام نهایی می‌کند. برای پول از عدد صحیح امن استفاده شود؛ مقدار فراتر از محدوده امن عددی رد شود، نه گرد شود. قیمت نمایش از موجودی و قیمت جایگاه محاسبه می‌شود؛ حداقل و حداکثر ساختگی برای برنامه تولید نشود.

تاریخ تازه باید زمان استاندارد همراه با اختلاف ساعت باشد. نمایش کاربر شمسی است. منطقه زمانی ورودی تازه، تهران در نظر گرفته می‌شود؛ تبدیل ساعت بدون کتابخانه معتبر یا قرارداد تأییدشده حدس زده نشود. این تصمیم برای رکورد تازه است؛ منطقه زمانی داده تاریخی هنوز تعیین نشده است و به واردسازی تسری پیدا نمی‌کند.

```text
2026-10-07T18:30:00+03:30
Asia/Tehran
```

مکان اختیاری است؛ نبود مختصات با صفر جایگزین نشود. نقشه بدون مختصات نباید محل حدسی نشان دهد. وضعیت ناشناخته صندلی نباید آزاد تلقی شود. وضعیت انتخاب موقت در مرورگر از وضعیت ذخیره‌شده صندلی جدا باشد.

## رفتار خطا و پذیرش

عدم ورود، نبود مجوز، نبود مسیر یا مورد، تعارض ویرایش و داده نامعتبر، جدا نمایش داده شوند. در این مرحله نبود مسیر پیشنهادی، به معنای منتظر بودن اتصال سرور است. برای اعلام موفقیت نیاز به پاسخ موفق واقعی است. پاک‌کردن داده دارای خرید یا تغییر هویت صندلی وابسته به فروش، تصمیم سرور است و رابط نباید رد سرور را دور بزند.

```text
401: sign in required
403: permission denied
404: route or resource unavailable
409: conflicting version or dependent sales
422: invalid data
5xx: server operation failed
```

بازبینی ادغام، قراردادهای تازه را با پشتیبان قدیمی، مجوز سمت سرور، آزمون ماندگاری و موجودی مشترک تطبیق می‌دهد. رابطی که به مسیر اجرا‌نشده متصل نشده، به‌عنوان رابط آماده اتصال پذیرفته می‌شود؛ گام سوم فقط پس از کارکرد کامل سرور و آزمون پذیرش تکمیل‌شده محسوب خواهد شد.
