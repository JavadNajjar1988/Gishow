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
  async function createOrder(){if(!reservation)return;setBusy(true);setError('');try{setOrder(await salesApi.createOrder(reservation.id));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function cancel(){if(!reservation)return;setBusy(true);setError('');try{await salesApi.cancel(reservation.id);setReservation(null);setOrder(null);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function pay(){if(!order)return;setBusy(true);setError('');try{const result=await salesApi.payment(order.id);window.location.assign(result.payment_url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <div className="fixed inset-0 z-50 bg-black/60 p-3 flex items-center justify-center" dir="rtl">
    <div ref={ref} role="dialog" aria-modal="true" aria-label="پلان و موجودی سانس" className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-white text-slate-900 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between gap-3"><h2 className="font-bold">{event.title}؛ {salon.name}</h2><button disabled={busy} onClick={onClose}>بستن</button></div>
      <p>{salon.address}؛ {runTurn.date}، ساعت {runTurn.time}</p>
      <p>{user?'تا ده صندلی انتخاب کنید. مهلت رزرو ده دقیقه است و انتخاب صندلی به‌تنهایی آن را رزرو نمی‌کند.':'برای رزرو صندلی، ابتدا از بخش ورود و ثبت‌نام وارد حساب شوید.'}</p>
      {user&&paymentStatus&&!paymentStatus.configured&&<p>درگاه هنوز تنظیم نشده است. رزرو و ثبت سفارش ممکن است، اما پرداخت فعال نیست.</p>}
      {paymentStatus?.mode==='sandbox'&&<p className="text-amber-800">درگاه در حالت آزمایشی است؛ وجه واقعی دریافت نمی‌شود.</p>}
      <button disabled={loading||busy} onClick={()=>void load()}>دریافت دوباره موجودی</button>
      {loading&&<p role="status">در حال دریافت صندلی‌ها…</p>}{error&&<p role="alert" className="text-rose-700">{error}</p>}
      {reservation&&<section className="border border-amber-400 bg-amber-50 rounded-xl p-3 space-y-3"><p role="status">{remaining>0?`رزرو شما ثبت شد؛ ${toPersianDigits(Math.floor(remaining/60))} دقیقه و ${toPersianDigits(remaining%60)} ثانیه باقی مانده است.`:'مهلت رزرو پایان یافت؛ موجودی را دوباره دریافت و صندلی‌ها را دوباره انتخاب کنید.'}</p>
        {!order&&remaining>0&&<button className="border rounded-lg p-2 m-1" disabled={busy} onClick={()=>void createOrder()}>ثبت سفارش با مبلغ سرور</button>}
        {order&&<><p>مبلغ ثبت‌شده سفارش: {formatPrice(order.amount_irr/10)}</p><p>سفارش در حساب شما باقی می‌ماند. بلیت پس از تأیید درگاه صادر می‌شود.</p><p>شماره سفارش</p><code dir="ltr" className="block break-all text-xs">{order.id}</code><button className="border rounded-lg p-2 m-1 disabled:opacity-50" disabled={busy||remaining===0||!paymentStatus?.configured} onClick={()=>void pay()}>پرداخت با زرین‌پال</button></>}
        <button className="border rounded-lg p-2 m-1" disabled={busy} onClick={()=>void cancel()}>لغو رزرو و انتخاب دوباره</button>
      </section>}
      {!loading&&!error&&!seats.length&&<p>برای این سانس صندلی ثبت نشده است.</p>}
      {salon.parts.map(part=><section key={part.id} className="border rounded-xl p-3 space-y-3"><h3 className="font-bold">{part.name}</h3><div className="flex flex-wrap gap-2">{seats.filter(s=>s.partId===part.id).sort((a,b)=>a.row-b.row||a.number-b.number).map(s=><button type="button" key={s.id} aria-pressed={selected.includes(s.id)} disabled={!user||busy||loading||!!reservation||s.status!=='available'||(!selected.includes(s.id)&&selected.length>=10)} onClick={()=>setSelected(ids=>ids.includes(s.id)?ids.filter(id=>id!==s.id):[...ids,s.id])} className={`rounded-lg border p-2 text-xs disabled:cursor-default ${selected.includes(s.id)?'bg-indigo-100 border-indigo-600':s.status==='available'?'bg-emerald-50 border-emerald-300':'bg-slate-100 border-slate-300'}`}><span className="block">ردیف {toPersianDigits(s.row)}؛ صندلی {toPersianDigits(s.number)}</span><span className="block">{formatPrice(s.price)}</span><span className="block">{selected.includes(s.id)?'انتخاب‌شده':s.status==='available'?'آزاد':s.status==='sold'?'فروخته‌شده':reservation?.seat_ids.includes(serverId(s.id))&&remaining>0?'رزرو شما':'غیرآزاد'}</span></button>)}</div></section>)}
      {user&&!reservation&&<button className="rounded-xl p-3 bg-slate-900 text-white disabled:opacity-50" disabled={busy||loading||!selected.length} onClick={()=>void reserve()}>رزرو صندلی‌های انتخاب‌شده</button>}
    </div>
  </div>;
}
