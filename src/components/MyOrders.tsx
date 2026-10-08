import React,{useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {Ticket,RefreshCw,Download,ExternalLink} from 'lucide-react';
import {Order,Reservation,salesApi} from '../services/sales';
import {formatPrice,toPersianDigits} from '../utils/formatters';
const states:Record<string,string>={pending:'در انتظار پرداخت',payment_pending:'در انتظار نتیجه درگاه',expired:'مهلت پایان یافته',cancelled:'لغوشده',paid:'پرداخت‌شده',payment_review:'پرداخت تأییدشده؛ نیازمند بررسی موجودی'};
const date=(value:string)=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
function SeatTicket({order,ticket}:{order:Order;ticket:Order['tickets'][number]}){
  const [qr,setQr]=useState('');const item=order.items.find(i=>i.seat_id===ticket.seat_id);
  useEffect(()=>{let active=true;void QRCode.toDataURL('GISHOW:TICKET:'+ticket.id,{width:160,margin:2}).then(value=>{if(active)setQr(value);}).catch(()=>{if(active)setQr('');});return ()=>{active=false;};},[ticket.id]);
  return <div className="site-inset p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
    <div className="min-w-0 space-y-2 w-full"><p className="font-bold flex items-center gap-2"><Ticket size={18}/>بلیت مستقل ورود</p><p>{item?.part_name}؛ ردیف {toPersianDigits(item?.row||0)}، صندلی {toPersianDigits(item?.number||0)}</p>{item?.starts_at&&<p className="text-sm site-muted">{date(item.starts_at)}</p>}<p className="text-xs site-muted">برای پذیرش، همین رمزینه را به مسئول ورودی نشان دهید.</p><code dir="ltr" className="block text-[10px] break-all select-all">GISHOW:TICKET:{ticket.id}</code></div>
    {qr&&<img src={qr} alt="رمزینه مستقل بلیت" className="rounded-xl shrink-0" width={140} height={140}/>}
  </div>;
}
export function MyOrders(){
  const [orders,setOrders]=useState<Order[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [reservations,setReservations]=useState<Reservation[]>([]);
  const [paymentStatus,setPaymentStatus]=useState<{configured:boolean;mode:string|null}|null>(null);
  async function load(){setBusy(true);setError('');try{const [o,r,p]=await Promise.all([salesApi.orders(),salesApi.reservations(),salesApi.paymentStatus()]);setOrders(o);setReservations(r);setPaymentStatus(p);}catch(e){setOrders([]);setReservations([]);setError((e as Error).message);}finally{setBusy(false);}}
  useEffect(()=>{void load();},[]);
  async function work(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();await load();}catch(e){setError((e as Error).message);setBusy(false);}}
  async function pay(id:string){setBusy(true);setError('');try{const result=await salesApi.payment(id);window.location.assign(result.payment_url);}catch(e){setError((e as Error).message);setBusy(false);}}
  return <section className="space-y-5"><div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="font-bold text-xl">سفارش‌ها و بلیت‌ها</h3><p className="site-muted text-sm mt-1">جزئیات خرید و بلیت هر صندلی در حساب شما نگهداری می‌شود.</p></div><button className="site-secondary flex items-center gap-2" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/>دریافت دوباره</button></div>
    {error&&<p role="alert" className="site-error">{error}</p>}{busy&&<p role="status" className="site-muted">در حال دریافت…</p>}
    {paymentStatus?.mode==='sandbox'&&<p className="site-notice">درگاه در حالت آزمایشی است؛ وجه واقعی دریافت نمی‌شود.</p>}
    {paymentStatus&&!paymentStatus.configured&&<p className="site-notice">درگاه هنوز تنظیم نشده است؛ پرداخت فعال نیست.</p>}
    {!busy&&!error&&!orders.length&&<div className="site-inset p-8 text-center"><Ticket className="mx-auto mb-3 site-muted" size={32}/><p>هنوز سفارشی ثبت نشده است.</p><p className="site-muted text-sm mt-2">برنامه دلخواه را انتخاب و صندلی‌های خود را رزرو کنید.</p></div>}
    {reservations.filter(r=>!orders.some(o=>o.reservation_id===r.id)).map(r=><article key={r.id} className="site-inset p-4 space-y-3"><p>رزرو فعال؛ تعداد صندلی {toPersianDigits(r.seat_ids.length)}</p><p className="site-muted text-sm">مهلت رزرو: {date(r.expires_at)}</p><div className="flex flex-wrap gap-2"><button className="site-primary" disabled={busy} onClick={()=>void work(()=>salesApi.createOrder(r.id))}>ثبت سفارش این رزرو</button><button className="site-secondary" disabled={busy} onClick={()=>void work(()=>salesApi.cancel(r.id))}>لغو این رزرو</button></div></article>)}
    {orders.map(o=><article key={o.id} className="site-surface overflow-hidden"><div className="p-4 sm:p-6 space-y-4"><div className="flex flex-wrap gap-3 justify-between"><div><h4 className="font-bold text-lg">{o.items[0]?.event_title}</h4>{o.items[0]?.salon_name&&<p className="site-muted text-sm mt-1">{o.items[0].salon_name}</p>}</div><span className={`rounded-full px-3 py-1 text-sm h-fit ${o.status==='paid'?'bg-emerald-500/15 text-emerald-600':'bg-amber-500/15 text-amber-600'}`}>{states[o.status]||'نیازمند بررسی'}</span></div>
      {o.gateway_mode==='sandbox'&&<p className="site-notice text-sm">سفارش آزمایشی</p>}
      <div className="site-inset p-4 grid sm:grid-cols-3 gap-3 text-sm"><p>جمع بلیت‌ها<br/><strong>{formatPrice(o.subtotal_irr/10)}</strong></p><p>تخفیف<br/><strong>{formatPrice(o.discount_amount_irr/10)}</strong>{o.discount_code&&<code className="block text-xs" dir="ltr">{o.discount_code}</code>}</p><p>مبلغ سفارش<br/><strong className="text-lg">{formatPrice(o.amount_irr/10)}</strong></p></div>
      <details className="text-sm"><summary className="cursor-pointer site-muted">شناسه و اطلاعات پرداخت</summary><p className="mt-2">شماره سفارش</p><code dir="ltr" className="block text-xs break-all">{o.id}</code><p className="mt-2">پایان مهلت: {date(o.expires_at)}</p>{o.ref_id&&<p>شناسه پرداخت: <bdi>{toPersianDigits(o.ref_id)}</bdi></p>}</details>
      {['pending','payment_pending'].includes(o.status)&&<button className="site-primary" disabled={busy||!paymentStatus?.configured||Date.parse(o.expires_at)<=Date.now()} onClick={()=>void pay(o.id)}>ادامه پرداخت با زرین‌پال</button>}
      {o.status==='paid'&&<><div className="flex flex-wrap gap-2"><a className="site-primary inline-flex items-center gap-2" href={`/api/sales/orders/${o.id}/receipt`} download><Download size={16}/>دریافت فایل رسید و بلیت‌ها</a><a className="site-secondary inline-flex items-center gap-2" href={`/api/sales/orders/${o.id}/receipt?download=false`} target="_blank" rel="noopener"><ExternalLink size={16}/>نمایش نسخه چاپی</a></div><p className="site-muted text-xs">نسخه چاپی را می‌توانید از مرورگر به صورت پی‌دی‌اف ذخیره کنید.</p></>}
      {o.tickets.map(t=><SeatTicket key={t.id} order={o} ticket={t}/>)}</div></article>)}
  </section>;
}
