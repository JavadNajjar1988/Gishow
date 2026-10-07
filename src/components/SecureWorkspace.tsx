import React, {useEffect, useState} from 'react';
import {Account, api, hasPermission} from '../auth/api';
import {useAuth} from '../auth/AuthContext';
interface Role {id:number; code:string; name:string; scope:'global'|'event'; permissions:string[]}
interface Event {id:number; title:string; is_active:boolean}
interface Permission {code:string; name:string; scope:string}
export function SecureWorkspace({mode, onBack}: {mode:'admin'|'producer'|'checker'|'box-office'; onBack:()=>void}) {
  const {user, refresh} = useAuth();
  const [users, setUsers] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [factors, setFactors] = useState<{factor_number:string; event_title:string; customer_name:string; final_amount:number}[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [targetId, setTargetId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [eventId, setEventId] = useState('');
  const [permissionCode, setPermissionCode] = useState('');
  const [allowed, setAllowed] = useState(true);
  const [code, setCode] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleScope, setRoleScope] = useState<'event'|'global'>('event');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<{permission_code:string; allowed:boolean}[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const can = (p:string) => hasPermission(user, p);
  async function load() {
    const jobs: Promise<void>[] = [];
    if (can('events.read')) jobs.push(api<Event[]>('/admin/events').then(setEvents));
    if (mode === 'producer' && can('reports.read')) jobs.push(api<typeof factors>('/admin/factors').then(setFactors));
    if (mode === 'admin' && can('accounts.manage')) {
      jobs.push(api<Account[]>('/admin/users').then(setUsers));
    }
    if (mode === 'admin' && (can('accounts.manage') || can('roles.manage'))) jobs.push(api<Role[]>('/access/roles').then(setRoles));
    if (mode === 'admin' && can('roles.manage')) jobs.push(api<Permission[]>('/access/permissions').then(setPermissions));
    await Promise.all(jobs);
  }
  useEffect(() => {setError(''); setUsers([]); setEvents([]); setFactors([]); void load().catch(e => setError(e.message));}, [mode, user]);
  useEffect(() => {
    setOverrides([]);
    if (targetId) void api<Account & {overrides:typeof overrides}>(`/access/users/${targetId}`).then(data=>setOverrides(data.overrides)).catch(e=>setError(e.message));
  }, [targetId, users]);
  async function work(fn:()=>Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try {await fn(); await load(); await refresh(); setMessage('عملیات ثبت شد.');}
    catch(e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  const input = 'rounded-xl border border-slate-300 bg-white text-slate-900 p-3 max-w-full';
  const button = 'rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50';
  const selectedRole = roles.find(r=>r.id===Number(roleId));
  const target = users.find(u=>u.id===Number(targetId));
  const permissionName = (code:string) => permissions.find(p=>p.code===code)?.name || ({'reports.read':'مشاهده فروش برنامه','events.read':'مشاهده برنامه‌ها','tickets.check':'کنترل ورود','seats.manage':'مدیریت صندلی','accounts.manage':'مدیریت حساب‌ها','roles.manage':'مدیریت نقش‌ها','salons.manage':'مدیریت سالن‌ها','terminals.read':'مشاهده پایانه‌ها'}[code] || 'مجوز اختصاصی');
  return <section dir="rtl" className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{mode==='admin'?'مدیریت حساب‌ها و دسترسی':mode==='checker'?'کنترل ورود':mode==='producer'?'برنامه‌های مجاز شما':'گیشه'}</h1><button onClick={onBack}>بازگشت به سایت</button></div>
    {error && <p role="alert" className="bg-rose-50 text-rose-800 p-4 rounded-xl">{error}</p>}
    {message && <p role="status" className="text-emerald-700">{message}</p>}
    {mode === 'box-office' && <p>صدور واقعی بلیت گیشه در گام فروش پیاده می‌شود.</p>}
    {(mode === 'producer' || mode === 'checker') && <div className="space-y-3"><h2 className="font-bold">برنامه‌های مجاز</h2>{events.length ? events.map(e=><div key={e.id} className="border rounded-xl p-3">{e.title}</div>) : <p>برنامه‌ای برای نمایش وجود ندارد.</p>}</div>}
    {mode === 'producer' && can('reports.read') && <div className="space-y-3"><h2 className="font-bold">فاکتورهای برنامه‌های مجاز</h2>{factors.length ? factors.map(f=><div key={f.factor_number} className="border rounded-xl p-3"><p>{f.event_title}؛ {f.customer_name}</p><bdi className="block">{f.factor_number}</bdi></div>) : <p>فاکتوری ثبت نشده است.</p>}</div>}
    {mode === 'checker' && <form className="space-y-3" onSubmit={e=>{e.preventDefault(); void work(async()=>{const result=await api<{message:string}>('/checker/verify','POST',{code}); setScanMessage(result.message); setCode('');});}}><label className="block">کد کامل بلیت<input className={`${input} block w-full mt-2`} dir="ltr" value={code} onChange={e=>setCode(e.target.value)} required maxLength={500} /></label><button className={button} disabled={busy}>بررسی و ثبت ورود</button>{scanMessage && <p role="status">{scanMessage}</p>}</form>}
    {mode === 'admin' && can('accounts.manage') && <div className="space-y-5 bg-white text-slate-900 border rounded-2xl p-5">
      <label className="block">انتخاب حساب<select aria-label="انتخاب حساب" className={`${input} block w-full mt-2`} value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">حساب را انتخاب کنید</option>{users.map(u=><option value={u.id} key={u.id}>{u.full_name} ـ {u.mobile}</option>)}</select></label>
      {target && <>
        <p>وضعیت حساب: {target.is_active?'فعال':'غیرفعال'}</p>
        <button className={button} disabled={busy} onClick={()=>void work(async()=>{await api(`/access/users/${target.id}`,'PATCH',{is_active:!target.is_active});})}>{target.is_active?'غیرفعال کردن حساب':'فعال کردن حساب'}</button>
        <div className="space-y-2"><h2 className="font-bold">نقش‌های فعلی</h2>{target.roles.map(code=>{const role=roles.find(r=>r.code===code); return <p key={code}>{role?.name || 'نقش اختصاصی'} <button disabled={busy} className="text-rose-700 mr-3" onClick={()=>void work(async()=>{await api(`/access/users/${target.id}/roles/${role?.id}`,'DELETE');})}>حذف نقش</button></p>;})}
          {target.event_roles.map(grant=>{const role=roles.find(r=>r.code===grant.role); return <p key={`${grant.event_id}:${grant.role}`}>{role?.name || 'نقش اختصاصی'}؛ {events.find(e=>e.id===grant.event_id)?.title || 'برنامه'} <button disabled={busy} className="text-rose-700 mr-3" onClick={()=>void work(async()=>{await api(`/access/users/${target.id}/roles/${role?.id}?event_id=${grant.event_id}`,'DELETE');})}>حذف دسترسی برنامه</button></p>;})}
        </div>
        <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault(); void work(async()=>{await api(`/access/users/${target.id}/roles`,'POST',{role_id:Number(roleId),event_id:selectedRole?.scope==='event'?Number(eventId):null});});}}>
          <label>نقش<select className={`${input} block`} value={roleId} onChange={e=>setRoleId(e.target.value)} required><option value="">انتخاب نقش</option>{roles.map(r=><option key={r.id} value={r.id}>{r.name}؛ {r.scope==='event'?'محدود به برنامه':'سراسری'}</option>)}</select></label>
          {selectedRole?.scope==='event' && <label>برنامه<select className={`${input} block`} value={eventId} onChange={e=>setEventId(e.target.value)} required><option value="">انتخاب برنامه</option>{events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}</select></label>}
          <button className={button} disabled={busy}>افزودن نقش</button>
        </form>
        <div className="space-y-2"><h2 className="font-bold">استثناهای مجوز حساب</h2><p className="text-sm">رد مجوز بر همه نقش‌های حساب مقدم است. اجازه مستقیم، مجوز سراسری ایجاد می‌کند.</p>{overrides.map(p=><p key={p.permission_code}>{permissionName(p.permission_code)}؛ {p.allowed?'مجاز':'مسدود'} <button className="text-rose-700 mr-3" disabled={busy} onClick={()=>void work(async()=>{await api(`/access/users/${target.id}/permissions/${p.permission_code}`,'DELETE');})}>حذف استثنا</button></p>)}</div>
        <form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault(); void work(async()=>{await api(`/access/users/${target.id}/permissions`,'POST',{permission_code:permissionCode,allowed});});}}>
          <select aria-label="مجوز حساب" className={input} value={permissionCode} onChange={e=>setPermissionCode(e.target.value)} required><option value="">انتخاب مجوز</option>{(permissions.length ? permissions : roles.flatMap(r=>r.permissions).filter((p,i,a)=>a.indexOf(p)===i).map(code=>({code,name:permissionName(code),scope:''}))).map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select>
          <select aria-label="اجازه یا رد مجوز" className={input} value={String(allowed)} onChange={e=>setAllowed(e.target.value==='true')}><option value="false">رد مجوز</option><option value="true">اجازه سراسری</option></select><button className={button} disabled={busy}>ثبت استثنا</button>
        </form>
      </>}
    </div>}
    {mode === 'admin' && can('roles.manage') && <form className="space-y-4 bg-white text-slate-900 border rounded-2xl p-5" onSubmit={e=>{e.preventDefault(); void work(async()=>{await api(editingRole?`/access/roles/${editingRole}`:'/access/roles',editingRole?'PATCH':'POST',{code:roleCode,name:roleName,scope:roleScope,permissions:rolePermissions}); setEditingRole(null); setRoleCode(''); setRoleName(''); setRolePermissions([]);});}}>
      <h2 className="font-bold">{editingRole?'ویرایش نقش اختصاصی':'ساخت نقش اختصاصی'}</h2>
      <select aria-label="ویرایش نقش اختصاصی" className={input} value={editingRole || ''} onChange={e=>{const role=roles.find(r=>r.id===Number(e.target.value)); setEditingRole(role?.id || null);setRoleCode(role?.code || '');setRoleName(role?.name || '');setRoleScope(role?.scope || 'event');setRolePermissions(role?.permissions || []);}}><option value="">نقش تازه</option>{roles.filter(r=>!['admin','customer','producer','checker'].includes(r.code)).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <label className="block">شناسه فنی نقش<input className={`${input} block`} dir="ltr" value={roleCode} onChange={e=>setRoleCode(e.target.value)} required pattern="[a-z][a-z0-9_]{2,49}" disabled={!!editingRole} /></label>
      <label className="block">نام نقش<input className={`${input} block`} value={roleName} onChange={e=>setRoleName(e.target.value)} required minLength={2} maxLength={150} /></label>
      <label className="block">محدوده نقش<select className={`${input} block`} value={roleScope} disabled={!!editingRole} onChange={e=>{setRoleScope(e.target.value as 'event'|'global');setRolePermissions([]);}}><option value="event">محدود به برنامه</option><option value="global">سراسری</option></select></label>
      <div className="grid sm:grid-cols-2 gap-3">{permissions.filter(p=>roleScope==='global'||p.scope==='event').map(p=><label key={p.code} className="flex gap-2"><input type="checkbox" checked={rolePermissions.includes(p.code)} onChange={e=>setRolePermissions(prev=>e.target.checked?[...prev,p.code]:prev.filter(c=>c!==p.code))} />{p.name}</label>)}</div>
      <button className={button} disabled={busy}>ذخیره نقش</button>
    </form>}
  </section>;
}
