import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Eye,
  ArrowRight,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';
import { EventItem, RunTurn, Salon, Seat, SeatStatus } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { ChairIcon } from './ChairIcon';

interface SeatMapModalProps {
  theme: 'light' | 'dark';
  event: EventItem;
  runTurn: RunTurn;
  salon: Salon;
  onClose: () => void;
  onProceedToCheckout: (selectedSeats: Seat[]) => void;
  // Optional pre-selected seats (useful when called from Box Office)
  initialSelectedSeatIds?: string[];
}

type ViewMode = 'macro_plan' | 'micro_seats';
type SectionKey = 'vip' | 'ground-center' | 'ground-right' | 'ground-left' | 'balcony';

interface SectionMeta {
  key: SectionKey;
  id: string;
  name: string;
  tier: 'vip' | 'ground' | 'balcony';
  subtitle: string;
  viewAngle: string;
  price: number;
  color: string;
  bgLight: string;
  bgDark: string;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  theme,
  event,
  runTurn,
  salon,
  onClose,
  onProceedToCheckout,
  initialSelectedSeatIds = [],
}) => {
  const isDark = theme === 'dark';

  // 2-Step view mode: defaults to 'macro_plan' per user request!
  const [viewMode, setViewMode] = useState<ViewMode>('macro_plan');
  const [selectedSectionKey, setSelectedSectionKey] = useState<SectionKey>('vip');
  const [hoveredMacroSection, setHoveredMacroSection] = useState<SectionKey | null>(null);

  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // 10-minute temporary reservation timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);

  // Section definitions aligned with authentic venue architecture
  const sectionsMeta: Record<SectionKey, SectionMeta> = {
    vip: {
      key: 'vip',
      id: 'part-vip',
      name: 'جایگاه ویژه (VIP)',
      tier: 'vip',
      subtitle: 'ردیف‌های ۱ الی ۳ · دید ۱۰۰٪ مستقیم به سن',
      viewAngle: 'زاویه روبرو بدون زاویه انحراف',
      price: 850000,
      color: 'amber',
      bgLight: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
      bgDark: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    },
    'ground-center': {
      key: 'ground-center',
      id: 'part-ground-center',
      name: 'همکف مرکزی',
      tier: 'ground',
      subtitle: 'ردیف‌های ۴ الی ۱۰ · مرکز سالن',
      viewAngle: 'دید عالی روبروی سن',
      price: 650000,
      color: 'emerald',
      bgLight: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900',
      bgDark: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    },
    'ground-right': {
      key: 'ground-right',
      id: 'part-ground-right',
      name: 'همکف بال راست',
      tier: 'ground',
      subtitle: 'ردیف‌های ۴ الی ۱۰ · سمت راست صحنه',
      viewAngle: 'دید زاویه راست با اشراف کامل',
      price: 550000,
      color: 'teal',
      bgLight: 'bg-teal-500/10 border-teal-500/30 text-teal-900',
      bgDark: 'bg-teal-500/15 border-teal-500/40 text-teal-300',
    },
    'ground-left': {
      key: 'ground-left',
      id: 'part-ground-left',
      name: 'همکف بال چپ',
      tier: 'ground',
      subtitle: 'ردیف‌های ۴ الی ۱۰ · سمت چپ صحنه',
      viewAngle: 'دید زاویه چپ با اشراف کامل',
      price: 550000,
      color: 'teal',
      bgLight: 'bg-teal-500/10 border-teal-500/30 text-teal-900',
      bgDark: 'bg-teal-500/15 border-teal-500/40 text-teal-300',
    },
    balcony: {
      key: 'balcony',
      id: 'part-balcony',
      name: 'بالکن طبقه اول',
      tier: 'balcony',
      subtitle: 'ردیف‌های ۱۱ الی ۱۴ · دید سراسری پانوراما',
      viewAngle: 'دید مرتفع مشرف به کل صحنه',
      price: 380000,
      color: 'indigo',
      bgLight: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900',
      bgDark: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
    },
  };

  // Generate realistic seat matrix for this salon and sans
  const initialSeats = useMemo(() => {
    const list: Seat[] = [];

    // 1. VIP Section (Front curved rows: Rows 1 to 3, 14 seats per row)
    for (let r = 1; r <= 3; r++) {
      for (let s = 1; s <= 14; s++) {
        const hash = (r * 19 + s * 7 + runTurn.id.length * 11) % 100;
        let status: SeatStatus = 'available';
        if (hash < 25) status = 'sold';
        else if (hash < 32) status = 'reserved';

        list.push({
          id: `vip-r${r}-s${s}`,
          partId: 'part-vip',
          partName: 'جایگاه ویژه (VIP)',
          row: r,
          number: s,
          price: 850000,
          status,
        });
      }
    }

    // 2. Ground Floor (Rows 4 to 10):
    // Right Wing: 5 seats
    for (let r = 4; r <= 10; r++) {
      for (let s = 1; s <= 5; s++) {
        const hash = (r * 23 + s * 13 + 41) % 100;
        let status: SeatStatus = 'available';
        if (hash < 30) status = 'sold';
        list.push({
          id: `ground-right-r${r}-s${s}`,
          partId: 'part-ground-right',
          partName: 'همکف بال راست',
          row: r,
          number: s,
          price: 550000,
          status,
        });
      }
      // Center Wing: 8 seats
      for (let s = 6; s <= 13; s++) {
        const hash = (r * 17 + s * 11 + 23) % 100;
        let status: SeatStatus = 'available';
        if (hash < 35) status = 'sold';
        else if (hash < 40) status = 'reserved';
        list.push({
          id: `ground-center-r${r}-s${s}`,
          partId: 'part-ground-center',
          partName: 'همکف مرکزی',
          row: r,
          number: s,
          price: 650000,
          status,
        });
      }
      // Left Wing: 5 seats
      for (let s = 14; s <= 18; s++) {
        const hash = (r * 31 + s * 9 + 59) % 100;
        let status: SeatStatus = 'available';
        if (hash < 28) status = 'sold';
        list.push({
          id: `ground-left-r${r}-s${s}`,
          partId: 'part-ground-left',
          partName: 'همکف بال چپ',
          row: r,
          number: s,
          price: 550000,
          status,
        });
      }
    }

    // 3. Balcony Section (Rows 11 to 14, 16 seats each)
    for (let r = 11; r <= 14; r++) {
      for (let s = 1; s <= 16; s++) {
        const hash = (r * 29 + s * 5 + 73) % 100;
        let status: SeatStatus = 'available';
        if (hash < 22) status = 'sold';
        list.push({
          id: `balcony-r${r}-s${s}`,
          partId: 'part-balcony',
          partName: 'بالکن طبقه اول',
          row: r,
          number: s,
          price: 380000,
          status,
        });
      }
    }

    return list;
  }, [salon, runTurn]);

  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSelectedSeatIds);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Reservation timer
  useEffect(() => {
    if (selectedSeatIds.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedSeatIds([]);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSeatIds.length]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${toPersianDigits(m)}:${s < 10 ? '۰' : ''}${toPersianDigits(s)}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'reserved') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        alert('حداکثر می‌توانید ۸ صندلی را در یک سفارش رزرو نمایید.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  // Helper stats per section for Macro Plan
  const getSectionStats = (partId: string) => {
    const partSeats = seats.filter((s) => s.partId === partId);
    const availableCount = partSeats.filter((s) => s.status === 'available').length;
    const selectedCount = partSeats.filter((s) => selectedSeatIds.includes(s.id)).length;
    const totalCount = partSeats.length;
    const percentAvailable = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;

    return {
      total: totalCount,
      available: availableCount,
      selected: selectedCount,
      percent: percentAvailable,
    };
  };

  // Filter seats for the active micro section view
  const currentSectionSeats = useMemo(() => {
    const targetPartId = sectionsMeta[selectedSectionKey].id;
    return seats.filter((s) => s.partId === targetPartId);
  }, [seats, selectedSectionKey]);

  // Group current section seats by row
  const rowsInSection = useMemo(() => {
    const rowsMap = new Map<number, Seat[]>();
    currentSectionSeats.forEach((seat) => {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, []);
      }
      rowsMap.get(seat.row)!.push(seat);
    });

    return Array.from(rowsMap.entries()).sort(([a], [b]) => a - b);
  }, [currentSectionSeats]);

  const handleSelectSectionFromMacro = (secKey: SectionKey) => {
    setSelectedSectionKey(secKey);
    setViewMode('micro_seats');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className={`relative w-full max-w-6xl rounded-3xl border shadow-2xl flex flex-col max-h-[95vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                {viewMode === 'macro_plan' ? 'پلان کلی معماری سالن' : `انتخاب صندلی: ${sectionsMeta[selectedSectionKey].name}`}
              </h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {salon.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-bold text-slate-200">{event.title}</span>
              <span>·</span>
              <span>سانس: {runTurn.weekday} {runTurn.date} ساعت {runTurn.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher Toggle */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-bold ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('macro_plan')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'macro_plan'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>پلان کل سالن</span>
              </button>

              <button
                onClick={() => setViewMode('micro_seats')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'micro_seats'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>صندلی‌های جایگاه</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inventory Notice Banner (نمایش موجودی صندلی‌ها و ساختار سالن) */}
        <div className={`px-4 py-2.5 text-xs flex items-center justify-between gap-3 border-b shrink-0 ${
          isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              پلان صندلی‌ها در این مرحله جهت نمایش چینش معماری سالن، جایگاه‌ها و وضعیت موجودی است؛ رزرو قطعی و تراکنش بانکی پس از تکمیل اتصال درگاه فعال می‌گردد.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
            نمایش موجودی
          </span>
        </div>

        {/* =========================================================================
            STAGE 1: MACRO ARCHITECTURAL VENUE PLAN (پلان معماری کل سالن)
        ========================================================================= */}
        {viewMode === 'macro_plan' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Architectural Stage Bar at the Top */}
            <div className="relative max-w-3xl mx-auto text-center">
              <div className="h-14 rounded-3xl bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-black tracking-widest text-amber-500 uppercase">
                    سن اجرای زنده / صحنه اصلی (STAGE)
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              {/* Stage Lights Arc */}
              <div className="absolute inset-x-8 -bottom-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 blur-[2px]" />
            </div>

            <p className="text-xs text-center text-slate-400 max-w-xl mx-auto">
              روی هر یک از جایگاه‌ها و بخش‌های نقشه معماری سالن کلیک کنید تا وارد چیدمان صندلی‌های همان بخش شوید:
            </p>

            {/* 2D Architectural Auditorium Floorplan Diagram */}
            <div className={`p-6 rounded-3xl border transition-all max-w-4xl mx-auto ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-sm font-bold">
                    پلان ساختار معماری و چیدمان سالن ({salon.name})
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> جایگاه ویژه VIP
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> همکف مرکزی
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> همکف بال‌ها
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> بالکن
                  </span>
                </div>
              </div>

              {/* Interactive Auditorium SVG */}
              <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 p-2 sm:p-4">
                <svg viewBox="0 0 800 490" className="w-full h-auto select-none">
                  <defs>
                    <radialGradient id="spotlightCone" cx="50%" cy="0%" r="85%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="stageWood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                  </defs>

                  {/* Hall Outer Horseshoe Boundary */}
                  <path
                    d="M 50 80 Q 400 -15 750 80 L 770 460 Q 400 500 30 460 Z"
                    fill="#030712"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                  />

                  {/* Stage Spotlight Projection */}
                  <polygon points="400,30 140,240 660,240" fill="url(#spotlightCone)" pointerEvents="none" />

                  {/* Stage Platform */}
                  <g>
                    <path
                      d="M 200 35 Q 400 70 600 35 L 580 85 Q 400 115 220 85 Z"
                      fill="url(#stageWood)"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    <text x="400" y="65" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="sans-serif">
                      سن اجرای زنده / صحنه اصلی (STAGE)
                    </text>

                    {/* Backstage Speakers & Curtains */}
                    <rect x="155" y="30" width="35" height="48" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                    <text x="172" y="58" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">صوت R</text>
                    
                    <rect x="610" y="30" width="35" height="48" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                    <text x="627" y="58" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">صوت L</text>
                  </g>

                  {/* 1. VIP Sector (Orchestra Front Arc) */}
                  <g
                    onClick={() => handleSelectSectionFromMacro('vip')}
                    onMouseEnter={() => setHoveredMacroSection('vip')}
                    onMouseLeave={() => setHoveredMacroSection(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 225 100 Q 400 135 575 100 L 600 168 Q 400 200 200 168 Z"
                      fill={hoveredMacroSection === 'vip' ? '#78350f' : '#451a03'}
                      stroke={hoveredMacroSection === 'vip' ? '#fbbf24' : '#d97706'}
                      strokeWidth={hoveredMacroSection === 'vip' ? '3.5' : '2'}
                      className="transition-colors"
                    />
                    <text x="400" y="136" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="900">
                      ★ جایگاه ویژه (VIP)
                    </text>
                    <text x="400" y="157" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="bold">
                      {formatPrice(sectionsMeta.vip.price)} · {toPersianDigits(getSectionStats('part-vip').available)} صندلی آزاد (کلیک کنید)
                    </text>
                  </g>

                  {/* Main Aisle between VIP and Ground */}
                  <text x="400" y="190" textAnchor="middle" fill="#64748b" fontSize="10" letterSpacing="2">
                    ─── راهروی اصلی عبور و تردد همکف ───
                  </text>

                  {/* 2. Ground Floor - Right Wing */}
                  <g
                    onClick={() => handleSelectSectionFromMacro('ground-right')}
                    onMouseEnter={() => setHoveredMacroSection('ground-right')}
                    onMouseLeave={() => setHoveredMacroSection(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 105 205 Q 235 220 270 230 L 250 325 Q 95 310 75 295 Z"
                      fill={hoveredMacroSection === 'ground-right' ? '#134e4a' : '#042f2e'}
                      stroke={hoveredMacroSection === 'ground-right' ? '#2dd4bf' : '#0d9488'}
                      strokeWidth={hoveredMacroSection === 'ground-right' ? '3.5' : '2'}
                      className="transition-colors"
                    />
                    <text x="170" y="260" textAnchor="middle" fill="#5eead4" fontSize="13" fontWeight="900">
                      همکف بال راست
                    </text>
                    <text x="170" y="280" textAnchor="middle" fill="#99f6e4" fontSize="10">
                      {formatPrice(sectionsMeta['ground-right'].price)}
                    </text>
                    <text x="170" y="298" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
                      {toPersianDigits(getSectionStats('part-ground-right').available)} صندلی آزاد
                    </text>
                  </g>

                  {/* 3. Ground Floor - Center Floor */}
                  <g
                    onClick={() => handleSelectSectionFromMacro('ground-center')}
                    onMouseEnter={() => setHoveredMacroSection('ground-center')}
                    onMouseLeave={() => setHoveredMacroSection(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 290 230 Q 400 240 510 230 L 500 330 Q 400 348 300 330 Z"
                      fill={hoveredMacroSection === 'ground-center' ? '#064e3b' : '#022c22'}
                      stroke={hoveredMacroSection === 'ground-center' ? '#34d399' : '#059669'}
                      strokeWidth={hoveredMacroSection === 'ground-center' ? '3.5' : '2'}
                      className="transition-colors"
                    />
                    <text x="400" y="270" textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="900">
                      همکف مرکزی (دید مستقیم به سن)
                    </text>
                    <text x="400" y="292" textAnchor="middle" fill="#a7f3d0" fontSize="11">
                      {formatPrice(sectionsMeta['ground-center'].price)}
                    </text>
                    <text x="400" y="312" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
                      {toPersianDigits(getSectionStats('part-ground-center').available)} صندلی آزاد (کلیک کنید)
                    </text>
                  </g>

                  {/* 4. Ground Floor - Left Wing */}
                  <g
                    onClick={() => handleSelectSectionFromMacro('ground-left')}
                    onMouseEnter={() => setHoveredMacroSection('ground-left')}
                    onMouseLeave={() => setHoveredMacroSection(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 530 230 Q 565 220 695 205 L 725 295 Q 705 310 550 325 Z"
                      fill={hoveredMacroSection === 'ground-left' ? '#134e4a' : '#042f2e'}
                      stroke={hoveredMacroSection === 'ground-left' ? '#2dd4bf' : '#0d9488'}
                      strokeWidth={hoveredMacroSection === 'ground-left' ? '3.5' : '2'}
                      className="transition-colors"
                    />
                    <text x="630" y="260" textAnchor="middle" fill="#5eead4" fontSize="13" fontWeight="900">
                      همکف بال چپ
                    </text>
                    <text x="630" y="280" textAnchor="middle" fill="#99f6e4" fontSize="10">
                      {formatPrice(sectionsMeta['ground-left'].price)}
                    </text>
                    <text x="630" y="298" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
                      {toPersianDigits(getSectionStats('part-ground-left').available)} صندلی آزاد
                    </text>
                  </g>

                  {/* Sound & Lighting Control Booth */}
                  <g>
                    <rect x="340" y="342" width="120" height="24" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                    <text x="400" y="358" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                      اتاق فرمان و صدابرداری سالن
                    </text>
                  </g>

                  {/* Balcony Access Stairs */}
                  <g>
                    <text x="50" y="380" textAnchor="middle" fill="#64748b" fontSize="10">پله بالکن ↑</text>
                    <text x="750" y="380" textAnchor="middle" fill="#64748b" fontSize="10">↑ پله بالکن</text>
                  </g>

                  {/* 5. Balcony Tier (Elevated Back Auditorium) */}
                  <g
                    onClick={() => handleSelectSectionFromMacro('balcony')}
                    onMouseEnter={() => setHoveredMacroSection('balcony')}
                    onMouseLeave={() => setHoveredMacroSection(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 65 390 Q 400 412 735 390 L 755 458 Q 400 488 45 458 Z"
                      fill={hoveredMacroSection === 'balcony' ? '#312e81' : '#1e1b4b'}
                      stroke={hoveredMacroSection === 'balcony' ? '#818cf8' : '#4f46e5'}
                      strokeWidth={hoveredMacroSection === 'balcony' ? '3.5' : '2'}
                      className="transition-colors"
                    />
                    <text x="400" y="420" textAnchor="middle" fill="#a5b4fc" fontSize="14" fontWeight="900">
                      بالکن طبقه اول (دید سراسری و پانوراما)
                    </text>
                    <text x="400" y="442" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="bold">
                      {formatPrice(sectionsMeta.balcony.price)} · {toPersianDigits(getSectionStats('part-balcony').available)} صندلی آزاد (کلیک کنید)
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Interactive Auditorium Floorplan Blocks */}
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Level 1: VIP Front Section (Closest to Stage) */}
              {(() => {
                const stats = getSectionStats('part-vip');
                const meta = sectionsMeta.vip;
                return (
                  <div
                    onClick={() => handleSelectSectionFromMacro('vip')}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
                      isDark
                        ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-500/5'
                        : 'bg-gradient-to-b from-amber-50 to-white border-amber-300 hover:border-amber-500 shadow-md'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                          <h3 className="text-base font-black text-amber-500">{meta.name}</h3>
                          <span className="text-xs text-slate-400">({meta.subtitle})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{meta.viewAngle}</p>
                      </div>

                      <div className="flex items-center gap-4 text-left">
                        <div>
                          <div className="text-lg font-black font-mono text-amber-500">{formatPrice(meta.price)}</div>
                          <div className="text-[11px] text-slate-400">
                            {toPersianDigits(stats.available)} صندلی آزاد از {toPersianDigits(stats.total)}
                          </div>
                        </div>

                        {stats.selected > 0 && (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black">
                            {toPersianDigits(stats.selected)} انتخابی
                          </span>
                        )}

                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Level 2: Ground Floor (3 Columns: Right, Center, Left) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Right Wing */}
                {(() => {
                  const stats = getSectionStats('part-ground-right');
                  const meta = sectionsMeta['ground-right'];
                  return (
                    <div
                      onClick={() => handleSelectSectionFromMacro('ground-right')}
                      className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative group hover:scale-[1.01] ${
                        isDark
                          ? 'bg-slate-900 border-teal-500/30 hover:border-teal-400'
                          : 'bg-white border-teal-200 hover:border-teal-500 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-teal-500">{meta.name}</h4>
                          <span className="text-xs font-mono font-bold text-teal-400">{formatPrice(meta.price)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{meta.subtitle}</p>
                        <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span>{toPersianDigits(stats.available)} صندلی آزاد</span>
                          {stats.selected > 0 && (
                            <span className="text-amber-500 font-bold">{toPersianDigits(stats.selected)} انتخاب شده</span>
                          )}
                          <ChevronLeft className="w-4 h-4 text-teal-500 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Center Floor */}
                {(() => {
                  const stats = getSectionStats('part-ground-center');
                  const meta = sectionsMeta['ground-center'];
                  return (
                    <div
                      onClick={() => handleSelectSectionFromMacro('ground-center')}
                      className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative group hover:scale-[1.01] ${
                        isDark
                          ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-400 shadow-md'
                          : 'bg-white border-emerald-300 hover:border-emerald-500 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-emerald-500">{meta.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-400">{formatPrice(meta.price)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{meta.subtitle}</p>
                        <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span>{toPersianDigits(stats.available)} صندلی آزاد</span>
                          {stats.selected > 0 && (
                            <span className="text-amber-500 font-bold">{toPersianDigits(stats.selected)} انتخاب شده</span>
                          )}
                          <ChevronLeft className="w-4 h-4 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Left Wing */}
                {(() => {
                  const stats = getSectionStats('part-ground-left');
                  const meta = sectionsMeta['ground-left'];
                  return (
                    <div
                      onClick={() => handleSelectSectionFromMacro('ground-left')}
                      className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative group hover:scale-[1.01] ${
                        isDark
                          ? 'bg-slate-900 border-teal-500/30 hover:border-teal-400'
                          : 'bg-white border-teal-200 hover:border-teal-500 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-teal-500">{meta.name}</h4>
                          <span className="text-xs font-mono font-bold text-teal-400">{formatPrice(meta.price)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{meta.subtitle}</p>
                        <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span>{toPersianDigits(stats.available)} صندلی آزاد</span>
                          {stats.selected > 0 && (
                            <span className="text-amber-500 font-bold">{toPersianDigits(stats.selected)} انتخاب شده</span>
                          )}
                          <ChevronLeft className="w-4 h-4 text-teal-500 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Level 3: Balcony Tier (Elevated Back Auditorium) */}
              {(() => {
                const stats = getSectionStats('part-balcony');
                const meta = sectionsMeta.balcony;
                return (
                  <div
                    onClick={() => handleSelectSectionFromMacro('balcony')}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
                      isDark
                        ? 'bg-gradient-to-t from-indigo-950/30 to-slate-900 border-indigo-500/30 hover:border-indigo-400'
                        : 'bg-gradient-to-t from-indigo-50 to-white border-indigo-200 hover:border-indigo-500 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-indigo-400">{meta.name}</h3>
                          <span className="text-xs text-slate-400">({meta.subtitle})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{meta.viewAngle}</p>
                      </div>

                      <div className="flex items-center gap-4 text-left">
                        <div>
                          <div className="text-lg font-black font-mono text-indigo-400">{formatPrice(meta.price)}</div>
                          <div className="text-[11px] text-slate-400">
                            {toPersianDigits(stats.available)} صندلی آزاد از {toPersianDigits(stats.total)}
                          </div>
                        </div>

                        {stats.selected > 0 && (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black">
                            {toPersianDigits(stats.selected)} انتخابی
                          </span>
                        )}

                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        )}

        {/* =========================================================================
            STAGE 2: MICRO SECTION SEAT VIEW (نمای صندلی‌های جایگاه انتخابی)
        ========================================================================= */}
        {viewMode === 'micro_seats' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Section Breadcrumb & Section Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setViewMode('macro_plan')}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-bold cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به پلان کلی سالن</span>
                </button>
                <span className="text-slate-500">/</span>
                <span className="font-bold text-slate-200">{sectionsMeta[selectedSectionKey].name}</span>
              </div>

              {/* Quick Section Switcher Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {(Object.keys(sectionsMeta) as SectionKey[]).map((key) => {
                  const m = sectionsMeta[key];
                  const isCurrent = selectedSectionKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSectionKey(key)}
                      className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-[11px] font-bold ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Architectural Hall Mini-Map Locator & Stage Orientation */}
            <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              {/* Mini-Map Radar SVG */}
              <div className="flex items-center gap-3.5">
                <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-950 p-1 border border-slate-800 shrink-0">
                  <svg viewBox="0 0 800 490" className="w-full h-full select-none">
                    {/* Outer hall */}
                    <path d="M 50 80 Q 400 -15 750 80 L 770 460 Q 400 500 30 460 Z" fill="#030712" stroke="#334155" strokeWidth="6" />
                    {/* Stage */}
                    <path d="M 200 35 Q 400 70 600 35 L 580 85 Q 400 115 220 85 Z" fill="#b45309" />
                    {/* VIP */}
                    <path
                      d="M 225 100 Q 400 135 575 100 L 600 168 Q 400 200 200 168 Z"
                      fill={selectedSectionKey === 'vip' ? '#f59e0b' : '#334155'}
                      stroke={selectedSectionKey === 'vip' ? '#fbbf24' : 'none'}
                      strokeWidth={selectedSectionKey === 'vip' ? '8' : '0'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSectionKey('vip')}
                    />
                    {/* Right Wing */}
                    <path
                      d="M 105 205 Q 235 220 270 230 L 250 325 Q 95 310 75 295 Z"
                      fill={selectedSectionKey === 'ground-right' ? '#14b8a6' : '#334155'}
                      stroke={selectedSectionKey === 'ground-right' ? '#2dd4bf' : 'none'}
                      strokeWidth={selectedSectionKey === 'ground-right' ? '8' : '0'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSectionKey('ground-right')}
                    />
                    {/* Center */}
                    <path
                      d="M 290 230 Q 400 240 510 230 L 500 330 Q 400 348 300 330 Z"
                      fill={selectedSectionKey === 'ground-center' ? '#10b981' : '#334155'}
                      stroke={selectedSectionKey === 'ground-center' ? '#34d399' : 'none'}
                      strokeWidth={selectedSectionKey === 'ground-center' ? '8' : '0'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSectionKey('ground-center')}
                    />
                    {/* Left Wing */}
                    <path
                      d="M 530 230 Q 565 220 695 205 L 725 295 Q 705 310 550 325 Z"
                      fill={selectedSectionKey === 'ground-left' ? '#14b8a6' : '#334155'}
                      stroke={selectedSectionKey === 'ground-left' ? '#2dd4bf' : 'none'}
                      strokeWidth={selectedSectionKey === 'ground-left' ? '8' : '0'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSectionKey('ground-left')}
                    />
                    {/* Balcony */}
                    <path
                      d="M 65 390 Q 400 412 735 390 L 755 458 Q 400 488 45 458 Z"
                      fill={selectedSectionKey === 'balcony' ? '#6366f1' : '#334155'}
                      stroke={selectedSectionKey === 'balcony' ? '#818cf8' : 'none'}
                      strokeWidth={selectedSectionKey === 'balcony' ? '8' : '0'}
                      className="cursor-pointer"
                      onClick={() => setSelectedSectionKey('balcony')}
                    />
                  </svg>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>موقعیت شما روی پلان سالن:</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">
                    {sectionsMeta[selectedSectionKey].name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {sectionsMeta[selectedSectionKey].viewAngle} · قیمت بلیت: <span className="font-bold text-emerald-400 font-mono">{formatPrice(sectionsMeta[selectedSectionKey].price)}</span>
                  </p>
                </div>
              </div>

              {/* Stage Direction Indicator */}
              <div className="py-2 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>جهت صحنه اجرا و سن (STAGE) رو به بالا است ↑</span>
              </div>
            </div>

            {/* Seat Grid Rows */}
            <div className="space-y-4 max-w-4xl mx-auto py-2">
              {rowsInSection.map(([rowNum, rowSeats]) => (
                <div key={rowNum} className="flex items-center justify-center gap-2 sm:gap-3">
                  
                  {/* Row Indicator Right */}
                  <span className="w-12 text-left font-mono font-bold text-xs text-slate-400 shrink-0">
                    ردیف {toPersianDigits(rowNum)}
                  </span>

                  {/* Seats in row */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const currentStatus: SeatStatus = isSelected ? 'selected' : seat.status;

                      return (
                        <div
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className="cursor-pointer transition-transform"
                          title={`ردیف ${seat.row} صندلی ${seat.number} - ${formatPrice(seat.price)}`}
                        >
                          <ChairIcon
                            status={currentStatus}
                            seatNumber={seat.number}
                            isDark={isDark}
                            className="w-7 h-7 sm:w-8 sm:h-8"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Row Indicator Left */}
                  <span className="w-8 text-right font-mono text-xs text-slate-500 shrink-0 hidden sm:inline">
                    ر{toPersianDigits(rowNum)}
                  </span>
                </div>
              ))}
            </div>

            {/* Hovered Seat Info Pill */}
            {hoveredSeat && (
              <div className="text-center text-xs text-slate-400">
                مشخصات صندلی انتخابی: <strong className="text-amber-400">{hoveredSeat.partName}</strong> · ردیف <strong className="text-white">{toPersianDigits(hoveredSeat.row)}</strong> · شماره <strong className="text-white">{toPersianDigits(hoveredSeat.number)}</strong> · قیمت: <strong className="text-emerald-400">{formatPrice(hoveredSeat.price)}</strong>
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            BOTTOM BAR: SUMMARY, TIMER & CHECKOUT ACTION
        ========================================================================= */}
        <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
        }`}>
          
          {/* Left / Center Summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {selectedSeatIds.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">صندلی‌های انتخابی ({toPersianDigits(selectedSeatIds.length)} مورد):</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-500 font-mono">
                    {selectedSeats.map((s) => `ر${s.row}ش${s.number}`).join('، ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-r pr-4 border-slate-700">
                  <span className="text-slate-400">مجموع مبلغ:</span>
                  <span className="text-base font-black text-emerald-500 font-mono">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-rose-500 font-bold border-r pr-4 border-slate-700">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>مهلت پرداخت: {formatTime(timeLeftSeconds)}</span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500" />
                <span>هنوز صندلی‌ای انتخاب نشده است. از روی پلان سالن، بخش و صندلی دلخواه خود را تعیین کنید.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {viewMode === 'micro_seats' && (
              <button
                onClick={() => setViewMode('macro_plan')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                مشاهده کل پلان
              </button>
            )}

            <button
              disabled={selectedSeatIds.length === 0}
              onClick={() => onProceedToCheckout(selectedSeats)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                selectedSeatIds.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>تکمیل خرید و پرداخت</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
