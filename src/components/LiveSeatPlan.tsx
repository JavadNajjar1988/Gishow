import {SeatPlanExplorer} from './SeatPlanExplorer';
import {MapPin,CalendarDays,Ticket,X,Trash2,Clock3} from 'lucide-react';
import React,{useEffect,useRef,useState} from 'react';
import {EventItem,RunTurn,Salon,Seat} from '../types';
import {sansApi,serverId} from '../services/apiServices';
import {Reservation,Order,salesApi} from '../services/sales';
import {useAuth} from '../auth/AuthContext';
import {formatPrice,toPersianDigits} from '../utils/formatters';
import {useDialogFocus} from '../hooks/useDialogFocus';
export function LiveSeatPlan({event,runTurn,salon,onClose}:{event:EventItem;runTurn:RunTurn;salon:Salon;onClose:()=>void}) {
  const {user}=useAuth();
  const [seats,setSeats]=useState<Seat[]>([]),[selected,setSelected]=useState<string[]>([]);
  const [discount,setDiscount]=useState('');
  const [error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [paymentStatus,setPaymentStatus]=useState<{configured:boolean;mode:string|null}|null>(null);
  const [reservation,setReservation]=useState<Reservation|null>(null),[order,setOrder]=useState<Order|null>(null),[remaining,setRemaining]=useState(0);
  const ref=useRef<HTMLDivElement>(null);
  useDialogFocus(ref,onClose);
  async function load(){setLoading(true);setError('');try{const fresh=await sansApi.getSeatPlan(serverId(runTurn.id));setSeats(fresh);setSelected(ids=>ids.filter(id=>fresh.some(s=>s.id===id&&s.status==='available')));}catch(e){setSeats([]);setError((e as Error).message);}finally{setLoading(false);}}
  useEffect(()=>{void load();},[runTurn.id]);
  useEffect(()=>{if(user)void salesApi.paymentStatus().then(setPaymentStatus).catch(()=>setPaymentStatus(null));},[user]);
  useEffect(()=>{if(!reservation)return;const tick=()=>setRemaining(Math.max(0,Math.ceil((Date.parse(reservation.expires_at)-Date.now())/1000)));tick();const interval=setInterval(tick,1000);return ()=>clearInterval(interval);},[reservation]);
  async function reserve(){setBusy(true);setError('');try{const saved=await salesApi.reserve(serverId(runTurn.id),selected.map(serverId));setReservation(saved);setSelected([]);setSeats(await sansApi.getSeatPlan(serverId(runTurn.id)));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function createOrder(){if(!reservation)return;setBusy(true);setError('');try{setOrder(await salesApi.createOrder(reservation.id,discount.trim().toUpperCase()));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function cancel(){if(!reservation)return;setBusy(true);setError('');try{await salesApi.cancel(reservation.id);setReservation(null);setOrder(null);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function pay(){if(!order)return;setBusy(true);setError('');try{const result=await salesApi.payment(order.id);window.location.assign(result.payment_url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const chosen=seats.filter(s=>reservation?reservation.seat_ids.includes(serverId(s.id)):selected.includes(s.id));
  return <div className="seat-booking-overlay" dir="rtl"><div ref={ref} role="dialog" aria-modal="true" aria-label="پلان و موجودی سانس" className="seat-booking-dialog site-surface">
    <header className="seat-booking-header"><div className="seat-booking-brand"><Ticket size={24}/><div><span>انتخاب صندلی</span><h2>{event.title}</h2></div></div><button disabled={busy} onClick={onClose} aria-label="بستن پلان" className="site-secondary"><X size={18}/></button></header>
    <div className="seat-booking-info"><span><MapPin size={15}/>{salon.name}</span><span><CalendarDays size={15}/>{runTurn.date}، ساعت {runTurn.time}</span></div>
    <div className="seat-booking-layout"><div className="seat-booking-map"><nav className="booking-steps" aria-label="مراحل خرید"><span data-current={!reservation}>۱<span>انتخاب صندلی</span></span><span data-current={!!reservation&&!order}>۲<span>رزرو و تخفیف</span></span><span data-current={!!order}>۳<span>پرداخت و بلیت</span></span></nav>
      <div className="flex flex-wrap justify-between gap-3 items-center mt-4 mb-3"><p className="site-muted text-xs">{salon.address}</p><button className="site-secondary" disabled={loading||busy} onClick={()=>void load()}>دریافت دوباره موجودی</button></div>
      {loading?<div className="venue-loading" role="status">در حال دریافت پلان و موجودی سانس…</div>:<SeatPlanExplorer salon={salon} seats={seats} selected={selected} owned={reservation&&remaining>0?reservation.seat_ids.map(String):[]} disabled={busy||!!reservation} canSelect={!!user} onToggle={id=>setSelected(ids=>ids.includes(id)?ids.filter(s=>s!==id):[...ids,id])}/>}
    </div><aside className="seat-booking-summary"><div className="seat-summary-title"><Ticket size={18}/><h3>بلیت‌های انتخابی</h3><span>{toPersianDigits(chosen.length)}</span></div>
      {error&&<p role="alert" className="site-error">{error}</p>}
      {!chosen.length?<div className="seat-summary-empty"><MousePointerHint/><p>جای شما هنوز انتخاب نشده</p><span>جایگاه را باز کنید و روی صندلی دلخواه بزنید.</span></div>:<div className="seat-summary-list">{chosen.map(s=><div key={s.id} className="seat-summary-item"><div><span>{s.partName}</span><strong>ردیف {toPersianDigits(s.row)} · صندلی {toPersianDigits(s.number)}</strong><small>{formatPrice(s.price)}</small></div>{!reservation&&<button aria-label={`حذف صندلی ${s.number} ردیف ${s.row}`} disabled={busy} onClick={()=>setSelected(ids=>ids.filter(id=>id!==s.id))}><Trash2 size={15}/></button>}</div>)}</div>}
      {!reservation&&<><div className="seat-summary-total"><span>جمع انتخاب شما</span><strong>{formatPrice(chosen.reduce((sum,s)=>sum+s.price,0))}</strong></div><p className="site-muted text-xs">حداکثر ده صندلی؛ انتخاب روی نقشه تا ثبت رزرو قطعی نمی‌شود.</p>{user?<button className="site-primary w-full" disabled={busy||loading||!selected.length} onClick={()=>void reserve()}>رزرو صندلی‌های انتخاب‌شده</button>:<p className="site-notice">برای رزرو، ابتدا از بخش ورود و ثبت‌نام وارد حساب شوید.</p>}</>}
      {reservation&&<><div className="seat-hold-timer" role="status"><Clock3 size={17}/>{remaining>0?`${toPersianDigits(Math.floor(remaining/60))}:${toPersianDigits(String(remaining%60).padStart(2,'0'))} تا پایان رزرو`:'مهلت رزرو پایان یافت'}</div>{!order&&remaining>0&&<><label className="block text-sm">کد تخفیف، اختیاری<input className="site-input mt-2 w-full" dir="ltr" maxLength={40} value={discount} onChange={e=>setDiscount(e.target.value)} disabled={busy}/></label><button className="site-primary w-full" disabled={busy} onClick={()=>void createOrder()}>ثبت سفارش و محاسبه تخفیف</button></>}
      {order&&<><div className="seat-order-breakdown"><p>جمع بلیت‌ها<span>{formatPrice(order.subtotal_irr/10)}</span></p>{order.discount_amount_irr>0&&<p>تخفیف<span>{formatPrice(order.discount_amount_irr/10)}</span></p>}</div><div className="seat-summary-total"><span>مبلغ نهایی سفارش</span><strong>{formatPrice(order.amount_irr/10)}</strong></div><button className="site-primary w-full" disabled={busy||remaining===0||!paymentStatus?.configured} onClick={()=>void pay()}>پرداخت با زرین‌پال</button><p className="site-muted text-xs">بلیت پس از تأیید درگاه صادر می‌شود و در حساب شما باقی می‌ماند.</p><details className="text-xs site-muted"><summary>شماره سفارش</summary><code dir="ltr" className="block break-all mt-2">{order.id}</code></details></>}
      <button className="site-secondary w-full" disabled={busy} onClick={()=>void cancel()}>لغو رزرو و انتخاب دوباره</button></>}
      {paymentStatus?.mode==='sandbox'&&<p className="site-notice text-xs">درگاه آزمایشی است؛ وجه واقعی دریافت نمی‌شود.</p>}{user&&paymentStatus&&!paymentStatus.configured&&<p className="site-notice text-xs">درگاه هنوز تنظیم نشده و پرداخت فعال نیست.</p>}
    </aside></div>
  </div></div>;
}
function MousePointerHint(){return <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M12 7v24l7-7 6 10 5-3-6-10 10-1L12 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;}
