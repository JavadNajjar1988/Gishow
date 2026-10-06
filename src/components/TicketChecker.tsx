import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Search, QrCode, Users, Clock, ArrowRight } from 'lucide-react';
import { FactorItem, TicketScanCheckResult } from '../types';
import { toPersianDigits } from '../utils/formatters';

interface TicketCheckerProps {
  theme: 'light' | 'dark';
  factors: FactorItem[];
  onCheckInTicket: (factorNumber: string) => TicketScanCheckResult;
  onBackToPortal: () => void;
  initialCode?: string;
}

export const TicketChecker: React.FC<TicketCheckerProps> = ({
  theme,
  factors,
  onCheckInTicket,
  onBackToPortal,
  initialCode = '',
}) => {
  const isDark = theme === 'dark';
  const [inputCode, setInputCode] = useState(initialCode);
  const [scanResult, setScanResult] = useState<TicketScanCheckResult | null>(null);
  const [scanHistory, setScanHistory] = useState<TicketScanCheckResult[]>([]);

  // Calculate statistics
  const totalTickets = factors.length;
  const checkedInCount = factors.filter((f) => f.isCheckedIn).length;
  const remainingCount = totalTickets - checkedInCount;

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || inputCode).trim().toUpperCase();
    if (!code) return;

    const result = onCheckInTicket(code);
    setScanResult(result);
    setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
    if (!codeToVerify) setInputCode('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Banner and Gate Identity */}
      <div className={`rounded-3xl border p-6 sm:p-8 shadow-xl flex flex-wrap items-center justify-between gap-6 transition-colors ${
        isDark
          ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-rose-900/40 text-white'
          : 'bg-gradient-to-r from-rose-50 via-white to-slate-50 border-rose-200 text-slate-900'
      }`}>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'bg-rose-100 text-rose-600'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[11px] font-mono block ${isDark ? 'text-rose-400' : 'text-rose-600 font-bold'}`}>
                checker.gishow.ir
              </span>
              <h1 className="text-xl sm:text-2xl font-black">
                سامانه کنترل و اعتبارسنجی بلیت (گیت ورود)
              </h1>
            </div>
          </div>
          <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            مخصوص متصدیان گیت ورودی سالن. بارکد یا شماره بلیت را اسکن نمایید تا وضعیت اعتبار و سابقه ورود تماشاگر به صورت برخط استعلام شود.
          </p>
        </div>

        <button
          onClick={onBackToPortal}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            isDark
              ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
              : 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به سایت اصلی</span>
        </button>

      </div>

      {/* Live Venue Statistics Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className={`p-5 rounded-2xl border space-y-1 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className={`text-xs block flex items-center gap-1.5 font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Users className="w-4 h-4 text-indigo-500" />
            کل بلیت‌های صادرشده
          </span>
          <span className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {toPersianDigits(totalTickets)} بلیت
          </span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-xs text-emerald-500 block flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            وارد شده به سالن
          </span>
          <span className="text-2xl font-black text-emerald-500 tabular-nums">
            {toPersianDigits(checkedInCount)} نفر
          </span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-xs text-amber-500 block flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-amber-500" />
            در انتظار ورود به سالن
          </span>
          <span className="text-2xl font-black text-amber-500 tabular-nums">
            {toPersianDigits(remainingCount)} نفر
          </span>
        </div>

      </div>

      {/* Scanner Input & Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input box */}
        <div className="lg:col-span-6 space-y-6">
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <QrCode className="w-4 h-4 text-rose-500" />
              ورود دستی یا اسکن بارکد بلیت
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="شماره فاکتور مانند GSH-849201"
                  className={`w-full rounded-xl pr-10 pl-4 py-3 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                    isDark
                      ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>

              <button
                onClick={() => handleVerify()}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-rose-600/20 cursor-pointer whitespace-nowrap"
              >
                استعلام و ثبت
              </button>
            </div>

            {/* Quick Test Demo Tickets */}
            <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className={`text-[11px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                بلیت‌های نمونه موجود در سیستم جهت آزمایش:
              </span>
              
              <div className="flex flex-wrap gap-2">
                {factors.slice(0, 4).map((f) => (
                  <button
                    key={f.factorNumber}
                    onClick={() => {
                      setInputCode(f.factorNumber);
                      handleVerify(f.factorNumber);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                      f.isCheckedIn
                        ? isDark
                          ? 'border-amber-800/60 bg-amber-950/20 text-amber-300'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                        : isDark
                          ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>{f.factorNumber}</span>
                    <span className="text-[10px] opacity-70">
                      ({f.isCheckedIn ? 'وارد شده' : 'هنوز وارد نشده'})
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Scan Result Feedback Screen */}
        <div className="lg:col-span-6">
          {scanResult ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all duration-300 space-y-4 ${
                scanResult.status === 'valid'
                  ? isDark
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : scanResult.status === 'already_checked'
                  ? isDark
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark
                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {scanResult.status === 'valid' && (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                )}
                {scanResult.status === 'already_checked' && (
                  <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
                )}
                {scanResult.status === 'invalid' && (
                  <XCircle className="w-10 h-10 text-rose-500 shrink-0" />
                )}

                <div>
                  <h4 className="text-lg font-black">
                    {scanResult.message}
                  </h4>
                  <p className="text-xs opacity-80">
                    زمان استعلام: {scanResult.timestamp}
                  </p>
                </div>
              </div>

              {scanResult.factor && (
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="flex justify-between">
                    <span className="opacity-70">نام برنامه:</span>
                    <span className="font-bold">{scanResult.factor.event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">سانس اجرا:</span>
                    <span>{scanResult.factor.runTurn.weekday} ساعت {scanResult.factor.runTurn.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">نام خریدار:</span>
                    <span className="font-bold">{scanResult.factor.customerName} (کد ملی: {scanResult.factor.customerNationalCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">صندلی‌ها:</span>
                    <span className="text-amber-500 font-bold">
                      {scanResult.factor.seats.map((s) => `${s.partName} ر${s.row} ش${s.number}`).join(' | ')}
                    </span>
                  </div>
                  {scanResult.factor.checkedInAt && (
                    <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-2 text-amber-600 dark:text-amber-300 font-bold">
                      <span>زمان ثبت ورود اولیه:</span>
                      <span className="font-mono">{scanResult.factor.checkedInAt}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className={`p-8 rounded-3xl border text-center space-y-3 flex flex-col items-center justify-center min-h-[220px] transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
              }`}>
                <QrCode className="w-6 h-6" />
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                منتظر اسکن بلیت... لطفاً شماره یا بارکد بلیت را وارد نمایید.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Scans Activity Log */}
      {scanHistory.length > 0 && (
        <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <h3 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            گزارش آخرین استعلام‌های انجام شده در گیت
          </h3>

          <div className={`divide-y text-xs ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
            {scanHistory.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.status === 'valid'
                        ? 'bg-emerald-500'
                        : item.status === 'already_checked'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.message}</span>
                  {item.factor && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({item.factor.factorNumber} - {item.factor.customerName})
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
