/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { EventCard } from './components/EventCard';
import { EventDetailsModal } from './components/EventDetailsModal';
import { SeatMapModal } from './components/SeatMapModal';
import { CheckoutModal } from './components/CheckoutModal';
import { TicketSuccessModal } from './components/TicketSuccessModal';
import { TicketChecker } from './components/TicketChecker';
import { AdminDashboard } from './components/AdminDashboard';
import { ProducerDashboard } from './components/ProducerDashboard';
import { VirtualBoxOffice } from './components/VirtualBoxOffice';
import { Footer } from './components/Footer';
import { InfoModal } from './components/InfoModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AccountPanel } from './components/AccountPanel';
import { barnameApi, salonApi } from './services/apiServices';
import { AlertCircle, RotateCcw, Loader2, Sparkles, Layers, X } from 'lucide-react';

import { MOCK_EVENTS, MOCK_SALONS, INITIAL_FACTORS, MOCK_DISCOUNT_CODES } from './data/mockData';
import { ActiveAppMode, EventItem, RunTurn, Salon, Seat, FactorItem, TicketScanCheckResult, DiscountCode } from './types';
import { toPersianDigits } from './utils/formatters';

export default function App() {
  // Theme state: defaults to 'light' per user's request
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gishow_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('gishow_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeMode, setActiveMode] = useState<ActiveAppMode>('portal');
  
  // Core Entities with Server Data Hydration (No fake mock events injected if database is empty)
  const [events, setEvents] = useState<EventItem[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [factors, setFactors] = useState<FactorItem[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  // Server Data Loading States (Requirement 5)
  const [isLoadingServerData, setIsLoadingServerData] = useState<boolean>(true);
  const [serverConnectionError, setServerConnectionError] = useState<string | null>(null);
  const [isDesignPreviewActive, setIsDesignPreviewActive] = useState<boolean>(false);

  // Active entities: strictly real server data by default; sample data only when explicitly toggled in preview
  const activeEvents = isDesignPreviewActive ? MOCK_EVENTS : events;
  const activeSalons = isDesignPreviewActive ? MOCK_SALONS : salons;
  const activeFactors = isDesignPreviewActive ? INITIAL_FACTORS : factors;
  const activeDiscountCodes = isDesignPreviewActive ? MOCK_DISCOUNT_CODES : discountCodes;

  // Load real data from server API endpoints
  const loadDataFromServer = useCallback(async () => {
    setIsLoadingServerData(true);
    setServerConnectionError(null);
    try {
      const [eventsResult, salonsResult] = await Promise.allSettled([
        barnameApi.getEvents(),
        salonApi.getSalons(),
      ]);

      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value || []);
      } else {
        setServerConnectionError(
          eventsResult.reason?.message || 'عدم امکان برقراری ارتباط با وب‌سرویس برنامه‌ها'
        );
      }

      if (salonsResult.status === 'fulfilled') {
        setSalons(salonsResult.value || []);
      }
    } catch (err: any) {
      setServerConnectionError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsLoadingServerData(false);
    }
  }, []);

  useEffect(() => {
    loadDataFromServer();
  }, [loadDataFromServer]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('همه شهرها');
  const [soldOutFilter, setSoldOutFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // Discount Codes Actions
  const handleAddDiscountCode = (newCode: DiscountCode) => {
    setDiscountCodes((prev) => [newCode, ...prev]);
  };

  const handleUpdateDiscountCode = (updated: DiscountCode) => {
    setDiscountCodes((prev) => prev.map((d) => (d.code === updated.code ? updated : d)));
  };

  const handleDeleteDiscountCode = (codeStr: string) => {
    setDiscountCodes((prev) => prev.filter((d) => d.code !== codeStr));
  };

  // Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [eventForDetails, setEventForDetails] = useState<EventItem | null>(null);
  const [seatMapContext, setSeatMapContext] = useState<{
    event: EventItem;
    runTurn: RunTurn;
    salon: Salon;
  } | null>(null);

  const [checkoutContext, setCheckoutContext] = useState<{
    event: EventItem;
    runTurn: RunTurn;
    salon: Salon;
    selectedSeats: Seat[];
  } | null>(null);

  const [successFactor, setSuccessFactor] = useState<FactorItem | null>(null);
  const [infoModalType, setInfoModalType] = useState<
    'guide' | 'rules' | 'about' | 'track' | 'faq' | 'cooperate' | 'secure_payment' | null
  >(null);
  const [checkerInitialCode, setCheckerInitialCode] = useState<string>('');

  const handleTrackSubmit = (query: string) => {
    const clean = query.trim().toUpperCase();
    const found = factors.find(
      (f) =>
        f.factorNumber.toUpperCase() === clean ||
        f.trackingCode.toUpperCase() === clean ||
        f.customerMobile.includes(query.trim())
    );

    if (found) {
      setSuccessFactor(found);
    } else {
      alert('فاکتور یا بلیتی با این مشخصات یافت نشد.');
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return activeEvents.filter((e) => {
      const isSoldOut = !!e.isSoldOut || (e.runTurns?.length > 0 && e.runTurns.every((t) => t.isSoldOut || t.availableSeatsCount === 0));

      const matchSearch = searchQuery.trim() === '' || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchCity = selectedCity === 'همه شهرها' || e.city === selectedCity;

      const matchSoldOut = soldOutFilter === 'all' ||
        (soldOutFilter === 'available' && !isSoldOut) ||
        (soldOutFilter === 'sold_out' && isSoldOut);

      return matchSearch && matchCategory && matchCity && matchSoldOut;
    });
  }, [activeEvents, searchQuery, selectedCategory, selectedCity, soldOutFilter]);

  // Featured Event for Hero Banner
  const featuredEvent = useMemo(() => {
    return activeEvents.find((e) => e.isFeatured) || activeEvents[0];
  }, [activeEvents]);

  // Open Seat Map from details modal (Requirement 5: Salon, address and plan derived from selected sans)
  const handleSelectSans = (event: EventItem, runTurn: RunTurn) => {
    const chosenSalonId = runTurn.salonId || event.salonId;
    const salon = activeSalons.find((s) => s.id === chosenSalonId) || activeSalons[0];
    setEventForDetails(null);
    setSeatMapContext({ event, runTurn, salon });
  };

  // Proceed from Seat Map to Checkout
  const handleProceedToCheckout = (selectedSeats: Seat[]) => {
    if (!seatMapContext) return;
    const { event, runTurn, salon } = seatMapContext;
    setSeatMapContext(null);
    setCheckoutContext({
      event,
      runTurn,
      salon,
      selectedSeats,
    });
  };

  // Payment success handler
  const handlePaymentSuccess = (newFactor: FactorItem) => {
    setFactors((prev) => [newFactor, ...prev]);
    setCheckoutContext(null);
    setSuccessFactor(newFactor);
  };

  // Ticket Checker Check-In Validation
  const handleCheckInTicket = (code: string): TicketScanCheckResult => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '۰' : ''}${now.getMinutes()}`;
    const cleanCode = code.trim().toUpperCase();

    const found = factors.find(
      (f) =>
        f.factorNumber.toUpperCase() === cleanCode ||
        f.trackingCode.toUpperCase() === cleanCode ||
        f.qrPayload.toUpperCase().includes(cleanCode)
    );

    if (!found) {
      return {
        status: 'invalid',
        message: 'بلیت یافت نشد یا شماره بلیت نامعتبر است!',
        timestamp: timeStr,
      };
    }

    if (found.isCheckedIn) {
      return {
        status: 'already_checked',
        factor: found,
        message: 'اخطار: این بلیت قبلاً در گیت پذیرش شده است!',
        timestamp: timeStr,
      };
    }

    // Mark as checked in
    const updatedFactor = {
      ...found,
      isCheckedIn: true,
      checkedInAt: `۱۴۰۵/۰۸/۱۸ - ${timeStr}`,
    };

    setFactors((prev) =>
      prev.map((f) => (f.factorNumber === found.factorNumber ? updatedFactor : f))
    );

    return {
      status: 'valid',
      factor: updatedFactor,
      message: 'بلیت معتبر است. ورود با موفقیت ثبت شد.',
      timestamp: timeStr,
    };
  };

  // Add new event from admin
  const handleAddEvent = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
  };


  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500 selection:text-slate-950 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      
      {/* Universal Header with Theme Switcher */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onTicketTrackClick={() => setInfoModalType('track')}
      />

      {/* Main Body depending on mode */}
      <main className="flex-1">
        {/* Universal Server Status & Loading Banner */}
        {isLoadingServerData && (
          <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-4 py-2 text-xs text-indigo-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>در حال دریافت اطلاعات رویدادها و سالن‌ها از وب‌سرویس سرور...</span>
          </div>
        )}

        {serverConnectionError && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>خطای اتصال به سرور: {serverConnectionError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadDataFromServer}
                className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تلاش دوباره</span>
              </button>
              {!isDesignPreviewActive && (
                <button
                  onClick={() => setIsDesignPreviewActive(true)}
                  className="px-3 py-1 rounded-lg border border-amber-500/40 text-amber-400 font-bold hover:bg-amber-500/10 transition-colors text-[11px] cursor-pointer"
                >
                  فعال‌سازی پیش‌نمایش گرافیکی
                </button>
              )}
            </div>
          </div>
        )}

        {isDesignPreviewActive && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>حالت پیش‌نمایش گرافیکی فعال است (نمایش چیدمان و مؤلفه‌ها با داده‌های نمونه).</span>
            </div>
            <button
              onClick={() => setIsDesignPreviewActive(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer underline"
            >
              خروج و بازگشت به داده واقعی سرور
            </button>
          </div>
        )}
        
        {/* MODE 1: PUBLIC BUYER PORTAL */}
        {activeMode === 'portal' && (
          <div className="space-y-12">
            
            {/* Hero & Category filters */}
            <HeroBanner
              theme={theme}
              featuredEvent={featuredEvent}
              onSelectEvent={(e) => setEventForDetails(e)}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
            />

            {/* Event Cards Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    برنامه‌ها و رویدادهای در حال فروش
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {toPersianDigits(filteredEvents.length)} رویداد در دسته‌بندی انتخابی
                  </p>
                </div>

                {/* Sold Out & Availability Filter */}
                <div className={`flex items-center gap-1 p-1 rounded-2xl border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <button
                    onClick={() => setSoldOutFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      soldOutFilter === 'all'
                        ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    همه رویدادها ({toPersianDigits(activeEvents.length)})
                  </button>

                  <button
                    onClick={() => setSoldOutFilter('available')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      soldOutFilter === 'available'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    دارای بلیت ({toPersianDigits(activeEvents.filter((e) => !e.isSoldOut && !(e.runTurns?.length > 0 && e.runTurns.every((t) => t.isSoldOut || t.availableSeatsCount === 0))).length)})
                  </button>

                  <button
                    onClick={() => setSoldOutFilter('sold_out')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      soldOutFilter === 'sold_out'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    <span>سولد اوت (تکمیل ظرفیت)</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1 rounded font-mono">
                      {toPersianDigits(activeEvents.filter((e) => e.isSoldOut || (e.runTurns?.length > 0 && e.runTurns.every((t) => t.isSoldOut || t.availableSeatsCount === 0))).length)}
                    </span>
                  </button>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className={`py-16 text-center rounded-3xl border space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-xs'
                }`}>
                  <Layers className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                  <div className="text-sm font-bold text-slate-300">
                    {events.length === 0 && !isDesignPreviewActive
                      ? 'هیچ برنامه‌ای در پایگاه‌داده سرور یافت نشد.'
                      : 'رویدادی با معیارهای جستجوی شما یافت نشد.'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {events.length === 0 && !isDesignPreviewActive
                      ? 'پایگاه‌داده خالی است و رویداد ساختگی اضافه نشده است. برای تعریف برنامه و سالن به پنل مدیریت بروید یا پیش‌نمایش گرافیکی را فعال کنید.'
                      : 'می‌توانید فیلترهای جستجو یا شهر را تغییر دهید.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={loadDataFromServer}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بارگذاری مجدد از سرور</span>
                    </button>
                    {!isDesignPreviewActive && (
                      <button
                        onClick={() => setIsDesignPreviewActive(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs text-amber-400 font-bold transition-colors cursor-pointer"
                      >
                        مشاهده پیش‌نمایش طراحی (داده نمونه)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((evt) => (
                    <EventCard
                      key={evt.id}
                      theme={theme}
                      event={evt}
                      onSelect={(e) => setEventForDetails(e)}
                    />
                  ))}
                </div>
              )}

            </section>

          </div>
        )}

        {/* MODE 2: VIRTUAL BOX OFFICE (گیشه مجازی و صدور بلیت حضوری / POS) */}
        {activeMode === 'box-office' && (
          <VirtualBoxOffice
            theme={theme}
            events={activeEvents}
            salons={activeSalons}
            onBackToPortal={() => setActiveMode('portal')}
            onIssueTicket={(newFactor) => {
              setFactors((prev) => [newFactor, ...prev]);
            }}
          />
        )}

        {/* MODE 3: TICKET CHECKER GATE (checker.gishow.ir) */}
        {activeMode === 'checker' && (
          <TicketChecker
            theme={theme}
            factors={activeFactors}
            onCheckInTicket={handleCheckInTicket}
            onBackToPortal={() => setActiveMode('portal')}
            initialCode={checkerInitialCode}
          />
        )}

        {/* MODE 4: DEDICATED PRODUCER CONSOLE (کنسول تهیه‌کننده و مدیر برنامه) */}
        {activeMode === 'producer' && (
          <ProducerDashboard
            theme={theme}
            events={activeEvents}
            salons={activeSalons}
            factors={activeFactors}
            discountCodes={activeDiscountCodes}
            onAddDiscountCode={handleAddDiscountCode}
            onUpdateDiscountCode={handleUpdateDiscountCode}
            onDeleteDiscountCode={handleDeleteDiscountCode}
            onBackToPortal={() => setActiveMode('portal')}
            onUpdateEvent={(updated) => setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
            onIssueComplimentaryTicket={(newFactor) => {
              setFactors((prev) => [newFactor, ...prev]);
            }}
          />
        )}

        {/* MODE 5: ADMIN DASHBOARD (AdminSite) */}
        {activeMode === 'admin' && (
          <AdminDashboard
            theme={theme}
            events={activeEvents}
            factors={activeFactors}
            salons={activeSalons}
            discountCodes={activeDiscountCodes}
            onAddDiscountCode={handleAddDiscountCode}
            onUpdateDiscountCode={handleUpdateDiscountCode}
            onDeleteDiscountCode={handleDeleteDiscountCode}
            onBackToPortal={() => setActiveMode('portal')}
            onAddEvent={handleAddEvent}
            onAddSalon={(newSalon) => setSalons((prev) => [newSalon, ...prev])}
            onUpdateSalon={(updated) => setSalons((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
            onDeleteSalon={(salonId) => setSalons((prev) => prev.filter((s) => s.id !== salonId))}
            onDeleteEvent={(eventId) => setEvents((prev) => prev.filter((e) => e.id !== eventId))}
            onUpdateEvent={(updated) => setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
            onToggleTheme={toggleTheme}
            onOpenBoxOffice={() => setActiveMode('box-office')}
            onOpenProducer={() => setActiveMode('producer')}
          />
        )}

      </main>

      {/* Footer */}
      <Footer
        theme={theme}
        onOpenGuide={() => setInfoModalType('guide')}
        onOpenRules={() => setInfoModalType('rules')}
        onOpenAbout={() => setInfoModalType('about')}
        onOpenFaq={() => setInfoModalType('faq')}
        onOpenCooperate={() => setInfoModalType('cooperate')}
        onOpenSecurePayment={() => setInfoModalType('secure_payment')}
      />

      {/* MODALS */}
      {/* 1. Event Details Modal */}
      {eventForDetails && (
        <EventDetailsModal
          theme={theme}
          event={eventForDetails}
          onClose={() => setEventForDetails(null)}
          onSelectSans={handleSelectSans}
        />
      )}

      {/* 2. Architectural Interactive Seat Map Modal with realistic Chair Icons */}
      {seatMapContext && (
        <SeatMapModal
          theme={theme}
          event={seatMapContext.event}
          runTurn={seatMapContext.runTurn}
          salon={seatMapContext.salon}
          onClose={() => setSeatMapContext(null)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {/* 3. Checkout & Payment Gateway Modal */}
      {checkoutContext && (
        <CheckoutModal
          theme={theme}
          event={checkoutContext.event}
          runTurn={checkoutContext.runTurn}
          salon={checkoutContext.salon}
          selectedSeats={checkoutContext.selectedSeats}
          discountCodes={discountCodes}
          onClose={() => setCheckoutContext(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 4. Digital Ticket with QR Code Modal */}
      {successFactor && (
        <TicketSuccessModal
          theme={theme}
          factor={successFactor}
          onClose={() => setSuccessFactor(null)}
          onGoToChecker={(code) => {
            setSuccessFactor(null);
            setCheckerInitialCode(code);
            setActiveMode('checker');
          }}
        />
      )}

      {/* 5. General Info Modal */}
      <InfoModal
        theme={theme}
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        onTrackSubmit={handleTrackSubmit}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

    </div>
  );
}
