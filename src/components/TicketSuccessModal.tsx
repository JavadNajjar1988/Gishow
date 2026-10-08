import React,{useEffect,useRef,useState} from 'react';
import {Ticket,Printer,X,ShieldCheck,CalendarDays,MapPin} from 'lucide-react';
import QRCode from 'qrcode';
import {FactorItem} from '../types';
import {formatPrice,toPersianDigits} from '../utils/formatters';
import {useDialogFocus} from '../hooks/useDialogFocus';
interface TicketSuccessModalProps{theme:'light'|'dark';factor:FactorItem;isPreview?:boolean;onClose:()=>void;onGoToChecker:(ticketCode:string)=>void}
export const TicketSuccessModal:React.FC<TicketSuccessModalProps>=({theme,factor,isPreview=false,onClose,onGoToChecker})=>{
 const [qr,setQr]=useState('');const ref=useRef<HTMLDivElement>(null);useDialogFocus(ref,onClose);
 useEffect(()=>{let active=true;void QRCode.toDataURL(factor.qrPayload,{width:180,margin:2}).then(value=>{if(active)setQr(value);}).catch(()=>{if(active)setQr('');});return ()=>{active=false;};},[factor.qrPayload]);
 return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-6" dir="rtl" data-site-theme={theme}>
  <div ref={ref} role="dialog" aria-modal="true" aria-label="نمایش بلیت" className="site-surface max-w-4xl mx-auto my-6 p-4 sm:p-7 space-y-5">
   <div className="flex items-center justify-between gap-3 no-print"><div><p className="orders-eyebrow">لیندو تیکت</p><h2 className="text-xl font-black mt-1">{isPreview?'پیش‌نمایش بلیت':'بلیت شما'}</h2></div><button className="site-secondary" onClick={onClose} aria-label="بستن نمایش بلیت"><X size={18}/></button></div>
   {isPreview&&<p className="site-notice">این نمونه برای بررسی طراحی است؛ خرید و مجوز ورود واقعی محسوب نمی‌شود.</p>}
   <article className="ticket-pass"><div className="ticket-pass-body"><div className="ticket-pass-brand"><span><Ticket size={17}/>لیندو تیکت</span><span>{isPreview?'نمونه طراحی':'بلیت ورود'}</span></div><h3 className="ticket-pass-title">{factor.event.title}</h3><div className="ticket-pass-meta"><p><MapPin size={14}/>{factor.salon.name}</p><p><CalendarDays size={14}/>{factor.runTurn.weekday} {factor.runTurn.date}، {factor.runTurn.time}</p></div><div className="ticket-preview-seats">{factor.seats.map(seat=><div key={seat.id}><span>{seat.partName}</span><strong>ردیف {toPersianDigits(seat.row)}</strong><b>صندلی {toPersianDigits(seat.number)}</b></div>)}</div><div className="ticket-pass-owner"><span>دارنده بلیت</span><strong>{factor.customerName}</strong></div></div>
   <div className="ticket-pass-stub"><div className="ticket-pass-stub-label">{isPreview?'رمزینه نمونه':'رمزینه بلیت'}</div>{qr&&<img src={qr} alt="رمزینه بلیت" width={140} height={140}/>}<p>{isPreview?'ویژه پیش‌نمایش طراحی':'در ورودی نشان دهید'}</p><details><summary>شماره بلیت</summary><code dir="ltr" className="block break-all mt-2">{factor.factorNumber}</code></details></div></article>
   <div className="order-totals"><p>جمع بلیت‌ها<br/><strong>{formatPrice(factor.subtotal)}</strong></p><p>تخفیف<br/><strong>{formatPrice(factor.discountAmount)}</strong></p><p>{isPreview?'مبلغ نمونه':'مبلغ پرداختی'}<br/><strong>{formatPrice(factor.finalAmount)}</strong></p></div>
   <div className="flex flex-wrap gap-3 no-print"><button className="site-primary" onClick={()=>window.print()}><Printer size={16}/>چاپ بلیت</button><button className="site-secondary" onClick={()=>onGoToChecker(factor.factorNumber)}><ShieldCheck size={16}/>بررسی در کنترل ورود</button></div>
  </div>
 </div>;
};
