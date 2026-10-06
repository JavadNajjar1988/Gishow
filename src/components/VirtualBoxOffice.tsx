import React, { useState } from 'react';
import {
  Store,
  Calendar,
  Ticket,
  CreditCard,
  DollarSign,
  Gift,
  CheckCircle2,
  Printer,
  X,
  Layers,
  ArrowRight,
  User,
  Phone,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import { EventItem, RunTurn, Salon, Seat, FactorItem } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { SeatMapModal } from './SeatMapModal';
import QRCode from 'qrcode';

interface VirtualBoxOfficeProps {
  theme: 'light' | 'dark';
  events: EventItem[];
  salons: Salon[];
  onBackToPortal: () => void;
  onIssueTicket: (newFactor: FactorItem) => void;
}

export const VirtualBoxOffice: React.FC<VirtualBoxOfficeProps> = ({
  theme,
  events,
  salons,
  onBackToPortal,
  onIssueTicket,
}) => {
  const isDark = theme === 'dark';

  // Selected event & sans
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const [selectedSansId, setSelectedSansId] = useState<string>(
    selectedEvent?.runTurns[0]?.id || ''
  );
  const selectedSans =
    selectedEvent?.runTurns.find((s) => s.id === selectedSansId) ||
    selectedEvent?.runTurns[0];

  const selectedSalon =
    salons.find((s) => s.id === selectedEvent?.salonId) || salons[0];

  // Selected seats state
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [showSeatMap, setShowSeatMap] = useState<boolean>(false);

  // Customer & Payment Form State
  const [customerName, setCustomerName] = useState<string>('خریدار حضوری گیشه');
  const [customerMobile, setCustomerMobile] = useState<string>('09150000000');
  const [customerNationalCode, setCustomerNationalCode] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pos' | 'cash' | 'complimentary'>('pos');
  const [posTrackingNumber, setPosTrackingNumber] = useState<string>('');

  // Issued ticket receipt state
  const [issuedFactor, setIssuedFactor] = useState<FactorItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
  const finalAmount = paymentMethod === 'complimentary' ? 0 : subtotal;

  const handleIssueTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      alert('لطفاً حداقل یک صندلی از روی پلان سالن انتخاب نمایید.');
      return;
    }

    const factorNum = `GSH-POS-${Math.floor(100000 + Math.random() * 900000)}`;
    const trkCode = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const paidAtStr = `۱۴۰۵/۰۸/۲۴ - ${now.getHours()}:${now.getMinutes() < 10 ? '۰' : ''}${now.getMinutes()}`;

    const qrPayload = `GISHOW:POS:${factorNum}:${selectedEvent.id}:${selectedSans.id}:${selectedSeats.map(s => `R${s.row}S${s.number}`).join(',')}`;

    const newFactor: FactorItem = {
      factorNumber: factorNum,
      trackingCode: trkCode,
      refId: posTrackingNumber ? `POS-${posTrackingNumber}` : `CASH-${Date.now().toString().slice(-6)}`,
      event: selectedEvent,
      runTurn: selectedSans,
      salon: selectedSalon,
      seats: selectedSeats,
      customerName: customerName || 'خریدار حضوری گیشه',
      customerMobile: customerMobile || '09150000000',
      customerNationalCode: customerNationalCode || '---',
      subtotal,
      discountAmount: paymentMethod === 'complimentary' ? subtotal : 0,
      finalAmount,
      paymentGateway: paymentMethod,
      paidAt: paidAtStr,
      qrPayload,
      isCheckedIn: false,
    };

    try {
      const qrUrl = await QRCode.toDataURL(qrPayload, { width: 220, margin: 1 });
      setQrDataUrl(qrUrl);
    } catch (err) {
      console.error(err);
    }

    setIssuedFactor(newFactor);
    onIssueTicket(newFactor);
    setSelectedSeats([]);
  };

  return (
    <div className={`min-h-screen py-8 transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Bar */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-900/40 text-white'
            : 'bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-emerald-200 text-slate-900'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black">گیشه مجازی و صدور بلیت حضوری (Box Office POS)</h1>
                <p className="text-xs text-slate-400">
                  سیستم ویژه اپراتور سالن جهت رزرو، دریافت وجه با کارتخوان بانکی یا نقدی، و چاپ آنی فیش ورود
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBackToPortal}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به سایت</span>
          </button>
        </div>

        {/* Main Box Office Grid */}
        <form onSubmit={handleIssueTicketSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Event, Sans & Seat Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Event & Sans */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                <Calendar className="w-4 h-4" />
                <span>۱. انتخاب برنامه و سانس اجرا</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block mb-1 font-semibold text-slate-400">عنوان رویداد:</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const ev = events.find((item) => item.id === e.target.value);
                      if (ev && ev.runTurns.length > 0) {
                        setSelectedSansId(ev.runTurns[0].id);
                      }
                      setSelectedSeats([]);
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.city} - {evt.salonName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-400">سانس اجرایی:</label>
                  <select
                    value={selectedSansId}
                    onChange={(e) => {
                      setSelectedSansId(e.target.value);
                      setSelectedSeats([]);
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {selectedEvent?.runTurns.map((sans) => (
                      <option key={sans.id} value={sans.id}>
                        {sans.weekday} {sans.date} ساعت {sans.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {selectedSalon.name} ({selectedSalon.city})
                </span>
                <span>ظرفیت سالن: {toPersianDigits(selectedSalon.capacity)} صندلی</span>
              </div>
            </div>

            {/* Step 2: Select Seats in Floorplan */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2 text-amber-500">
                  <Layers className="w-4 h-4" />
                  <span>۲. انتخاب صندلی‌ها در پلان سالن</span>
                </h2>

                <button
                  type="button"
                  onClick={() => setShowSeatMap(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>باز کردن پلان کامل صندلی‌ها</span>
                </button>
              </div>

              {selectedSeats.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((s) => (
                      <div
                        key={s.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold flex items-center gap-2"
                      >
                        <span>{s.partName} - ر{toPersianDigits(s.row)} ش{toPersianDigits(s.number)}</span>
                        <span className="text-[10px] text-slate-400">({formatPrice(s.price)})</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSeats((prev) => prev.filter((item) => item.id !== s.id))}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400">
                    تعداد صندلی‌های انتخابی: <strong className="text-white">{toPersianDigits(selectedSeats.length)} مورد</strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-700 text-center text-xs text-slate-400 space-y-2">
                  <Ticket className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                  <p>هنوز صندلی‌ای برای صدور انتخاب نشده است.</p>
                  <p className="text-[11px] text-slate-500">
                    روی دکمه «باز کردن پلان کامل صندلی‌ها» کلیک کنید تا نقشه سالن و صندلی‌ها باز شود.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Buyer Information */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <User className="w-4 h-4" />
                <span>۳. مشخصات خریدار یا مهمان</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-400">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="خریدار حضوری گیشه"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">شماره موبایل خریدار:</label>
                  <input
                    type="text"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="0915..."
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">کد ملی (اختیاری):</label>
                  <input
                    type="text"
                    value={customerNationalCode}
                    onChange={(e) => setCustomerNationalCode(e.target.value)}
                    placeholder="---"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right 1 Column: POS & Receipt Payment Box */}
          <div className="space-y-6">
            
            <div className={`p-6 rounded-3xl border space-y-5 sticky top-24 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                <CreditCard className="w-4 h-4" />
                <span>روش پرداخت در گیشه</span>
              </h2>

              {/* Payment Methods */}
              <div className="space-y-2 text-xs">
                {[
                  { id: 'pos', label: 'دستگاه کارتخوان شاپرک (POS)', icon: CreditCard, desc: 'تسویه با کارت بانکی در محل' },
                  { id: 'cash', label: 'وجه نقد دریافتی در گیشه (Cash)', icon: DollarSign, desc: 'تحویل دستی اسکناس' },
                  { id: 'complimentary', label: 'مهمان ویژه / سهمیه ارگانی (رایگان)', icon: Gift, desc: 'بلیت رایگان بدون وجه' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      paymentMethod === m.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <m.icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div>{m.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* POS Tracking input */}
              {paymentMethod === 'pos' && (
                <div className="text-xs space-y-1">
                  <label className="text-slate-400 block">شماره ارجاع / پیگیری کارتخوان (اختیاری):</label>
                  <input
                    type="text"
                    value={posTrackingNumber}
                    onChange={(e) => setPosTrackingNumber(e.target.value)}
                    placeholder="مثال: ۹۸۴۲۱۵"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              )}

              {/* Price Calculation */}
              <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-slate-400">
                  <span>تعداد صندلی‌ها:</span>
                  <span className="font-mono font-bold text-white">{toPersianDigits(selectedSeats.length)} عدد</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>مبلغ پایه:</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>
                {paymentMethod === 'complimentary' && (
                  <div className="flex justify-between text-emerald-400">
                    <span>تخفیف سهمیه ارگانی:</span>
                    <span className="font-mono">۱۰۰٪ رایگان</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-700">
                  <span>مبلغ قابل دریافت:</span>
                  <span className="font-mono text-emerald-500">{formatPrice(finalAmount)}</span>
                </div>
              </div>

              {/* Submit Issue Ticket Button */}
              <button
                type="submit"
                disabled={selectedSeats.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  selectedSeats.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>صدور فوری بلیت و چاپ رسید گیشه</span>
              </button>

            </div>

          </div>

        </form>

      </div>

      {/* Seat Map Modal when opened from Box Office */}
      {showSeatMap && (
        <SeatMapModal
          theme={theme}
          event={selectedEvent}
          runTurn={selectedSans}
          salon={selectedSalon}
          initialSelectedSeatIds={selectedSeats.map((s) => s.id)}
          onClose={() => setShowSeatMap(false)}
          onProceedToCheckout={(seatsFromMap) => {
            setSelectedSeats(seatsFromMap);
            setShowSeatMap(false);
          }}
        />
      )}

      {/* Instant Print Ticket Voucher Modal */}
      {issuedFactor && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-lg w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">بلیت گیشه با موفقیت صادر شد!</h3>
              </div>
              <button
                onClick={() => setIssuedFactor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Ticket Receipt Card */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 space-y-4 text-xs font-mono text-right">
              <div className="text-center space-y-1 border-b pb-3 border-slate-700">
                <div className="text-base font-black font-sans text-emerald-500">لیندو تیکت · سامانه رزرواسیون سالن (LinduTicket)</div>
                <div className="text-[10px] text-slate-400">رسید رسمی پذیرش و ورود به سالن (گیشه حضوری لیندو تیکت)</div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره فاکتور:</span>
                  <span className="font-bold text-amber-500">{issuedFactor.factorNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">عنوان برنامه:</span>
                  <span className="font-bold font-sans">{issuedFactor.event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">سالن اجرا:</span>
                  <span className="font-sans">{issuedFactor.salon.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">زمان اجرا:</span>
                  <span>{issuedFactor.runTurn.weekday} {issuedFactor.runTurn.date} ساعت {issuedFactor.runTurn.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">صندلی‌ها:</span>
                  <span className="font-bold text-emerald-400">
                    {issuedFactor.seats.map((s) => `${s.partName} ر${s.row}ش${s.number}`).join(' | ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مشتری:</span>
                  <span className="font-sans">{issuedFactor.customerName} ({issuedFactor.customerMobile})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مبلغ دریافتی:</span>
                  <span className="font-black text-emerald-500">{formatPrice(issuedFactor.finalAmount)}</span>
                </div>
              </div>

              {/* QR Code in Receipt */}
              {qrDataUrl && (
                <div className="text-center pt-2 border-t border-slate-700">
                  <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 mx-auto rounded-lg bg-white p-1" />
                  <span className="text-[9px] text-slate-400 mt-1 block">جهت اسکن در گیت چکر ورودی سالن</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 no-print">
              <button
                type="button"
                onClick={() => setIssuedFactor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                بستن پنجره
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فیش فیزیکی بلیت</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
