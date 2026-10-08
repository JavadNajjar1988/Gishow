import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { User, KeyRound, Lock, LogOut, CheckCircle2, AlertCircle, Shield, Phone, Sparkles } from 'lucide-react';

interface AccountPanelProps {
  theme: 'light' | 'dark';
  onClose?: () => void;
  onSuccessLogin?: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ theme, onClose, onSuccessLogin }) => {
  const isDark = theme === 'dark';
  const { user, isAuthenticated, login, logout, recoverWithCode, error, clearError, isLoading } = useAuth();

  const [tab, setTab] = useState<'login' | 'recover'>('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalFeedback(null);

    const ok = await login({ mobile, password });
    if (ok) {
      if (onSuccessLogin) onSuccessLogin();
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalFeedback(null);

    const ok = await recoverWithCode({
      mobile,
      personalRecoveryCode: recoveryCode,
      newPassword: newPassword || undefined,
    });
    if (ok) {
      setLocalFeedback('احراز هویت با کد شخصی با موفقیت انجام شد و نشست کاربری شما فعال گردید.');
      if (onSuccessLogin) onSuccessLogin();
    }
  };

  // If already authenticated, show account profile & session info
  if (isAuthenticated && user) {
    const roleLabels: Record<string, string> = {
      super_admin: 'مدیر ارشد سامانه (Super Admin)',
      producer: 'تهیه‌کننده و مجری رویداد (Producer)',
      gate_checker: 'متصدی گیت ورود (Gate Checker)',
      customer: 'خریدار و تماشاگر (Customer)',
    };

    return (
      <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center justify-between border-b pb-4 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black">{user.fullName || 'کاربر سیستم'}</h3>
              <div className="text-xs font-mono text-slate-400 mt-0.5">{user.mobile}</div>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
            {roleLabels[user.role] || user.role}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">شناسه سیستمی کاربر:</span>
              <span className="font-mono font-bold text-amber-400">{user.id}</span>
            </div>
            {user.role === 'producer' && (
              <div className="flex justify-between pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">برنامه‌های مجاز به مدیریت:</span>
                <span className="font-mono text-emerald-400">
                  {user.assignedEventIds && user.assignedEventIds.length > 0
                    ? `${user.assignedEventIds.length} رویداد اختصاصی`
                    : 'بدون تخصیص مستقیم'}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">نوع اعتبارسنجی نشست:</span>
              <span className="text-emerald-400 font-bold">کوکی ایمن سرور (HTTP-only Session)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => logout()}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب کاربری</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              بستن
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header and Switcher */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black">احراز هویت و ورود امن به گیشو</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">مدیریت دسترسی به پنل مدیریت، تهیه‌کننده و خریدها</p>
          </div>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button
            onClick={() => { setTab('login'); clearError(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              tab === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ورود با رمز
          </button>
          <button
            onClick={() => { setTab('recover'); clearError(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              tab === 'recover' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            بازیابی با کد شخصی
          </button>
        </div>
      </div>

      {/* Errors & Notices */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {localFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{localFeedback}</span>
        </div>
      )}

      {/* Tab 1: Login */}
      {tab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-bold text-slate-400">شماره تلفن همراه:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                className={`w-full p-2.5 pr-9 rounded-xl border font-mono ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-slate-400">کلمه عبور:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full p-2.5 pr-9 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>در حال ارسال درخواست به سرور...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>ورود به سامانه</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab 2: Recovery via Personal Security Code */}
      {tab === 'recover' && (
        <form onSubmit={handleRecoverSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-bold text-slate-400">شماره تلفن همراه:</label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="۰۹۱۲۰۰۰۰۰۰۰"
              className={`w-full p-2.5 rounded-xl border font-mono ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-slate-400">کد اختصاصی بازیابی (Personal Recovery Code):</label>
            <input
              type="text"
              required
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="کد شخصی صادر شده هنگام ثبت‌نام"
              className={`w-full p-2.5 rounded-xl border font-mono ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-slate-400">کلمه عبور جدید (اختیاری):</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="در صورت تمایل به تغییر رمز عبور"
              className={`w-full p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>در حال اعتبارسنجی با سرور...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>اعتبارسنجی با کد شخصی و فعال‌سازی نشست</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
