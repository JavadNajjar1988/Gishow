import React,{useRef,useState} from 'react';
import {jalaaliMonthLength,toGregorian} from 'jalaali-js';
import {persianDateToISO,todayPersian,latinDigits} from '../utils/persianDate';
import {toPersianDigits} from '../utils/formatters';
const months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
export function PersianDateTimeField({label,required,onChange}:{label:string;required?:boolean;onChange:(value:string)=>void}) {
  const today=todayPersian();
  const [date,setDate]=useState(''),[time,setTime]=useState('18:30'),[open,setOpen]=useState(false),[year,setYear]=useState(today.jy),[month,setMonth]=useState(today.jm),[error,setError]=useState('');
  const ref=useRef<HTMLInputElement>(null);
  function change(d:string,t:string) {
    setDate(d);setTime(t);
    try{const iso=d?persianDateToISO(d,t):'';setError('');ref.current?.setCustomValidity('');onChange(iso);if(d){const [y,m]=latinDigits(d).split(/[/-]/).map(Number);setYear(y);setMonth(m);}}
    catch(e){const message=(e as Error).message;setError(message);ref.current?.setCustomValidity(message);onChange('');}
  }
  const g=toGregorian(year,month,1),offset=(new Date(Date.UTC(g.gy,g.gm-1,g.gd)).getUTCDay()+1)%7;
  return <div className="space-y-2"><label className="block">{label}؛ تاریخ شمسی<input ref={ref} className="site-input w-full" dir="ltr" placeholder="۱۴۰۵/۰۸/۲۴" required={required} value={date} onChange={e=>change(e.target.value,time)}/></label>
    <label className="block">ساعت تهران<input className="site-input w-full" type="time" required={!!date} value={time} onChange={e=>change(date,e.target.value)}/></label>
    <button type="button" aria-expanded={open} className="site-secondary" onClick={()=>setOpen(!open)}>انتخاب از تقویم</button>
    {error&&<p role="alert" className="site-error">{error}</p>}
    {open&&<div className="site-inset p-3 space-y-3"><div className="flex gap-2"><label>ماه<select value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></label><label>سال<select value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:201},(_,i)=>1300+i).map(y=><option key={y} value={y}>{toPersianDigits(y)}</option>)}</select></label></div>
      <div className="grid grid-cols-7 gap-1">{['ش','ی','د','س','چ','پ','ج'].map((d,i)=><span key={i} className="text-center">{d}</span>)}{Array.from({length:offset},(_,i)=><span key={`empty${i}`}/>)}{Array.from({length:jalaaliMonthLength(year,month)},(_,i)=>i+1).map(d=><button key={d} type="button" className="border rounded p-2" aria-label={`${d} ${months[month-1]} ${year}`} onClick={()=>{change(`${year}/${String(month).padStart(2,'0')}/${String(d).padStart(2,'0')}`,time);setOpen(false);}}>{toPersianDigits(d)}</button>)}</div>
      <button type="button" onClick={()=>{change(`${today.jy}/${today.jm}/${today.jd}`,time);setOpen(false);}}>امروز</button>
    </div>}
  </div>;
}
