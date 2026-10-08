import base64,json,html
from io import BytesIO
from datetime import datetime
from zoneinfo import ZoneInfo
import qrcode
from persiantools.jdatetime import JalaliDateTime
from ..models import SaleTicket

def render_receipt(db,order):
    escape=lambda value:html.escape(str(value or ''),quote=True)
    digits=lambda text:str(text).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))
    money=lambda amount:digits(f'{amount:,}')+' ریال'
    tickets=db.query(SaleTicket).filter_by(order_id=order.id).all()
    items={i['seat_id']:i for i in json.loads(order.items_json)}
    cards=[]
    for ticket in tickets:
        item=items[ticket.seat_id];buffer=BytesIO()
        qrcode.make('GISHOW:TICKET:'+ticket.id).save(buffer,format='PNG')
        image=base64.b64encode(buffer.getvalue()).decode('ascii')
        when=item.get('starts_at')
        date=digits(JalaliDateTime(datetime.fromisoformat(when).astimezone(ZoneInfo('Asia/Tehran'))).strftime('%Y/%m/%d — %H:%M')) if when else 'تاریخ در سفارش اولیه ثبت نشده است'
        cards.append(f'<article class="ticket"><div><span class="eyebrow">لیندو تیکت · بلیت مستقل ورود</span><h2>{escape(item["event_title"])}</h2><p>{escape(item.get("salon_name"))}</p><p>{escape(item.get("address"))}</p><p>زمان اجرا به وقت تهران؛ تاریخ شمسی</p><p dir="ltr">{escape(date)}</p><div class="seat-block"><div><span>جایگاه</span><strong class="part">{escape(item["part_name"])}</strong></div><div><span>ردیف</span><strong>{digits(item["row"])}</strong></div><div><span>صندلی</span><strong>{digits(item["number"])}</strong></div></div><p>{escape(order.customer_name)}</p></div><div class="barcode"><p class="eyebrow">پذیرش یک‌باره</p><img width="156" height="156" alt="رمزینه مستقل بلیت" src="data:image/png;base64,{image}"><p>کد کامل بلیت</p><code>GISHOW:TICKET:{escape(ticket.id)}</code></div></article>')
    test='<p class="notice">سفارش آزمایشی؛ این رسید نشان‌دهنده پرداخت وجه واقعی نیست.</p>' if order.gateway_mode=='sandbox' else ''
    paid=digits(JalaliDateTime(order.paid_at.replace(tzinfo=ZoneInfo('UTC')).astimezone(ZoneInfo('Asia/Tehran'))).strftime('%Y/%m/%d %H:%M'))
    return f'''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>رسید و بلیت گیشو</title>
<style>body{{font-family:Vazirmatn,Tahoma,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px;line-height:1.8}}main{{max-width:900px;margin:auto}}header{{border-radius:24px;padding:24px;background:linear-gradient(110deg,#f59e0b,#ea580c);color:white}}.receipt,.ticket{{background:#fffcf5;border:1px solid #e8dfcd;border-radius:20px;padding:24px;margin-top:20px;break-inside:avoid}}.ticket{{display:flex;justify-content:space-between;gap:24px;padding:0;overflow:hidden}}.ticket>div:first-child{{padding:24px;flex:1;min-width:0}}.seat-block{{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:16px;margin:20px 0;padding:16px 0;border-block:1px solid #e8dfcd}}.seat-block span{{display:block;font-size:11px;color:#64748b}}.seat-block strong{{display:block;font-size:36px;line-height:1.5}}.seat-block .part{{font-size:20px}}h1,h2,p{{margin:8px 0}}.eyebrow{{color:#b45309;font-size:12px}}code{{display:block;direction:ltr;overflow-wrap:anywhere;font-size:11px}}.barcode{{width:200px;padding:20px;background:#f6eedc;text-align:center;flex-shrink:0;border-right:2px dashed #d5c8ae;display:flex;flex-direction:column;align-items:center;justify-content:center}}.barcode img{{border:8px solid white;border-radius:12px}}.notice{{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:12px}}@media(max-width:600px){{body{{padding:12px}}.ticket{{flex-direction:column}}.barcode{{width:auto;border-right:0;border-top:2px dashed #d5c8ae}}}}@media print{{body{{background:white;padding:0}}header{{background:white;color:black;border-bottom:3px solid #f59e0b}}.ticket{{page-break-inside:avoid}}}}@page{{size:A4;margin:12mm}}</style>
<main><header><p>لیندو تیکت</p><h1>رسید پرداخت و بلیت‌ها</h1></header>{test}<section class="receipt"><h2>اطلاعات سفارش</h2><p>{escape(order.customer_name)}؛ {digits(order.customer_mobile)}</p><p>شماره سفارش</p><code>{escape(order.id)}</code><p>شناسه پرداخت: {digits(order.ref_id)}</p><p>زمان پرداخت به وقت تهران؛ تاریخ شمسی</p><p dir="ltr">{escape(paid)}</p><p>جمع بلیت‌ها: {money(order.subtotal_irr)}</p><p>تخفیف: {money(order.discount_amount_irr)}</p><p><strong>پرداخت‌شده: {money(order.amount_irr)}</strong></p><p>برای چاپ یا ذخیره نسخه پی‌دی‌اف، از گزینه چاپ مرورگر استفاده کنید.</p></section>{''.join(cards)}</main></html>'''
