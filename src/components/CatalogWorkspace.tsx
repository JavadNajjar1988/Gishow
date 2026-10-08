import {PosterUpload} from './PosterUpload';
import {PersianDateTimeField} from './PersianDateTimeField';
import React, {useEffect, useState} from 'react';
import {useAuth} from '../auth/AuthContext';
import {hasPermission} from '../auth/api';
import {barnameApi, salonApi, sansApi, serverId, moneyIRR} from '../services/apiServices';
import {EventItem, Salon, EventCategory} from '../types';
import {SalonPlanBuilderModal} from './SalonPlanBuilderModal';
import {SecureWorkspace} from './SecureWorkspace';
import {formatPrice, toPersianDigits} from '../utils/formatters';

export function CatalogWorkspace({theme,mode,onBack}: {theme:'light'|'dark';mode:'admin'|'producer';onBack:()=>void}) {
  const {user} = useAuth();
  const [events,setEvents] = useState<EventItem[]>([]);
  const [salons,setSalons] = useState<Salon[]>([]);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [salonEditor,setSalonEditor] = useState<Salon | null | undefined>(undefined);
  const [eventEditor,setEventEditor] = useState<EventItem | null | undefined>(undefined);
  const [turnEvent,setTurnEvent] = useState<EventItem | null>(null);
  const [tab,setTab] = useState<'catalog'|'accounts'>('catalog');
  const canSalons = hasPermission(user,'salons.manage');
  const globalManage = user?.global_permissions.includes('events.manage') ?? false;
  const canEdit = (e:EventItem) => globalManage || !!user?.event_permissions[e.id]?.includes('events.manage');
  async function load() {
    setLoading(true); setError('');
    try {
      const values = await Promise.all([
        hasPermission(user,'events.read') ? barnameApi.getManaged() : Promise.resolve([]),
        canSalons ? salonApi.getSalons() : hasPermission(user,'events.manage') ? salonApi.getVenueOptions() : Promise.resolve([]),
      ]);
      setEvents(values[0]); setSalons(values[1]);
    } catch(e) {setEvents([]);setSalons([]);setError((e as Error).message);}
    finally {setLoading(false);}
  }
  useEffect(()=>{setEvents([]);setSalons([]);void load();},[user]);
  async function work(fn:()=>Promise<unknown>) {
    if (busy) return;
    setBusy(true);setError('');setMessage('');
    try {await fn();setMessage('تغییر در سرور ثبت شد.');await load();}
    catch(e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  const panel = 'border border-slate-300 rounded-2xl p-4 bg-white text-slate-900';
  const button = 'border rounded-xl px-4 py-2 disabled:opacity-50';
  return <section dir="rtl" className="max-w-6xl mx-auto p-4 sm:p-8 space-y-5">
    <div className="flex flex-wrap gap-3 justify-between"><h1 className="text-2xl font-bold">{mode==='admin'?'مدیریت سالن و برنامه':'برنامه‌های مجاز شما'}</h1><button className={button} onClick={onBack}>بازگشت به سایت</button></div>
    <nav className="flex flex-wrap gap-3"><button className={button} onClick={()=>setTab('catalog')}>سالن، برنامه و سانس</button><button className={button} onClick={()=>setTab('accounts')}>{mode==='admin'?'حساب‌ها و دسترسی':'گزارش فروش مجاز'}</button></nav>
    {tab==='accounts' ? <SecureWorkspace mode={mode} onBack={onBack}/> : <>
      {error && <p role="alert" className="text-rose-700 bg-rose-50 p-4 rounded-xl">{error}</p>}
      {message && <p role="status" className="text-emerald-700">{message}</p>}
      <button className={button} disabled={loading||busy} onClick={()=>void load()}>دریافت دوباره</button>
      {loading && <p role="status">در حال دریافت اطلاعات…</p>}
      {canSalons && <div className={panel}><div className="flex justify-between gap-3"><h2 className="font-bold">سالن‌ها</h2><button className={button} onClick={()=>setSalonEditor(null)}>سالن تازه</button></div>
        {!loading && !salons.length && <p className="py-4">سالنی ثبت نشده است.</p>}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">{salons.map(s=><article className="border rounded-xl p-4 space-y-3" key={s.id}><h3>{s.name}</h3><p>{s.city}؛ ظرفیت {toPersianDigits(s.capacity)} نفر</p>
          {s.moneyUnit==='IRR' ? <button className={button} onClick={()=>setSalonEditor(s)}>ویرایش مشخصات و پلان</button> : <p>واحد مبلغ این سالن قدیمی مشخص نیست؛ تبدیل آن نیازمند بررسی داده‌های قبلی است.</p>}
          <button className={`${button} text-rose-700`} disabled={busy} onClick={()=>{if(window.confirm('سالن حذف شود؟')) void work(()=>salonApi.deleteSalon(serverId(s.id)));}}>حذف سالن</button></article>)}</div>
      </div>}
      <div className={panel}><div className="flex justify-between gap-3"><h2 className="font-bold">برنامه‌ها</h2>{globalManage && <button className={button} disabled={!salons.some(s=>s.moneyUnit==='IRR')} onClick={()=>setEventEditor(null)}>برنامه تازه</button>}</div>
        {!loading && !events.length && <p className="py-4">برنامه‌ای برای نمایش وجود ندارد.</p>}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">{events.map(e=><article key={e.id} className="border rounded-xl p-4 space-y-3"><h3 className="font-bold">{e.title}</h3><p>{e.isDraft?'پیش‌نویس':e.isActive?'منتشرشده':'بایگانی یا قدیمی'}</p>
          <ul className="space-y-2">{e.runTurns.map(t=><li key={t.id}>{t.date}، ساعت {t.time}؛ ظرفیت {toPersianDigits(t.totalSeatsCount)}، آزاد {toPersianDigits(t.availableSeatsCount)}؛ شناسه سالن <bdi>{t.salonId}</bdi></li>)}</ul>
          {e.moneyUnit!=='IRR' && <p>این برنامه قدیمی است؛ تبدیل تاریخ و مبلغ آن نیازمند بررسی داده‌هاست.</p>}
          {canEdit(e) && e.moneyUnit==='IRR' && salons.some(s=>s.moneyUnit==='IRR') && <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>setEventEditor(e)}>ویرایش برنامه</button><button className={button} onClick={()=>setTurnEvent(e)}>افزودن سانس</button><button className={`${button} text-rose-700`} disabled={busy} onClick={()=>{if(window.confirm('برنامه حذف شود؟')) void work(()=>barnameApi.deleteBarname(serverId(e.id)));}}>حذف برنامه</button></div>}
        </article>)}</div>
      </div>
      <p className="text-sm">اطلاع‌رسانی، پرداخت، تسویه و صدور بلیت مهمان هنوز در این بخش فعال نشده‌اند.</p>
      {salonEditor!==undefined && <SalonPlanBuilderModal theme={theme} initialSalon={salonEditor} onClose={()=>setSalonEditor(undefined)} onSaveSalon={()=>void load()}/>}
      {eventEditor!==undefined && <EventForm onPosterChanged={()=>void load()} key={eventEditor?.id || 'new'} initial={eventEditor} salons={salons.filter(s=>s.moneyUnit==='IRR')} busy={busy} onClose={()=>setEventEditor(undefined)} onSave={p=>void work(async()=>{const saved=eventEditor?await barnameApi.updateBarname(serverId(eventEditor.id),p):await barnameApi.createBarname(p);setEventEditor(saved);})}/>}
      {turnEvent && <TurnForm key={turnEvent.id} event={turnEvent} salons={salons.filter(s=>s.moneyUnit==='IRR')} busy={busy} onClose={()=>setTurnEvent(null)} onSave={p=>void work(async()=>{await sansApi.createSans(p);setTurnEvent(null);})}/>}
    </>}
  </section>;
}
const input = 'border border-slate-300 rounded-xl p-3 w-full bg-white text-slate-900';
function EventForm({initial,salons,busy,onClose,onSave,onPosterChanged}: {onPosterChanged:()=>void;initial:EventItem|null;salons:Salon[];busy:boolean;onClose:()=>void;onSave:(p:any)=>void}) {
  const [title,setTitle]=useState(initial?.title || '');
  const [salon,setSalon]=useState(initial?.salonId || salons[0]?.id || '');
  const [category,setCategory]=useState<EventCategory>(initial?.category || 'concert');
  const [description,setDescription]=useState(initial?.description || '');
  const [subTitle,setSubTitle]=useState(initial?.subTitle || '');
  const [duration,setDuration]=useState(initial?.durationMinutes || 90);
  const [rules,setRules]=useState(initial?.rules?.join('\n') || '');
  const [cast,setCast]=useState(initial?.cast.map(c=>`${c.name} | ${c.role}`).join('\n') || '');
  const [notice,setNotice]=useState(initial?.ticketNotice || '');
  const [language,setLanguage]=useState<'fa'|'en'>(initial?.language || 'fa');
  const [draft,setDraft]=useState(initial?.isDraft ?? true);
  const [featured,setFeatured]=useState(initial?.isFeatured ?? false);
  return <form className="border bg-white text-slate-900 rounded-2xl p-4 space-y-4" onSubmit={e=>{e.preventDefault();if(busy)return;onSave({title,salonId:serverId(salon),category,description,subTitle,durationMinutes:duration,
    rules:rules.split('\n').map(s=>s.trim()).filter(Boolean),cast:cast.split('\n').filter(s=>s.trim()).map(s=>{const [name,role]=s.split('|');return {name:name.trim(),role:role?.trim() || ''};}),
    ticketNotice:notice,language,isDraft:draft,isFeatured:featured});}}>
    <PosterUpload event={initial} onChanged={onPosterChanged}/><h2 className="font-bold">{initial?'ویرایش برنامه':'برنامه تازه'}</h2><fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4">
    <label>عنوان<input className={input} required maxLength={250} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>زیرعنوان<input className={input} maxLength={300} value={subTitle} onChange={e=>setSubTitle(e.target.value)}/></label>
    <label>سالن پیش‌فرض<select className={input} required value={salon} onChange={e=>setSalon(e.target.value)}>{salons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>دسته‌بندی<select className={input} value={category} onChange={e=>setCategory(e.target.value as EventCategory)}>{[['concert','کنسرت'],['theater','تئاتر'],['comedy','کمدی'],['cinema','سینما'],['conference','همایش']].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    <label>مدت اجرا، دقیقه<input className={input} type="number" min={1} max={1440} required value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>
    <label>زبان<select className={input} value={language} onChange={e=>setLanguage(e.target.value as 'fa'|'en')}><option value="fa">فارسی</option><option value="en">انگلیسی</option></select></label>
    <label>شرح<textarea className={input} maxLength={20000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <label>قوانین، هر مورد در یک سطر<textarea className={input} value={rules} onChange={e=>setRules(e.target.value)}/></label>
    <label>عوامل، نام و نقش با جداکننده عمودی<textarea className={input} value={cast} onChange={e=>setCast(e.target.value)}/></label>
    <label>توضیح بلیت<textarea className={input} maxLength={2000} value={notice} onChange={e=>setNotice(e.target.value)}/></label>
    <label><input type="checkbox" checked={draft} onChange={e=>setDraft(e.target.checked)}/> پیش‌نویس</label><label><input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)}/> انتخاب ویژه</label>
    <button className="bg-slate-900 text-white p-3 rounded-xl">ذخیره در سرور</button><button type="button" onClick={onClose}>بستن فرم</button></fieldset>
  </form>;
}
function TurnForm({event,salons,busy,onClose,onSave}: {event:EventItem;salons:Salon[];busy:boolean;onClose:()=>void;onSave:(p:any)=>void}) {
  const [salonId,setSalonId]=useState(event.salonId);
  const [start,setStart]=useState('');
  const [saleStart,setSaleStart]=useState('');
  const [saleEnd,setSaleEnd]=useState('');
  const [description,setDescription]=useState('');
  const [prices,setPrices]=useState<Record<string,number>>({});
  const [error,setError]=useState('');
  const salon=salons.find(s=>s.id===salonId);
  const date = (s:string) => s || undefined;
  return <form className="border bg-white text-slate-900 rounded-2xl p-4 space-y-4" onSubmit={e=>{e.preventDefault();if(busy)return;setError('');try{
    if(!salon)throw new Error('سالن را انتخاب کنید.');
    if(saleStart && saleEnd && Date.parse(saleEnd)<Date.parse(saleStart))throw new Error('پایان فروش پیش از شروع فروش است.');
    onSave({barnameId:serverId(event.id),salonId:serverId(salonId),startsAt:date(start),salesStartAt:date(saleStart),salesEndAt:date(saleEnd),description,
      partPrices:salon.parts.map(p=>({part_id:serverId(p.id),amount_irr:moneyIRR(prices[p.id] ?? p.price)}))});
  }catch(e){setError((e as Error).message);}}}>
    <h2 className="font-bold">سانس تازه برای {event.title}</h2>{error&&<p role="alert" className="text-rose-700">{error}</p>}
    <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4"><label>سالن مستقل سانس<select className={input} required value={salonId} onChange={e=>{setSalonId(e.target.value);setPrices({});}}><option value="">انتخاب سالن</option>{salons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <PersianDateTimeField label="زمان اجرا" required onChange={setStart}/>
    <PersianDateTimeField label="شروع فروش" onChange={setSaleStart}/>
    <PersianDateTimeField label="پایان فروش" onChange={setSaleEnd}/>
    <label>توضیح سانس<textarea className={input} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    {salon?.parts.map(p=><label key={p.id}>قیمت {p.name}، تومان<input className={input} type="number" min={0} step={1} required value={prices[p.id] ?? p.price} onChange={e=>setPrices({...prices,[p.id]:Number(e.target.value)})}/></label>)}
    <button className="bg-slate-900 text-white p-3 rounded-xl">ذخیره سانس در سرور</button><button type="button" onClick={onClose}>بستن فرم</button></fieldset>
  </form>;
}
