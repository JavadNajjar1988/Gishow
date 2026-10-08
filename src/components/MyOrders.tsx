import React,{useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {Ticket,RefreshCw,Download,ExternalLink,CalendarDays,MapPin,ArrowUpLeft,CheckCircle2} from 'lucide-react';
import {Order,Reservation,salesApi} from '../services/sales';
import {formatPrice,toPersianDigits} from '../utils/formatters';
const states:Record<string,string>={pending:'در انتظار پرداخت',payment_pending:'در انتظار نتیجه درگاه',expired:'مهلت پایان یافته',cancelled:'لغوشده',paid:'پرداخت‌شده',payment_review:'پرداخت تأییدشده؛ نیازمند بررسی موجودی'};
const date=(value:string)=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
function SeatTicket({order,ticket}:{order:Order;ticket:Order['tickets'][number]}){
  const [qr,setQr]=useState('');const item=order.items.find(i=>i.seat_id===ticket.seat_id);
  useEffect(()=>{let active=true;void QRCode.toDataURL('GISHOW:TICKET:'+ticket.id,{width:160,margin:2}).then(value=>{if(active)setQr(value);}).catch(()=>{if(active)setQr('');});return ()=>{active=false;};},[ticket.id]);
  return <article className="ticket-pass" aria-label={`بلیت ردیف ${item?.row} صندلی ${item?.number}`}>
    <div className="ticket-pass-body"><div className="ticket-pass-brand"><span><Ticket size={17}/>لیندو تیکت</span><span>{order.gateway_mode==='sandbox'?'بلیت آزمایشی':'بلیت ورود'}</span></div>
      <h5 className="ticket-pass-title">{item?.event_title}</h5>
      <div className="ticket-pass-meta">{item?.salon_name&&<p><MapPin size={14}/>{item.salon_name}</p>}{item?.starts_at&&<p><CalendarDays size={14}/>{date(item.starts_at)}</p>}</div>
      <div className="ticket-pass-seats"><div><span>جایگاه</span><strong className="ticket-pass-part">{item?.part_name}</strong></div><div><span>ردیف</span><strong>{toPersianDigits(item?.row||0)}</strong></div><div><span>صندلی</span><strong>{toPersianDigits(item?.number||0)}</strong></div></div>
      <div className="ticket-pass-owner"><span>دارنده بلیت</span><strong>{order.customer_name||'خریدار سفارش'}</strong></div>
    </div>
    <div className="ticket-pass-stub"><div className="ticket-pass-stub-label"><CheckCircle2 size={15}/>پذیرش یک‌باره</div>{qr?<img src={qr} alt="رمزینه مستقل بلیت" width={140} height={140}/>:<div className="ticket-qr-placeholder">در حال آماده‌سازی رمزینه</div>}<p>در ورودی نشان دهید</p><details><summary>مشاهده کد کامل</summary><code dir="ltr" className="block text-[10px] break-all select-all mt-2">GISHOW:TICKET:{ticket.id}</code></details></div>
  </article>;
}
export function MyOrders(){
  const [orders,setOrders]=useState<Order[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [filter,setFilter]=useState<'all'|'paid'|'pending'>('all');
  const [reservations,setReservations]=useState<Reservation[]>([]);
  const [paymentStatus,setPaymentStatus]=useState<{configured:boolean;mode:string|null}|null>(null);
  async function load(){setBusy(true);setError('');try{const [o,r,p]=await Promise.all([salesApi.orders(),salesApi.reservations(),salesApi.paymentStatus()]);setOrders(o);setReservations(r);setPaymentStatus(p);}catch(e){setOrders([]);setReservations([]);setError((e as Error).message);}finally{setBusy(false);}}
  useEffect(()=>{void load();},[]);
  async function work(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();await load();}catch(e){setError((e as Error).message);setBusy(false);}}
  async function pay(id:string){setBusy(true);setError('');try{const result=await salesApi.payment(id);window.location.assign(result.payment_url);}catch(e){setError((e as Error).message);setBusy(false);}}
  return <section className="space-y-5"><header className="orders-hero"><div className="orders-hero-content"><span className="orders-eyebrow">همراه شما تا درِ سالن</span><h3>بلیت‌های من</h3><p>جای شما، زمان اجرا و بلیت ورود؛ همه در یک جا.</p><div className="orders-hero-stats"><span><strong>{toPersianDigits(orders.reduce((n,o)=>n+o.tickets.length,0))}</strong>بلیت صادرشده</span><span><strong>{toPersianDigits(orders.filter(o=>['pending','payment_pending'].includes(o.status)).length)}</strong>سفارش در انتظار</span></div></div><Ticket className="orders-hero-symbol" aria-hidden="true" strokeWidth={1}/></header>
    <div className="flex flex-wrap justify-between items-center gap-3"><nav className="orders-filter" aria-label="فیلتر سفارش‌ها">{([['all','همه سفارش‌ها'],['paid','بلیت‌های صادرشده'],['pending','در انتظار پرداخت']] as const).map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</nav><button className="site-secondary" disabled={busy} onClick={()=>void load()} aria-label="دریافت دوباره سفارش‌ها"><RefreshCw size={16}/>به‌روزرسانی</button></div>
    {error&&<p role="alert" className="site-error">{error}</p>}{busy&&<p role="status" className="site-muted">در حال دریافت…</p>}
    {paymentStatus?.mode==='sandbox'&&<p className="site-notice">درگاه در حالت آزمایشی است؛ وجه واقعی دریافت نمی‌شود.</p>}
    {paymentStatus&&!paymentStatus.configured&&<p className="site-notice">درگاه هنوز تنظیم نشده است؛ پرداخت فعال نیست.</p>}
    {!busy&&!error&&!orders.length&&<div className="site-inset p-8 text-center"><Ticket className="mx-auto mb-3 site-muted" size={32}/><p>هنوز سفارشی ثبت نشده است.</p><p className="site-muted text-sm mt-2">برنامه دلخواه را انتخاب و صندلی‌های خود را رزرو کنید.</p></div>}
    {reservations.filter(r=>!orders.some(o=>o.reservation_id===r.id)).map(r=><article key={r.id} className="site-inset p-4 space-y-3"><p>رزرو فعال؛ تعداد صندلی {toPersianDigits(r.seat_ids.length)}</p><p className="site-muted text-sm">مهلت رزرو: {date(r.expires_at)}</p><div className="flex flex-wrap gap-2"><button className="site-primary" disabled={busy} onClick={()=>void work(()=>salesApi.createOrder(r.id))}>ثبت سفارش این رزرو</button><button className="site-secondary" disabled={busy} onClick={()=>void work(()=>salesApi.cancel(r.id))}>لغو این رزرو</button></div></article>)}
    {!busy&&!error&&orders.length>0&&!orders.some(o=>filter==='all'||(filter==='paid'?o.status==='paid':['pending','payment_pending'].includes(o.status)))&&<p className="site-inset p-6 text-center site-muted">سفارشی با این وضعیت ندارید.</p>}
    {orders.filter(o=>filter==='all'||(filter==='paid'?o.status==='paid':['pending','payment_pending'].includes(o.status))).map(o=><article key={o.id} className="order-card"><div className="order-card-heading"><div className="order-card-icon"><Ticket size={24}/></div><div className="min-w-0 flex-1"><p className="orders-eyebrow">{toPersianDigits(o.items.length)} صندلی در این سفارش</p><h4 className="font-bold text-lg">{o.items[0]?.event_title}</h4>{o.items[0]?.salon_name&&<p className="site-muted text-sm mt-1">{o.items[0].salon_name}</p>}</div><span className={`order-status ${o.status==='paid'?'order-status-paid':''}`}>{states[o.status]||'نیازمند بررسی'}</span></div><div className="p-4 sm:p-6 space-y-5">
      {o.gateway_mode==='sandbox'&&<p className="site-notice text-sm">سفارش آزمایشی</p>}
      <div className="order-totals"><p>جمع بلیت‌ها<br/><strong>{formatPrice(o.subtotal_irr/10)}</strong></p><p>تخفیف<br/><strong>{formatPrice(o.discount_amount_irr/10)}</strong>{o.discount_code&&<code className="block text-xs" dir="ltr">{o.discount_code}</code>}</p><p>مبلغ سفارش<br/><strong className="text-lg">{formatPrice(o.amount_irr/10)}</strong></p></div>
      <details className="text-sm"><summary className="cursor-pointer site-muted">شناسه و اطلاعات پرداخت</summary><p className="mt-2">شماره سفارش</p><code dir="ltr" className="block text-xs break-all">{o.id}</code><p className="mt-2">پایان مهلت: {date(o.expires_at)}</p>{o.ref_id&&<p>شناسه پرداخت: <bdi>{toPersianDigits(o.ref_id)}</bdi></p>}</details>
      {['pending','payment_pending'].includes(o.status)&&<button className="site-primary" disabled={busy||!paymentStatus?.configured||Date.parse(o.expires_at)<=Date.now()} onClick={()=>void pay(o.id)}>ادامه پرداخت با زرین‌پال</button>}
      {o.status==='paid'&&<><div className="flex flex-wrap gap-2"><a className="site-primary inline-flex items-center gap-2" href={`/api/sales/orders/${o.id}/receipt`} download><Download size={16}/>دریافت بلیت‌ها و رسید</a><a className="site-secondary inline-flex items-center gap-2" href={`/api/sales/orders/${o.id}/receipt?download=false`} target="_blank" rel="noopener"><ExternalLink size={16}/>نسخه چاپی بلیت</a></div><p className="site-muted text-xs">نسخه چاپی را می‌توانید از مرورگر به صورت پی‌دی‌اف ذخیره کنید.</p></>}
      {o.tickets.length>0&&<div className="flex items-center gap-2 text-sm font-bold"><ArrowUpLeft size={17} className="text-amber-500"/>بلیت ورود هر صندلی</div>}{o.tickets.map(t=><SeatTicket key={t.id} order={o} ticket={t}/>)}</div></article>)}
  </section>;
}
