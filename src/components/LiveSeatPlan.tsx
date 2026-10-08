import React, {useEffect,useRef,useState} from 'react';
import {EventItem,RunTurn,Salon,Seat} from '../types';
import {sansApi,serverId} from '../services/apiServices';
import {formatPrice,toPersianDigits} from '../utils/formatters';
import {useDialogFocus} from '../hooks/useDialogFocus';
export function LiveSeatPlan({event,runTurn,salon,onClose}: {event:EventItem;runTurn:RunTurn;salon:Salon;onClose:()=>void}) {
  const [seats,setSeats]=useState<Seat[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const ref=useRef<HTMLDivElement>(null);
  useDialogFocus(ref,onClose);
  async function load(){setLoading(true);setError('');try{setSeats(await sansApi.getSeatPlan(serverId(runTurn.id)));}catch(e){setSeats([]);setError((e as Error).message);}finally{setLoading(false);}}
  useEffect(()=>{void load();},[runTurn.id]);
  return <div className="fixed inset-0 z-50 bg-black/60 p-3 flex items-center justify-center" dir="rtl">
    <div ref={ref} role="dialog" aria-modal="true" aria-label="پلان و موجودی سانس" className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-white text-slate-900 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between gap-3"><h2 className="font-bold">{event.title}؛ {salon.name}</h2><button onClick={onClose}>بستن</button></div>
      <p>{salon.address}؛ {runTurn.date}، ساعت {runTurn.time}</p>
      <p>این بخش موجودی را نمایش می‌دهد. رزرو و پرداخت هنوز فعال نشده‌اند.</p>
      <button disabled={loading} onClick={()=>void load()}>دریافت دوباره موجودی</button>
      {loading && <p role="status">در حال دریافت صندلی‌ها…</p>}{error&&<p role="alert" className="text-rose-700">{error}</p>}
      {!loading&&!error&&!seats.length&&<p>برای این سانس صندلی ثبت نشده است.</p>}
      {salon.parts.map(part=><section key={part.id} className="border rounded-xl p-3 space-y-3"><h3 className="font-bold">{part.name}</h3><div className="flex flex-wrap gap-2">{seats.filter(s=>s.partId===part.id).sort((a,b)=>a.row-b.row || a.number-b.number).map(s=><div key={s.id} className={`rounded-lg border p-2 text-xs ${s.status==='available'?'bg-emerald-50 border-emerald-300':'bg-slate-100 border-slate-300'}`}><p>ردیف {toPersianDigits(s.row)}؛ صندلی {toPersianDigits(s.number)}</p><p>{formatPrice(s.price)}</p><p>{s.status==='available'?'آزاد':s.status==='sold'?'فروخته‌شده':'غیرآزاد'}</p></div>)}</div></section>)}
    </div>
  </div>;
}
