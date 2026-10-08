import React, { useState, useMemo } from 'react';
import { EventItem, RunTurn, Salon, FactorItem, Seat, UserAccount, DiscountCode } from '../types';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import {
  Crown,
  Calendar,
  Ticket,
  DollarSign,
  Users,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Play,
  Pause,
  Printer,
  Send,
  FileText,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  QrCode,
  Search,
  Sparkles,
  Lock,
  Unlock,
  ChevronDown,
  Tag,
  Percent,
  Flame,
  Check,
  Copy,
  ToggleLeft,
  ToggleRight,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { MOCK_DISCOUNT_CODES } from '../data/mockData';
import { PWAInstallButton } from './PWAInstallButton';

interface ProducerDashboardProps {
  theme: 'light' | 'dark';
  events: EventItem[];
  salons: Salon[];
  factors: FactorItem[];
  discountCodes?: DiscountCode[];
  onBackToPortal: () => void;
  onUpdateEvent?: (updatedEvent: EventItem) => void;
  onIssueComplimentaryTicket?: (newFactor: FactorItem) => void;
  onAddDiscountCode?: (code: DiscountCode) => void;
  onUpdateDiscountCode?: (updated: DiscountCode) => void;
  onDeleteDiscountCode?: (codeId: string) => void;
}

export const ProducerDashboard: React.FC<ProducerDashboardProps> = ({
  theme,
  events,
  salons,
  factors,
  discountCodes,
  onBackToPortal,
  onUpdateEvent,
  onIssueComplimentaryTicket,
  onAddDiscountCode,
  onUpdateDiscountCode,
  onDeleteDiscountCode,
}) => {
  const isDark = theme === 'dark';

  // Active Selected Event for Producer
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Salon of the active event
  const currentSalon = useMemo(() => {
    if (!activeEvent) return salons[0];
    return salons.find((s) => s.id === activeEvent.salonId) || salons[0];
  }, [salons, activeEvent]);

  // Navigation tabs inside Producer Console
  const [activeProducerTab, setActiveProducerTab] = useState<
    'overview' | 'sanser' | 'complimentary' | 'gate_monitor' | 'settlement' | 'attendees' | 'discounts' | 'permits'
  >('overview');

  // Modals inside producer
  const [showAddSansModal, setShowAddSansModal] = useState(false);
  const [newProducerSansSalonId, setNewProducerSansSalonId] = useState('');
  const [newSansDate, setNewSansDate] = useState('۱۴۰۵/۰۸/۲۵');
  const [newSansTime, setNewSansTime] = useState('۲۱:۰۰');
  const [newSansWeekday, setNewSansWeekday] = useState('پنج‌شنبه');
  const [newSansIsSoldOut, setNewSansIsSoldOut] = useState(false);

  // Discount Codes management state
  const [internalDiscounts, setInternalDiscounts] = useState<DiscountCode[]>(discountCodes || MOCK_DISCOUNT_CODES);
  const activeDiscounts = discountCodes || internalDiscounts;
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscDesc, setNewDiscDesc] = useState('');
  const [newDiscType, setNewDiscType] = useState<'percent' | 'fixed'>('percent');
  const [newDiscValue, setNewDiscValue] = useState<number>(20);
  const [newDiscScope, setNewDiscScope] = useState<'event' | 'all'>('event');
  const [newDiscMaxUsage, setNewDiscMaxUsage] = useState<number>(100);
  const [newDiscMinOrder, setNewDiscMinOrder] = useState<number>(0);
  const [newDiscExpiry, setNewDiscExpiry] = useState<string>('۱۴۰۵/۱۰/۳۰');
  const [copiedCodeToast, setCopiedCodeToast] = useState<string | null>(null);

  // Filtered discounts relevant to current producer event (or all events)
  const eventDiscounts = useMemo(() => {
    if (!activeEvent) return activeDiscounts;
    return activeDiscounts.filter((d) => d.eventId === 'all' || d.eventId === activeEvent.id);
  }, [activeDiscounts, activeEvent]);

  // Complimentary Ticket Modal
  const [showCompTicketModal, setShowCompTicketModal] = useState(false);
  const [compGuestName, setCompGuestName] = useState('');
  const [compGuestMobile, setCompGuestMobile] = useState('');
  const [compSectionName, setCompSectionName] = useState(currentSalon?.parts[0]?.name || 'جایگاه VIP');
  const [compCount, setCompCount] = useState(2);
  const [compNotes, setCompNotes] = useState('مهمان ویژه تهیه‌کننده و ارکستر');
  const [successCompFactor, setSuccessCompFactor] = useState<FactorItem | null>(null);

  // Settlement Request State
  const [shebaNumber, setShebaNumber] = useState('IR720120000000008765432101');
  const [shebaOwner, setShebaOwner] = useState('موسسه فرهنگی هنری هماگستر (تهیه‌کننده)');
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState(false);

  // SMS Broadcast State
  const [smsText, setSmsText] = useState(
    'تماشاگر گرامی، درب‌های سالن ۳۰ دقیقه قبل از شروع برنامه باز خواهد شد. لطفاً بارکد بلیت خود را آماده داشته باشید.'
  );
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  // Factors specifically for this event
  const eventFactors = useMemo(() => {
    if (!activeEvent) return [];
    return factors.filter((f) => f.event.id === activeEvent.id);
  }, [factors, activeEvent]);

  // Financial calculations for the producer
  const totalGrossSale = eventFactors.reduce((acc, f) => acc + f.finalAmount, 0);
  const systemCommissionPercent = 4; // 4% portal fee
  const systemCommissionAmount = Math.round((totalGrossSale * systemCommissionPercent) / 100);
  const vatTaxPercent = 9; // 9% tax
  const vatTaxAmount = Math.round((systemCommissionAmount * vatTaxPercent) / 100);
  const netPayableToProducer = totalGrossSale - systemCommissionAmount - vatTaxAmount;

  // Total seats sold
  const totalTicketsSold = eventFactors.reduce((acc, f) => acc + f.seats.length, 0);
  const totalEventCapacity = (activeEvent?.runTurns?.length || 1) * (currentSalon?.capacity || 400);
  const occupancyPercent = totalEventCapacity > 0 ? Math.min(100, Math.round((totalTicketsSold / totalEventCapacity) * 100)) : 0;

  // Check-in Gate Stats
  const checkedInCount = eventFactors.filter((f) => f.isCheckedIn).reduce((acc, f) => acc + f.seats.length, 0);

  // Add Sans Handler
  const handleCreateNewSans = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    const chosenSalon = salons.find((s) => s.id === (newProducerSansSalonId || activeEvent.salonId)) || currentSalon;

    const newSans: RunTurn = {
      id: `sans-${Date.now()}`,
      eventId: activeEvent.id,
      salonId: chosenSalon.id,
      date: newSansDate,
      time: newSansTime,
      weekday: newSansWeekday,
      availableSeatsCount: newSansIsSoldOut ? 0 : chosenSalon.capacity,
      totalSeatsCount: chosenSalon.capacity,
      isSoldOut: newSansIsSoldOut,
    };

    const updated = {
      ...activeEvent,
      runTurns: [...activeEvent.runTurns, newSans],
    };

    if (onUpdateEvent) {
      onUpdateEvent(updated);
    }
    setShowAddSansModal(false);
    setNewSansIsSoldOut(false);
    setNewProducerSansSalonId('');
  };

  // Toggle Sales Status Handler
  const handleToggleEventActive = () => {
    if (!activeEvent || !onUpdateEvent) return;
    const updated = {
      ...activeEvent,
      isActive: !activeEvent.isActive,
    };
    onUpdateEvent(updated);
  };

  // Toggle Entire Event Sold Out (سولد اوت / تکمیل ظرفیت رویداد)
  const handleToggleEventSoldOut = () => {
    if (!activeEvent || !onUpdateEvent) return;
    const updated = {
      ...activeEvent,
      isSoldOut: !activeEvent.isSoldOut,
    };
    onUpdateEvent(updated);
  };

  // Toggle Specific Sans Sold Out (سولد اوت / تکمیل ظرفیت تک سانس)
  const handleToggleSansSoldOut = (sansId: string) => {
    if (!activeEvent || !onUpdateEvent) return;
    const updatedRuns = activeEvent.runTurns.map((s) => {
      if (s.id === sansId) {
        const nextSoldOut = !s.isSoldOut;
        return {
          ...s,
          isSoldOut: nextSoldOut,
          availableSeatsCount: nextSoldOut ? 0 : s.totalSeatsCount,
        };
      }
      return s;
    });

    const updated = {
      ...activeEvent,
      runTurns: updatedRuns,
    };
    onUpdateEvent(updated);
  };

  // Create Discount Code Handler (تعیین کد تخفیف جدید)
  const handleCreateDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscCode.trim() || !activeEvent) return;

    const newDiscount: DiscountCode = {
      id: `disc-prod-${Date.now()}`,
      code: newDiscCode.trim().toUpperCase(),
      description:
        newDiscDesc.trim() ||
        `تخفیف ویژه تهیه‌کننده ${newDiscType === 'percent' ? `${newDiscValue}٪` : formatPrice(newDiscValue)}`,
      discountPercent: newDiscType === 'percent' ? Number(newDiscValue) : undefined,
      fixedAmount: newDiscType === 'fixed' ? Number(newDiscValue) : undefined,
      eventId: newDiscScope === 'event' ? activeEvent.id : 'all',
      eventTitle: newDiscScope === 'event' ? activeEvent.title : undefined,
      maxUsage: Number(newDiscMaxUsage),
      usedCount: 0,
      minOrderAmount: Number(newDiscMinOrder) || undefined,
      expiresAt: newDiscExpiry,
      isActive: true,
    };

    if (onAddDiscountCode) {
      onAddDiscountCode(newDiscount);
    } else {
      setInternalDiscounts((prev) => [newDiscount, ...prev]);
    }

    setShowAddDiscountModal(false);
    setNewDiscCode('');
    setNewDiscDesc('');
    setNewDiscValue(20);
  };

  // Toggle Discount Code Active/Inactive
  const handleToggleDiscountActive = (item: DiscountCode) => {
    const updated: DiscountCode = { ...item, isActive: item.isActive === false ? true : false };
    if (onUpdateDiscountCode) {
      onUpdateDiscountCode(updated);
    } else {
      setInternalDiscounts((prev) => prev.map((d) => (d.code === item.code ? updated : d)));
    }
  };

  // Delete Discount Code
  const handleDeleteDiscount = (code: string) => {
    if (onDeleteDiscountCode) {
      onDeleteDiscountCode(code);
    } else {
      setInternalDiscounts((prev) => prev.filter((d) => d.code !== code));
    }
  };

  // Copy discount code to clipboard
  const handleCopyDiscount = (codeStr: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(codeStr);
    }
    setCopiedCodeToast(codeStr);
    setTimeout(() => setCopiedCodeToast(null), 3000);
  };

  // Issue Complimentary Ticket Handler
  const handleIssueComplimentary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    const chosenSans = activeEvent.runTurns[0] || {
      id: 'default',
      eventId: activeEvent.id,
      date: '۱۴۰۵/۰۸/۲۴',
      time: '۲۰:۳۰',
      weekday: 'چهارشنبه',
      availableSeatsCount: 100,
      totalSeatsCount: 100,
    };

    const dummySeats: Seat[] = Array.from({ length: compCount }).map((_, i) => ({
      id: `comp-seat-${Date.now()}-${i}`,
      partId: 'part-vip',
      partName: compSectionName,
      row: 1,
      number: i + 1,
      price: 0,
      status: 'sold',
    }));

    const factorNumber = `GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
    const compFactor: FactorItem = {
      factorNumber,
      trackingCode: `TRK-${Date.now().toString().slice(-6)}`,
      refId: `COMP-${Date.now()}`,
      event: activeEvent,
      runTurn: chosenSans,
      salon: currentSalon,
      seats: dummySeats,
      customerName: compGuestName || 'مهمان ویژه تهیه‌کننده',
      customerMobile: compGuestMobile || '۰۹۱۲۰۰۰۰۰۰۰',
      customerNationalCode: '---',
      subtotal: 0,
      discountAmount: 0,
      finalAmount: 0,
      paymentGateway: 'complimentary',
      paidAt: '۱۴۰۵/۰۸/۱۸ - ۱۶:۳۰',
      qrPayload: `LINDU-${factorNumber}-VIP-GUEST`,
      isCheckedIn: false,
    };

    if (onIssueComplimentaryTicket) {
      onIssueComplimentaryTicket(compFactor);
    }
    setSuccessCompFactor(compFactor);
    setShowCompTicketModal(false);
    setCompGuestName('');
    setCompGuestMobile('');
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Header */}
      <header className={`border-b sticky top-0 z-30 transition-colors backdrop-blur-md ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black">کنسول اختصاصی تهیه‌کننده و مدیر برنامه</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  LinduProducer Hub
                </span>
              </div>
              <p className="text-xs text-slate-400">
                اختیارات اجرایی، کنترل سانس‌ها، تسویه مالی، صدور بلیت مهمان و مانیتورینگ گیت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Event Selector Dropdown */}
            <div className="relative min-w-[200px] hidden sm:block">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer appearance-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    🎭 {evt.title} ({evt.city})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <PWAInstallButton variant="header" />

            <button
              onClick={onBackToPortal}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به سامانه</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Producer Banner & Active Event Overview */}
        <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800'
            : 'bg-gradient-to-r from-white via-white to-amber-50/50 border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  رویداد در حال مدیریت تهیه‌کننده
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  activeEvent?.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {activeEvent?.isActive ? '● فروش آنلاین باز است' : '○ فروش موقتاً متوقف است'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  activeEvent?.isSoldOut ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-500/10 text-slate-400 border border-slate-700/50'
                }`}>
                  <Flame className="w-3 h-3 text-rose-500" />
                  {activeEvent?.isSoldOut ? 'سولد اوت (تکمیل ظرفیت)' : 'دارای ظرفیت فروش'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black">{activeEvent?.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4 text-amber-500" />
                  {currentSalon?.name} ({currentSalon?.city})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {activeEvent?.dateRange}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {toPersianDigits(activeEvent?.runTurns?.length || 0)} سانس برنامه‌ریزی شده
                </span>
              </div>
            </div>

            {/* Quick Action Buttons for Producer */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowCompTicketModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Ticket className="w-4 h-4" />
                <span>صدور بلیت مهمان / تشریفات</span>
              </button>

              <button
                onClick={() => setShowAddSansModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سانس فوق‌العاده</span>
              </button>

              <button
                onClick={handleToggleEventActive}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeEvent?.isActive
                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {activeEvent?.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{activeEvent?.isActive ? 'توقف موقت فروش' : 'بازگشایی فروش آنلاین'}</span>
              </button>

              {/* Sold Out Toggle Button for Producer */}
              <button
                onClick={handleToggleEventSoldOut}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeEvent?.isSoldOut
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30 shadow-lg shadow-rose-500/10'
                    : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800/60'
                }`}
                title="تغییر وضعیت رویداد به سولد اوت یا لغو سولد اوت"
              >
                <Flame className={`w-4 h-4 ${activeEvent?.isSoldOut ? 'text-rose-400 fill-rose-500/30' : 'text-slate-400'}`} />
                <span>{activeEvent?.isSoldOut ? 'لغو سولد اوت رویداد' : 'اعلام سولد اوت (تکمیل ظرفیت)'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* 4 Financial & Sales KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">کل فروش ناخالص گیشه</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatPrice(totalGrossSale)}
            </div>
            <div className="text-[11px] text-slate-400">
              از مجموع {toPersianDigits(eventFactors.length)} تراکنش موفق شاپرک
            </div>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">خالص دریافتی تهیه‌کننده</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {formatPrice(netPayableToProducer)}
            </div>
            <div className="text-[11px] text-emerald-500 font-bold">
              پس از کسر {toPersianDigits(systemCommissionPercent)}٪ کارمزد سامانه و مالیات
            </div>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">صندلی‌های فروخته‌شده</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono">
              {toPersianDigits(totalTicketsSold)} صندلی
            </div>
            <div className="text-[11px] text-indigo-400 font-bold">
              تکمیل {toPersianDigits(occupancyPercent)}٪ ظرفیت سالن
            </div>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">ورود به سالن (گیت چکر)</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {toPersianDigits(checkedInCount)} نفر داخل سالن
            </div>
            <div className="text-[11px] text-slate-400">
              {toPersianDigits(totalTicketsSold - checkedInCount)} نفر در صف یا باقیمانده
            </div>
          </div>

        </div>

        {/* Tab Bar for Producer Powers */}
        <div className={`flex items-center gap-2 border-b pb-3 text-xs font-bold overflow-x-auto scrollbar-none ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {[
            { id: 'overview', label: '📊 نمای کلی و آمار فروش' },
            { id: 'sanser', label: '⏰ مدیریت سانس‌ها و سولد اوت' },
            { id: 'discounts', label: '🏷️ تعیین و مدیریت کدهای تخفیف' },
            { id: 'complimentary', label: '🎟️ سهمیه بلیت‌های مهمان و تشریفات' },
            { id: 'gate_monitor', label: '🚪 مانیتور زنده گیت ورود سالن' },
            { id: 'settlement', label: '💰 تسویه حساب مالی و شماره شبا' },
            { id: 'attendees', label: '👥 لیست تماشاگران و پیامک گروهی' },
            { id: 'permits', label: '📑 مجوزهای ارشاد و قرارداد سالن' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProducerTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeProducerTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeProducerTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales Chart / Breakdown by Tier */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-500" />
                تفکیک فروش صندلی‌ها بر اساس جایگاه‌های سالن
              </h3>

              <div className="space-y-3 pt-2">
                {currentSalon.parts.map((p) => {
                  const partCapacity = p.rows * p.seatsPerRow;
                  const estimatedSold = Math.min(partCapacity, Math.round((partCapacity * occupancyPercent) / 100));
                  return (
                    <div key={p.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{p.name} ({p.tier.toUpperCase()})</span>
                        <span className="text-slate-400 font-mono">
                          {toPersianDigits(estimatedSold)} از {toPersianDigits(partCapacity)} صندلی
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((estimatedSold / partCapacity) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Ledger Summary */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                صورت‌حساب شفاف مالی رویداد
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">فروش ناخالص بلیت‌های درگاه:</span>
                  <span className="font-mono font-bold text-white">{formatPrice(totalGrossSale)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-rose-400">
                  <span>کسر کارمزد سامانه لیندو تیکت ({toPersianDigits(systemCommissionPercent)}٪):</span>
                  <span className="font-mono font-bold">-{formatPrice(systemCommissionAmount)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-rose-400">
                  <span>کسر مالیات بر ارزش افزوده قانونی ({toPersianDigits(vatTaxPercent)}٪ کارمزد):</span>
                  <span className="font-mono font-bold">-{formatPrice(vatTaxAmount)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-emerald-500/10 px-4 rounded-2xl border border-emerald-500/30">
                  <span className="font-bold text-emerald-400">خالص بستانکاری تهیه‌کننده:</span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    {formatPrice(netPayableToProducer)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveProducerTab('settlement')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  ثبت درخواست تسویه حساب بانکی
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SANSER & SHOWTIMES */}
        {activeProducerTab === 'sanser' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">سانس‌های اجرا و زمان‌بندی (Showtimes)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  کنترل وضعیت فروش هر سانس، افزودن سانس‌های تمدیدی و تنظیم ساعت شروع
                </p>
              </div>

              <button
                onClick={() => setShowAddSansModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف سانس جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeEvent.runTurns.map((turn, idx) => (
                <div
                  key={turn.id}
                  className={`p-5 rounded-3xl border space-y-4 transition-all ${
                    turn.isSoldOut
                      ? isDark
                        ? 'bg-rose-950/20 border-rose-900/50'
                        : 'bg-rose-50/50 border-rose-200'
                      : isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      سانس {toPersianDigits(idx + 1)} · {turn.weekday}
                    </span>
                    <div className="flex items-center gap-2">
                      {turn.isSoldOut ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-500" />
                          سولد اوت
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ظرفیت باز
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-amber-400">{turn.time}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-black">{turn.date}</div>
                    <div className="text-xs text-slate-400 mt-1">سالن: {currentSalon.name}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">ظرفیت موجود:</span>
                    <span className={`font-mono font-bold ${turn.isSoldOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {turn.isSoldOut ? '۰ (تکمیل)' : `${toPersianDigits(turn.availableSeatsCount ?? turn.totalSeatsCount)} از ${toPersianDigits(turn.totalSeatsCount)} صندلی`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleToggleSansSoldOut(turn.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        turn.isSoldOut
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                          : isDark
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                      title={turn.isSoldOut ? 'بازگشایی فروش این سانس' : 'تکمیل ظرفیت (سولد اوت) کردن این سانس'}
                    >
                      <Flame className={`w-3.5 h-3.5 ${turn.isSoldOut ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span>{turn.isSoldOut ? 'لغو سولد اوت' : 'علامت‌گذاری سولد اوت'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DISCOUNT CODES MANAGEMENT (تعیین و مدیریت کدهای تخفیف رویداد) */}
        {activeProducerTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  مدیریت کدهای تخفیف رویداد («{activeEvent?.title}»)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعریف کوپن تخفیف درصدی یا مبلغ ثابت، محدودیت سقف تعداد استفاده، کف خرید و فعال/غیرفعال‌سازی آنی
                </p>
              </div>

              <button
                onClick={() => setShowAddDiscountModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف کد تخفیف جدید</span>
              </button>
            </div>

            {/* Toast for copy */}
            {copiedCodeToast && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>کد تخفیف «{copiedCodeToast}» با موفقیت در کلیپ‌بورد کپی شد.</span>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">کدهای تخفیف فعال این رویداد</div>
                <div className="text-2xl font-mono font-black text-amber-400 mt-2">
                  {toPersianDigits(eventDiscounts.filter((d) => d.isActive !== false).length)} کد
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  از مجموع {toPersianDigits(eventDiscounts.length)} کد تعریف شده
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">مجموع دفعات استفاده خریداران</div>
                <div className="text-2xl font-mono font-black text-indigo-400 mt-2">
                  {toPersianDigits(eventDiscounts.reduce((sum, d) => sum + (d.usedCount || 0), 0))} بار
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  در مرحله پرداخت درگاه بانکی
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">وضعیت اعتبار در گیشه آنلاین</div>
                <div className="text-2xl font-mono font-black text-emerald-400 mt-2">
                  معتبر و فعال
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  اعمال خودکار در سبد خرید مشتری
                </div>
              </div>
            </div>

            {/* Discounts List / Table */}
            <div className={`rounded-3xl border overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              {eventDiscounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  هنوز هیچ کد تخفیفی برای این رویداد تعریف نشده است. جهت ایجاد اولین کد روی دکمه «تعریف کد تخفیف جدید» کلیک کنید.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className={`border-b ${
                      isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <tr>
                        <th className="p-4 font-bold">کد تخفیف</th>
                        <th className="p-4 font-bold">میزان تخفیف</th>
                        <th className="p-4 font-bold">دامنه اعتبار</th>
                        <th className="p-4 font-bold">میزان استفاده / سقف</th>
                        <th className="p-4 font-bold">کف خرید</th>
                        <th className="p-4 font-bold">تاریخ انقضا</th>
                        <th className="p-4 font-bold">وضعیت</th>
                        <th className="p-4 font-bold">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {eventDiscounts.map((disc) => (
                        <tr key={disc.id || disc.code} className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/60'
                        }`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 text-xs">
                                {disc.code}
                              </span>
                              <button
                                onClick={() => handleCopyDiscount(disc.code)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                                title="کپی کد تخفیف"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={disc.description}>
                              {disc.description}
                            </div>
                          </td>
                          <td className="p-4 font-bold">
                            {disc.discountPercent ? (
                              <span className="text-emerald-400 font-mono text-sm">
                                {toPersianDigits(disc.discountPercent)}٪ تخفیف
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-mono text-sm">
                                {formatPrice(disc.fixedAmount || 0)}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              disc.eventId === 'all'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {disc.eventId === 'all' ? 'همه رویدادها' : 'مخصوص این رویداد'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-xs">
                              {toPersianDigits(disc.usedCount || 0)} از {disc.maxUsage ? toPersianDigits(disc.maxUsage) : 'نامحدود'}
                            </div>
                            {disc.maxUsage && (
                              <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, Math.round(((disc.usedCount || 0) / disc.maxUsage) * 100))}%` }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {disc.minOrderAmount ? formatPrice(disc.minOrderAmount) : 'بدون حداقل'}
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {disc.expiresAt || 'همیشگی'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleDiscountActive(disc)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors border ${
                                disc.isActive !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              }`}
                            >
                              {disc.isActive !== false ? '● فعال' : '○ غیرفعال'}
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeleteDiscount(disc.code)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors"
                              title="حذف کد تخفیف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMPLIMENTARY & GUEST TICKETS */}
        {activeProducerTab === 'complimentary' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">سهمیه بلیت‌های مهمان و تشریفات تهیه‌کننده (VIP Guests)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  صدور رایگان بلیت رسمی با بارکد QR برای مهمانان ویژه، داوران و حامیان مالی بدون پرداخت بانکی
                </p>
              </div>

              <button
                onClick={() => setShowCompTicketModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>صدور بلیت مهمان جدید</span>
              </button>
            </div>

            {/* Issued Complimentary Tickets Table */}
            <div className={`rounded-3xl border overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`border-b ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <tr>
                      <th className="p-4 font-bold">شماره بلیت</th>
                      <th className="p-4 font-bold">نام مهمان ویژه</th>
                      <th className="p-4 font-bold">شماره تماس</th>
                      <th className="p-4 font-bold">جایگاه و صندلی</th>
                      <th className="p-4 font-bold">نوع بلیت</th>
                      <th className="p-4 font-bold">وضعیت ورود به سالن</th>
                      <th className="p-4 font-bold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {eventFactors
                      .filter((f) => f.paymentGateway === 'complimentary')
                      .map((f) => (
                        <tr key={f.factorNumber} className="hover:bg-slate-800/30">
                          <td className="p-4 font-mono font-bold text-amber-400">{f.factorNumber}</td>
                          <td className="p-4 font-bold">{f.customerName}</td>
                          <td className="p-4 font-mono text-slate-400">{f.customerMobile}</td>
                          <td className="p-4">
                            {f.seats.map((s) => `${s.partName} ردیف ${s.row} صندلی ${s.number}`).join('، ')}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              سهمیه تهیه‌کننده
                            </span>
                          </td>
                          <td className="p-4">
                            {f.isCheckedIn ? (
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                پذیرش شده
                              </span>
                            ) : (
                              <span className="text-slate-400">هنوز وارد نشده</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setSuccessCompFactor(f)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>چاپ بلیت</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    {eventFactors.filter((f) => f.paymentGateway === 'complimentary').length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          هنوز بلیت مهمانی برای این رویداد صادر نشده است.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE GATE MONITOR */}
        {activeProducerTab === 'gate_monitor' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                مانیتورینگ زنده گیت‌های ورود و کنترل تردد سالن
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاهده برخط آمار تماشاگران حاضر در سالن، سرعت ورود به گیت و بلیت‌های اسکن شده
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={`p-6 rounded-3xl border text-center space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-xs text-slate-400">ورود ثبت‌شده در گیت چکر</div>
                <div className="text-4xl font-black font-mono text-emerald-400">
                  {toPersianDigits(checkedInCount)}
                </div>
                <div className="text-xs text-slate-500">نفر وارد سالن شده‌اند</div>
              </div>

              <div className={`p-6 rounded-3xl border text-center space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-xs text-slate-400">منتظر در صف ورودی</div>
                <div className="text-4xl font-black font-mono text-amber-400">
                  {toPersianDigits(Math.max(0, totalTicketsSold - checkedInCount))}
                </div>
                <div className="text-xs text-slate-500">نفر هنوز اسکن نشده‌اند</div>
              </div>

              <div className={`p-6 rounded-3xl border text-center space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-xs text-slate-400">درصد پرشدگی صندلی‌ها</div>
                <div className="text-4xl font-black font-mono text-indigo-400">
                  {toPersianDigits(totalTicketsSold > 0 ? Math.round((checkedInCount / totalTicketsSold) * 100) : 0)}٪
                </div>
                <div className="text-xs text-slate-500">از کل بلیت‌های فروخته‌شده</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FINANCIAL SETTLEMENT */}
        {activeProducerTab === 'settlement' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold">تسویه حساب مالی و واریز بانکی به حساب تهیه‌کننده</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ثبت شماره شبا، مشاهده مانده بستانکاری و ارسال درخواست تسویه وجوه حاصل از بلیت‌فروشی
              </p>
            </div>

            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">شماره شبای بانکی تهیه‌کننده:</label>
                  <input
                    type="text"
                    value={shebaNumber}
                    onChange={(e) => setShebaNumber(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">نام صاحب حساب و تهیه‌کننده:</label>
                  <input
                    type="text"
                    value={shebaOwner}
                    onChange={(e) => setShebaOwner(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-500">مبلغ قابل تسویه در این مرحله:</div>
                  <div className="text-xl font-black font-mono text-amber-400 mt-1">
                    {formatPrice(netPayableToProducer)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSettlementSuccessMsg(true);
                    setTimeout(() => setSettlementSuccessMsg(false), 5000);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  تایید و ارسال درخواست تسویه فوری
                </button>
              </div>

              {settlementSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    درخواست تسویه با کد رهگیری SETTL-{Date.now().toString().slice(-6)} ثبت شد و حداکثر تا ۲۴ ساعت آینده به شماره شبا واریز خواهد شد.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ATTENDEES & SMS BROADCAST */}
        {activeProducerTab === 'attendees' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">فهرست خریداران و اطلاع‌رسانی پیامکی (SMS Broadcast)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ارسال پیامک انبوه هماهنگی به کلیه تماشاگران این رویداد (اطلاع‌رسانی ساعت، آدرس، تاخیر و...)
                </p>
              </div>
            </div>

            {/* Broadcast Form */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <label className="block text-xs font-bold text-slate-400">متن پیامک ارسالی به خریداران:</label>
              <textarea
                rows={3}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className={`w-full p-3 rounded-2xl border text-xs leading-relaxed ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">
                  گیرندگان: {toPersianDigits(eventFactors.length)} شماره موبایل خریدار
                </span>

                <button
                  onClick={() => {
                    setSmsSentNotice(true);
                    setTimeout(() => setSmsSentNotice(false), 5000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال پیامک به تمام خریداران</span>
                </button>
              </div>

              {smsSentNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>پیامک با موفقیت به صف ارسال مخابرات تحویل داده شد.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: PERMITS & LICENSES */}
        {activeProducerTab === 'permits' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold">مدارک، مجوزهای ارشاد و قرارداد سالن</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                رهگیری مجوز اجرای صحنه‌ای، اماکن فراجا و قرارداد واگذاری تالار
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'مجوز فرهنگ و ارشاد اسلامی', code: 'ERSHAD-1405-882', status: 'تایید شده', date: '۱۴۰۵/۰۷/۱۰' },
                { title: 'مجوز اداره اماکن فراجا', code: 'AMAKEN-7719-TEH', status: 'تایید شده', date: '۱۴۰۵/۰۷/۱۲' },
                { title: 'قرارداد اجاره رسمی سالن', code: 'HALL-CONTR-994', status: 'مبادله شده', date: '۱۴۰۵/۰۷/۰۵' },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border space-y-3 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {doc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold">{doc.title}</h4>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">شماره ثبت: {doc.code}</div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    تاریخ صدور: {doc.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL 1: ISSUE COMPLIMENTARY TICKET
      ========================================================================= */}
      {showCompTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" />
              صدور بلیت مهمان / افتخاری (سهمیه تهیه‌کننده)
            </h3>

            <form onSubmit={handleIssueComplimentary} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">نام و نام خانوادگی مهمان ویژه:</label>
                <input
                  type="text"
                  required
                  value={compGuestName}
                  onChange={(e) => setCompGuestName(e.target.value)}
                  placeholder="مثال: جناب آقای مهندس رضوانی"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">شماره تلفن همراه مهمان:</label>
                <input
                  type="text"
                  required
                  value={compGuestMobile}
                  onChange={(e) => setCompGuestMobile(e.target.value)}
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">جایگاه صندلی:</label>
                  <select
                    value={compSectionName}
                    onChange={(e) => setCompSectionName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {currentSalon.parts.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">تعداد صندلی:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={compCount}
                    onChange={(e) => setCompCount(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">توضیحات و سمت مهمان:</label>
                <input
                  type="text"
                  value={compNotes}
                  onChange={(e) => setCompNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  صدور آنی بلیت مهمان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD SANS / EXTRA SHOWTIME
      ========================================================================= */}
      {showAddSansModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              افزودن سانس فوق‌العاده برای رویداد
            </h3>

            <form onSubmit={handleCreateNewSans} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">سالن برگزاری این سانس (سالن مستقل):</label>
                <select
                  value={newProducerSansSalonId || activeEvent.salonId}
                  onChange={(e) => setNewProducerSansSalonId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {salons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}) - ظرفیت {s.capacity} صندلی
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">تاریخ اجرا (شمسی):</label>
                <input
                  type="text"
                  required
                  value={newSansDate}
                  onChange={(e) => setNewSansDate(e.target.value)}
                  placeholder="۱۴۰۵/۰۸/۲۸"
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">ساعت شروع:</label>
                  <input
                    type="text"
                    required
                    value={newSansTime}
                    onChange={(e) => setNewSansTime(e.target.value)}
                    placeholder="۲۱:۰۰"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">روز هفته:</label>
                  <input
                    type="text"
                    required
                    value={newSansWeekday}
                    onChange={(e) => setNewSansWeekday(e.target.value)}
                    placeholder="جمعه"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Sold Out Checkbox on Sans Creation */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                newSansIsSoldOut ? 'bg-rose-500/10 border-rose-500/30' : isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${newSansIsSoldOut ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs">وضعیت سولد اوت (تکمیل ظرفیت)</div>
                    <div className="text-[10px] text-slate-400">این سانس از ابتدا به صورت تکمیل ظرفیت نمایش داده شود</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newSansIsSoldOut}
                  onChange={(e) => setNewSansIsSoldOut(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSansModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md"
                >
                  ثبت سانس جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CREATE DISCOUNT CODE (تعیین کد تخفیف جدید توسط تهیه‌کننده)
      ========================================================================= */}
      {showAddDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                تعیین کد تخفیف جدید برای رویداد
              </h3>
              <button
                onClick={() => setShowAddDiscountModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscountSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">کد کوپن تخفیف (حروف لاتین یا عدد):</label>
                <input
                  type="text"
                  required
                  value={newDiscCode}
                  onChange={(e) => setNewDiscCode(e.target.value.toUpperCase())}
                  placeholder="مثال: PRODUCER30 یا YALDA"
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold uppercase ${
                    isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">توضیحات و عنوان تخفیف:</label>
                <input
                  type="text"
                  value={newDiscDesc}
                  onChange={(e) => setNewDiscDesc(e.target.value)}
                  placeholder="مثال: تخفیف ویژه تهیه‌کننده برای ۳۰ نفر اول"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">نوع تخفیف:</label>
                  <select
                    value={newDiscType}
                    onChange={(e) => setNewDiscType(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="percent">درصدی (٪)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">
                    {newDiscType === 'percent' ? 'درصد تخفیف (۱ الی ۱۰۰):' : 'مبلغ تخفیف (تومان):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newDiscType === 'percent' ? 100 : 2000000}
                    value={newDiscValue}
                    onChange={(e) => setNewDiscValue(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">دامنه اعمال:</label>
                  <select
                    value={newDiscScope}
                    onChange={(e) => setNewDiscScope(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="event">تنها همین رویداد («{activeEvent?.title.slice(0, 16)}...»)</option>
                    <option value="all">کلیه رویدادهای سامانه</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">سقف مجاز استفاده (تعداد):</label>
                  <input
                    type="number"
                    min="1"
                    value={newDiscMaxUsage}
                    onChange={(e) => setNewDiscMaxUsage(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">کف خرید سبد (تومان):</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newDiscMinOrder}
                    onChange={(e) => setNewDiscMinOrder(Number(e.target.value))}
                    placeholder="۰ = بدون شرط"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">تاریخ انقضا (شمسی):</label>
                  <input
                    type="text"
                    value={newDiscExpiry}
                    onChange={(e) => setNewDiscExpiry(e.target.value)}
                    placeholder="۱۴۰۵/۱۰/۳۰"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDiscountModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  ثبت و فعال‌سازی کد تخفیف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: COMPLIMENTARY TICKET PRINT PREVIEW
      ========================================================================= */}
      {successCompFactor && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                بلیت افتخاری رسمی لیندو تیکت (LinduTicket)
              </span>
              <h3 className="text-base font-black pt-2">{successCompFactor.event.title}</h3>
              <p className="text-xs text-slate-500">{successCompFactor.salon.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">مهمان ویژه:</span>
                <span className="font-bold">{successCompFactor.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شماره پیگیری:</span>
                <span className="font-mono font-bold">{successCompFactor.factorNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاریخ و ساعت:</span>
                <span>{successCompFactor.runTurn.date} - ساعت {successCompFactor.runTurn.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">صندلی‌ها:</span>
                <span className="font-bold text-indigo-600">
                  {successCompFactor.seats.map((s) => `${s.partName} ردیف ${s.row} صندلی ${s.number}`).join(' | ')}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-2xl">
              <QrCode className="w-24 h-24 text-slate-900" />
              <span className="text-[10px] font-mono text-slate-400 mt-1">{successCompFactor.qrPayload}</span>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setSuccessCompFactor(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                بستن
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ بلیت</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
