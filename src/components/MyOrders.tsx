import React,{useEffect,useState} from 'react';
import {Order,Reservation,salesApi} from '../services/sales';
import {formatPrice,toPersianDigits} from '../utils/formatters';
const states:Record<string,string>={pending:'در انتظار پرداخت',payment_pending:'در انتظار نتیجه درگاه',expired:'مهلت پایان یافته',cancelled:'لغوشده',paid:'پرداخت‌شده',payment_review:'پرداخت تأییدشده؛ نیازمند بررسی موجودی'};
export function MyOrders(){
  const [orders,setOrders]=useState<Order[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [reservations,setReservations]=useState<Reservation[]>([]);
  const [paymentStatus,setPaymentStatus]=useState<{configured:boolean;mode:string|null}|null>(null);
  async function load(){setBusy(true);setError('');try{const [o,r,p]=await Promise.all([salesApi.orders(),salesApi.reservations(),salesApi.paymentStatus()]);setOrders(o);setReservations(r);setPaymentStatus(p);}catch(e){setOrders([]);setReservations([]);setError((e as Error).message);}finally{setBusy(false);}}
  useEffect(()=>{void load();},[]);
  async function pay(id:string){setBusy(true);setError('');try{const result=await salesApi.payment(id);window.location.assign(result.payment_url);}catch(e){setError((e as Error).message);setBusy(false);}}
  return <section className="border rounded-xl p-3 space-y-3"><h3 className="font-bold">سفارش‌های من</h3><button disabled={busy} onClick={()=>void load()}>دریافت دوباره سفارش‌ها</button>
    {error&&<p role="alert" className="text-rose-700">{error}</p>}{busy&&<p role="status">در حال دریافت…</p>}
    {paymentStatus?.mode==='sandbox'&&<p>درگاه در حالت آزمایشی است؛ وجه واقعی دریافت نمی‌شود.</p>}
    {paymentStatus&&!paymentStatus.configured&&<p>درگاه هنوز تنظیم نشده است؛ پرداخت فعال نیست.</p>}
    {!busy&&!error&&!orders.length&&<p>سفارشی ثبت نشده است.</p>}
    {reservations.filter(r=>!orders.some(o=>o.reservation_id===r.id)).map(r=><article key={r.id} className="border rounded-lg p-3"><p>رزرو فعال؛ تعداد صندلی {toPersianDigits(r.seat_ids.length)}</p><button disabled={busy} onClick={async()=>{setBusy(true);try{await salesApi.createOrder(r.id);await load();}catch(e){setError((e as Error).message);setBusy(false);}}}>ثبت سفارش این رزرو</button><button disabled={busy} onClick={async()=>{setBusy(true);try{await salesApi.cancel(r.id);await load();}catch(e){setError((e as Error).message);setBusy(false);}}}>لغو این رزرو</button></article>)}
    {orders.map(o=><article key={o.id} className="border rounded-lg p-3 space-y-2"><h4>{o.items[0]?.event_title}</h4>{o.gateway_mode==='sandbox'&&<p>سفارش آزمایشی</p>}<p>{states[o.status] || 'نیازمند بررسی'}؛ مبلغ {formatPrice(o.amount_irr/10)}</p>
      <p>شماره سفارش</p><code dir="ltr" className="block text-xs break-all">{o.id}</code>
      <p>پایان مهلت: {new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}).format(new Date(o.expires_at))}</p>
      {['pending','payment_pending'].includes(o.status)&&<button disabled={busy||!paymentStatus?.configured} onClick={()=>void pay(o.id)}>ادامه پرداخت با زرین‌پال</button>}
      {o.ref_id&&<p>شناسه پرداخت: <bdi>{o.ref_id}</bdi></p>}
      {o.tickets.map(t=>{const item=o.items.find(i=>i.seat_id===t.seat_id);return <div key={t.id}><p>بلیت {item?.part_name}؛ ردیف {toPersianDigits(item?.row || 0)}، صندلی {toPersianDigits(item?.number || 0)}</p><code dir="ltr" className="block text-xs break-all">{t.id}</code></div>;})}
    </article>)}
  </section>;
}
