import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and launched as standalone PWA, suppress the button
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions modal if browser hasn't fired beforeinstallprompt yet
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            justInstalled
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border-amber-500/30 text-amber-300 hover:text-white shadow-xs'
          } ${className}`}
          title="نصب اپلیکیشن وب لیندو تیکت روی دستگاه شما (PWA)"
        >
          {justInstalled ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>نصب شد!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">نصب اپلیکیشن</span>
              <span className="sm:hidden">نصب</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                PWA
              </span>
            </>
          )}
        </button>
      )}

      {variant === 'banner' && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/20 text-xs ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>نصب نسخه پیشرو لیندو تیکت (PWA)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  آفلاین + سریع
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                دسترسی بدون نیاز به دانلود از بازار، کارکرد آفلاین در سالن و گیشه
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب آنی</span>
          </button>
        </div>
      )}

      {/* iOS Safari / WebKit Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">نصب اپلیکیشن لیندو تیکت</h3>
                <p className="text-xs text-slate-400">راهنمای افزودن به صفحه اصلی گوشی یا رایانه</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ۱
                </div>
                <div>
                  در نوار ابزار مرورگر Safari روی دکمه <strong className="text-amber-400 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> اشتراک‌گذاری (Share)</strong> بزنید.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ۲
                </div>
                <div>
                  صفحه را کمی پایین بکشید و گزینه <strong className="text-emerald-400 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> افزودن به صفحه اصلی (Add to Home Screen)</strong> را انتخاب کنید.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ۳
                </div>
                <div>
                  سپس در گوشه بالا روی <strong className="text-indigo-400">Add</strong> بزنید. آیکون اختصاصی لیندو تیکت روی صفحه اصلی گوشی اضافه خواهد شد.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
