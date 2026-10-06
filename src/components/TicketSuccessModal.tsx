import React, { useEffect, useState } from 'react';
import { CheckCircle2, Printer, X, ShieldCheck, Calendar, Clock, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { FactorItem } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';

interface TicketSuccessModalProps {
  theme: 'light' | 'dark';
  factor: FactorItem;
  onClose: () => void;
  onGoToChecker: (ticketCode: string) => void;
}

export const TicketSuccessModal: React.FC<TicketSuccessModalProps> = ({
  theme,
  factor,
  onClose,
  onGoToChecker,
}) => {
  const isDark = theme === 'dark';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    QRCode.toDataURL(factor.qrPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#020617',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [factor]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Top Celebration Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                خرید بلیت با موفقیت انجام شد!
              </h2>
              <p className="text-xs text-emerald-100 font-normal">
                شماره فاکتور: {factor.factorNumber} · کد رهگیری: {factor.trackingCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Body */}
        <div className={`p-6 sm:p-8 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
          
          {/* Ticket Card container */}
          <div className="relative rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Cutout Notch circles */}
            <div className={`absolute top-1/2 -left-4 w-8 h-8 rounded-full -translate-y-1/2 ${
              isDark ? 'bg-slate-900' : 'bg-slate-50'
            }`} />
            <div className={`absolute top-1/2 -right-4 w-8 h-8 rounded-full -translate-y-1/2 ${
              isDark ? 'bg-slate-900' : 'bg-slate-50'
            }`} />

            <div className="border-b-2 border-dashed border-slate-200 pb-6 mb-6">
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-right">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    بلیت رسمی سامانه گیشو (Gishow)
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-950 pt-1">
                    {factor.event.title}
                  </h3>
                  {factor.event.subTitle && (
                    <p className="text-xs text-slate-500 font-normal">
                      {factor.event.subTitle}
                    </p>
                  )}
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">شماره بلیت</span>
                  <span className="text-sm font-black font-mono text-slate-900 tracking-wider">
                    {factor.factorNumber}
                  </span>
                </div>
              </div>

              {/* Event details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-700">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    تاریخ اجرا
                  </span>
                  <span className="font-bold text-slate-900">
                    {factor.runTurn.weekday} {factor.runTurn.date}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    ساعت شروع
                  </span>
                  <span className="font-bold text-slate-900">
                    {factor.runTurn.time}
                  </span>
                </div>

                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    محل سالن
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {factor.salon.name}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Part: Seats, QR Code, Buyer info */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              <div className="sm:col-span-7 space-y-4 text-right">
                
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-bold block">
                    صندلی‌های رزرو شده ({factor.seats.length} مورد):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {factor.seats.map((seat) => (
                      <span
                        key={seat.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs"
                      >
                        {seat.partName} - ردیف {toPersianDigits(seat.row)} صندلی {toPersianDigits(seat.number)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">خریدار:</span>
                    <span className="font-bold text-slate-800">{factor.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">مبلغ پرداختی:</span>
                    <span className="font-black text-emerald-600">{formatPrice(factor.finalAmount)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  * همراه داشتن اصل کارت ملی خریدار و اسکن این بارکد در گیت ورودی سالن الزامی است.
                </p>

              </div>

              {/* QR Code and Barcode Box */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-36 h-36 rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-200 rounded-lg animate-pulse" />
                )}
                
                <span className="text-[10px] font-mono text-slate-500 mt-2 tracking-widest">
                  {factor.factorNumber}
                </span>

                {/* Simulated Linear Barcode */}
                <div className="flex items-center gap-0.5 mt-1.5 h-6">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-slate-900"
                      style={{
                        width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1),
                        height: '100%',
                      }}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print pt-2">
            
            <button
              onClick={handlePrint}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span>چاپ و ذخیره فایل PDF بلیت</span>
            </button>

            <button
              onClick={() => onGoToChecker(factor.factorNumber)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تست در سامانه چکِر گیت ورود</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
