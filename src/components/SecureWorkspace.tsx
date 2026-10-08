import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../types';
import { AccountPanel } from './AccountPanel';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

interface SecureWorkspaceProps {
  theme: 'light' | 'dark';
  requiredRole: UserRole | UserRole[];
  eventId?: number | string;
  title: string;
  onBackToPortal: () => void;
  children: React.ReactNode;
}

export const SecureWorkspace: React.FC<SecureWorkspaceProps> = ({
  theme,
  requiredRole,
  eventId,
  title,
  onBackToPortal,
  children,
}) => {
  const isDark = theme === 'dark';
  const { user, isAuthenticated, isLoading, checkPermission } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">در حال اعتبارسنجی نشست امن کاربر با سرور...</p>
      </div>
    );
  }

  // Not authenticated: Show login/recovery panel directly in context
  if (!isAuthenticated || !user) {
    return (
      <div className={`min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-8 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="max-w-lg w-full space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToPortal}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به پرتال اصلی</span>
            </button>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              دسترسی محافظت‌شده: {title}
            </span>
          </div>

          <AccountPanel theme={theme} />
        </div>
      </div>
    );
  }

  // Check role & event-specific permission
  const hasAccess = checkPermission(requiredRole, eventId);

  if (!hasAccess) {
    return (
      <div className={`min-h-[75vh] flex flex-col items-center justify-center p-8 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border text-center space-y-5 ${
          isDark ? 'bg-slate-900 border-rose-900/40' : 'bg-white border-rose-200 shadow-xl'
        }`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-rose-400">دسترسی به این بخش مجاز نمی‌باشد (۴۰۳)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              نقش کاربری شما ({user.role}) مجوز لازم برای مشاهده یا مدیریت این بخش («{title}») را ندارد.
              {user.role === 'producer' && eventId && (
                <span className="block mt-2 font-mono text-[11px] text-amber-400">
                  این برنامه در لیست رویدادهای مجاز تهیه‌کننده شما ثبت نشده است.
                </span>
              )}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToPortal}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized: render workspace children
  return <>{children}</>;
};
