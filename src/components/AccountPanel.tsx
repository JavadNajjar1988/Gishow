import React, {useEffect, useRef, useState} from 'react';
import {Account, api} from '../auth/api';
import {useAuth} from '../auth/AuthContext';
export function AccountPanel({onClose}: {onClose: () => void}) {
  const {user, setUser, refresh, logout} = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState(user?.full_name || '');
  const [nationalCode, setNationalCode] = useState(user?.national_code || '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const dialog = closeButton.current?.closest('section');
        const focusable = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length-1];
        if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
        if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); previous?.focus(); };
  }, [onClose]);
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await work(); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const input = 'w-full rounded-xl border border-slate-300 bg-white text-slate-900 p-3';
  const button = 'rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50';
  const authenticated = async (data: {user: Account; recovery_codes?: string[]}) => {
    setUser(data.user); setName(data.user.full_name); setNationalCode(data.user.national_code || '');
    setPassword(''); setCurrentPassword(''); setCodes(data.recovery_codes || []);
    setMessage('وارد حساب شدید.');
  };
  return <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4" dir="rtl">
    <section role="dialog" aria-modal="true" aria-labelledby="account-title" className="mx-auto my-8 max-w-lg rounded-2xl bg-white text-slate-900 p-6 space-y-5">
      <div className="flex justify-between items-center"><h2 id="account-title" className="text-xl font-bold">{user ? 'حساب کاربری' : mode === 'register' ? 'ثبت‌نام' : mode === 'recover' ? 'بازیابی گذرواژه' : 'ورود به حساب'}</h2><button ref={closeButton} onClick={onClose} aria-label="بستن حساب کاربری">بستن</button></div>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {message && <p role="status" className="text-emerald-700">{message}</p>}
      {codes.length > 0 && <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-3">
        <p>این پنج کد فقط همین‌بار نمایش داده می‌شوند. هر کد برای یک‌بار بازیابی حساب است؛ آن‌ها را در جای امن نگه دارید.</p>
        <ul dir="ltr" className="font-mono text-xs break-all space-y-2">{codes.map(c => <li key={c}>{c}</li>)}</ul>
        <button className={button} onClick={() => { const blob = new Blob([codes.join('\n')], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='gishow-recovery-codes.txt'; a.click(); URL.revokeObjectURL(url); }}>ذخیره کدهای بازیابی</button>
      </div>}
      {!user ? <>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); void action(async () => {
          if (mode === 'recover') { await api('/auth/recover', 'POST', {mobile, password, recovery_code:code}); setMode('login'); setPassword(''); setCode(''); setMessage('گذرواژه تغییر کرد؛ با گذرواژه تازه وارد شوید.'); }
          else { await authenticated(await api<{user:Account; recovery_codes?:string[]}>(`/auth/${mode}`, 'POST', mode === 'register' ? {mobile, password, full_name:name} : {mobile, password})); }
        }); }}>
          {mode === 'register' && <label className="block">نام و نام خانوادگی<input className={input} value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={150} autoComplete="name" /></label>}
          <label className="block">شماره همراه<input className={input} dir="ltr" value={mobile} onChange={e => setMobile(e.target.value)} required type="tel" autoComplete="tel" /></label>
          {mode === 'recover' && <label className="block">کد بازیابی یک‌بارمصرف<input className={input} dir="ltr" value={code} onChange={e => setCode(e.target.value.trim())} required minLength={32} maxLength={32} autoComplete="off" /></label>}
          <label className="block">{mode === 'recover' ? 'گذرواژه تازه' : 'گذرواژه'}<input className={input} type="password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'login' ? 1 : 12} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {mode !== 'login' && <p className="text-sm text-slate-600">گذرواژه دست‌کم دوازده نویسه داشته باشد.</p>}
          <button className={button} disabled={busy}>{busy ? 'در حال بررسی…' : mode === 'register' ? 'ساخت حساب' : mode === 'recover' ? 'تغییر گذرواژه' : 'ورود'}</button>
        </form>
        <div className="flex flex-wrap gap-4 text-sm">{mode !== 'login' && <button onClick={() => {setMode('login'); setError('');}}>ورود</button>}{mode !== 'register' && <button onClick={() => {setMode('register'); setError('');}}>ثبت‌نام</button>}{mode !== 'recover' && <button onClick={() => {setMode('recover'); setError('');}}>گذرواژه را فراموش کرده‌ام</button>}</div>
        {mode === 'recover' && <p className="text-sm text-slate-600">یکی از کدهایی را وارد کنید که هنگام ثبت‌نام یا نوسازی دریافت کرده‌اید. کد بازیابی از طریق پیامک ارسال نمی‌شود.</p>}
      </> : <>
        <p>شماره همراه شما: <bdi>{user.mobile}</bdi></p>
        <form className="space-y-3" onSubmit={e => {e.preventDefault(); void action(async () => { setUser(await api<Account>('/auth/me', 'PATCH', {full_name:name, national_code:nationalCode || null, current_password:currentPassword})); setCurrentPassword(''); setMessage('اطلاعات حساب ذخیره شد.'); });}}>
          <label className="block">نام و نام خانوادگی<input className={input} value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={150} /></label>
          <label className="block">کد ملی اختیاری<input className={input} dir="ltr" value={nationalCode} onChange={e => setNationalCode(e.target.value)} pattern="[0-9]{10}" /></label>
          <label className="block">گذرواژه فعلی<input className={input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required maxLength={128} /></label>
          <button className={button} disabled={busy}>ذخیره اطلاعات</button>
        </form>
        <form className="space-y-3" onSubmit={e => {e.preventDefault(); void action(async () => {await api('/auth/password', 'POST', {current_password:currentPassword, password}); setUser(null); setPassword(''); setCurrentPassword(''); setMode('login'); setMessage('گذرواژه تغییر کرد و همه نشست‌ها بسته شدند. دوباره وارد شوید.');});}}>
          <label className="block">گذرواژه تازه<input className={input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /></label>
          <button className={button} disabled={busy}>تغییر گذرواژه</button>
        </form>
        <div className="flex flex-wrap gap-3">
          <button className={button} disabled={busy} onClick={() => void action(async () => {const data = await api<{recovery_codes:string[]}>('/auth/recovery-codes', 'POST', {current_password:currentPassword}); setCodes(data.recovery_codes); setCurrentPassword(''); setMessage('کدهای قبلی باطل شدند.');})}>نوسازی کدهای بازیابی</button>
          <button className={button} disabled={busy} onClick={() => void action(async () => {await logout(); setCodes([]); setCurrentPassword('');})}>خروج</button>
          <button className={button} disabled={busy} onClick={() => void action(async () => {await api('/auth/logout-all', 'POST'); setCodes([]); await refresh();})}>خروج از همه دستگاه‌ها</button>
        </div>
        <p className="text-sm text-slate-600">برای تغییر گذرواژه یا نوسازی کدها، گذرواژه فعلی را در فرم بالا وارد کنید. تغییر شماره همراه تا اتصال تأیید شماره در دسترس نیست.</p>
      </>}
    </section>
  </div>;
}
