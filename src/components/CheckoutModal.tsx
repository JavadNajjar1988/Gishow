import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Tag, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { EventItem, RunTurn, Salon, Seat, FactorItem } from '../types';
import { MOCK_DISCOUNT_CODES } from '../data/mockData';
import { formatPrice, generateFactorNumber, generateTrackingCode, generateRefId, toPersianDigits } from '../utils/formatters';

interface CheckoutModalProps {
  theme: 'light' | 'dark';
  event: EventItem;
  runTurn: RunTurn;
  salon: Salon;
  selectedSeats: Seat[];
  onClose: () => void;
  onPaymentSuccess: (factor: FactorItem) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  theme,
  event,
  runTurn,
  salon,
  selectedSeats,
  onClose,
  onPaymentSuccess,
}) => {
  const isDark = theme === 'dark';

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerNationalCode, setCustomerNationalCode] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent?: number; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [paymentGateway, setPaymentGateway] = useState<'mellat' | 'parsian' | 'zarinpal'>('mellat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBankGatewayModal, setShowBankGatewayModal] = useState(false);

  const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = () => {
    setDiscountError('');
    const code = discountInput.trim().toUpperCase();
    if (!code) return;

    const found = MOCK_DISCOUNT_CODES.find((d) => d.code === code);
    if (found) {
      let calcAmount = 0;
      if (found.discountPercent) {
        calcAmount = (subtotal * found.discountPercent) / 100;
      } else if (found.fixedAmount) {
        calcAmount = found.fixedAmount;
      }
      setAppliedDiscount({
        code: found.code,
        percent: found.discountPercent,
        amount: calcAmount,
      });
    } else {
      setDiscountError('کد تخفیف وارد شده معتبر نمی‌باشد.');
    }
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile || !customerNationalCode) {
      alert('لطفاً تمامی اطلاعات خریدار را تکمیل فرمایید.');
      return;
    }
    if (customerMobile.length < 11 || !customerMobile.startsWith('09')) {
      alert('لطفاً یک شماره همراه معتبر (۱۱ رقمی با ۰۹) وارد فرمایید.');
      return;
    }
    setShowBankGatewayModal(true);
  };

  const handleCompleteBankPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const now = new Date();
      const paidAtStr = `۱۴۰۵/۰۸/۱۸ - ${now.getHours()}:${now.getMinutes() < 10 ? '۰' : ''}${now.getMinutes()}`;
      const factorNumber = generateFactorNumber();
      const trackingCode = generateTrackingCode();
      const refId = generateRefId(paymentGateway);

      const seatCodes = selectedSeats.map((s) => `${s.row}-${s.number}`).join(',');
      const qrPayload = `GISHOW:${factorNumber}:${event.id}:${runTurn.id}:CH-${seatCodes}`;

      const newFactor: FactorItem = {
        factorNumber,
        trackingCode,
        refId,
        event,
        runTurn,
        salon,
        seats: selectedSeats.map((s) => ({ ...s, status: 'sold' })),
        customerName,
        customerMobile,
        customerNationalCode,
        subtotal,
        discountAmount,
        finalAmount,
        discountCode: appliedDiscount?.code,
        paymentGateway,
        paidAt: paidAtStr,
        qrPayload,
        isCheckedIn: false,
      };

      setIsProcessing(false);
      setShowBankGatewayModal(false);
      onPaymentSuccess(newFactor);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="space-y-1">
            <h2 className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              تکمیل سفارش و پرداخت اینترنتی
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {event.title} · {selectedSeats.length} صندلی انتخاب شده
            </p>
          </div>

          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleStartPayment} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Order Summary Box */}
          <div className={`p-4 rounded-2xl border space-y-3 text-xs ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className={`flex items-center justify-between font-bold border-b pb-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <span>خلاصه صندلی‌ها</span>
              <span className="text-amber-500">
                {runTurn.weekday} {runTurn.date} - ساعت {runTurn.time}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <span
                  key={seat.id}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  {seat.partName}: ردیف {toPersianDigits(seat.row)} صندلی {toPersianDigits(seat.number)} ({formatPrice(seat.price)})
                </span>
              ))}
            </div>
          </div>

          {/* Customer Information Inputs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              <span>مشخصات تحویل‌گیرنده بلیت</span>
              <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                (پیامک تأیید و لینک بلیت به این شماره ارسال خواهد شد)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 text-right">
                <label className={`block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: آرش کیانی"
                  className={`w-full rounded-xl px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                    isDark 
                      ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className={`block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  شماره تلفن همراه (پیامک بلیت):
                </label>
                <input
                  type="tel"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="09123456789"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-left font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                    isDark 
                      ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-right sm:col-span-2">
                <label className={`block font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  کد ملی خریدار (جهت احراز هویت در گیت ورودی):
                </label>
                <input
                  type="text"
                  required
                  value={customerNationalCode}
                  onChange={(e) => setCustomerNationalCode(e.target.value)}
                  placeholder="0012345678"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-left font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                    isDark 
                      ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Discount Code Input */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className={`text-xs block flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">کد تخفیف دارید؟</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                (کدهای نمونه: GISHOW20 یا NOROOZ)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="کد تخفیف را وارد نمایید"
                className={`flex-1 rounded-xl px-3.5 py-2 text-xs uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                  isDark
                    ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600'
                    : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                اعمال تخفیف
              </button>
            </div>

            {appliedDiscount && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>کد تخفیف {appliedDiscount.code} با موفقیت اعمال شد.</span>
              </div>
            )}

            {discountError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{discountError}</span>
              </div>
            )}
          </div>

          {/* Gateway Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold block">
              انتخاب درگاه پرداخت الکترونیک شاپرک:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'mellat', name: 'به‌پرداخت ملت', desc: 'بانک ملت' },
                { id: 'parsian', name: 'تجارت پارسیان', desc: 'بانک پارسیان' },
                { id: 'zarinpal', name: 'زرین‌پال', desc: 'پرداخت امن' },
              ].map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setPaymentGateway(gw.id as any)}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                    paymentGateway === gw.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-xs'
                      : isDark
                        ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-2 text-amber-500" />
                  <span className="text-xs font-bold block">{gw.name}</span>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{gw.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Calculation Summary */}
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>مبلغ کل صندلی‌ها:</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-500 font-bold">
                <span>تخفیف اعمال شده:</span>
                <span>- {formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className={`flex items-center justify-between font-black text-sm sm:text-base border-t pt-2 ${
              isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-950'
            }`}>
              <span>مبلغ نهایی قابل پرداخت:</span>
              <span className="text-amber-500">{formatPrice(finalAmount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              انصراف
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
            >
              <span>اتصال به درگاه بانکی شاپرک</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </form>

        {/* Bank Gateway Simulation Modal */}
        {showBankGatewayModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className={`max-w-md w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-inner">
                <CreditCard className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black">
                  شبیه‌ساز درگاه اینترنتی شاپرک ({paymentGateway === 'mellat' ? 'به‌پرداخت ملت' : paymentGateway === 'parsian' ? 'تجارت پارسیان' : 'زرین‌پال'})
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  اتصال امن به سامانه پرداخت الکترونیک شاپرک مرکزی
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 text-right ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>پذیرنده:</span>
                  <span className="font-semibold">سامانه رزرواسیون گیشو (gishow.ir)</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>مبلغ تراکنش:</span>
                  <span className="text-amber-500 font-black">{formatPrice(finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>خریدار:</span>
                  <span className="font-medium">{customerName} ({customerMobile})</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteBankPayment}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'در حال تایید تراکنش و صدور بلیت...' : 'تایید و پرداخت موفقیت‌آمیز'}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowBankGatewayModal(false)}
                  className={`w-full py-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  انصراف از پرداخت و بازگشت به سایت
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
