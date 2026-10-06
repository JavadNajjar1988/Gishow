import React, { useState } from 'react';
import { Salon, PartOfSalon } from '../types';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import { 
  Building, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Layout, 
  Layers, 
  Check, 
  Sparkles, 
  Sliders, 
  Compass, 
  DollarSign, 
  Users, 
  Armchair, 
  Info,
  Maximize2
} from 'lucide-react';

interface SalonPlanBuilderModalProps {
  theme: 'light' | 'dark';
  initialSalon?: Salon | null;
  onClose: () => void;
  onSaveSalon: (salon: Salon) => void;
}

// Pre-defined Architectural Templates
const TEMPLATES = [
  {
    id: 'theater',
    name: 'سالن تئاتر و کنسرت استاندارد',
    description: 'سن قوسی، همکف ۳ بخشی (مرکز، چپ، راست)، جایگاه ویژه VIP و بالکن',
    parts: [
      { name: 'جایگاه ویژه VIP', tier: 'vip' as const, rows: 4, seatsPerRow: 14, price: 950000, shape: 'arc' as const },
      { name: 'همکف مرکزی', tier: 'ground' as const, rows: 8, seatsPerRow: 18, price: 650000, shape: 'arc' as const },
      { name: 'همکف جناح راست', tier: 'ground' as const, rows: 7, seatsPerRow: 10, price: 500000, shape: 'angled_right' as const },
      { name: 'همکف جناح چپ', tier: 'ground' as const, rows: 7, seatsPerRow: 10, price: 500000, shape: 'angled_left' as const },
      { name: 'بالکن طبقه اول', tier: 'balcony' as const, rows: 6, seatsPerRow: 20, price: 380000, shape: 'straight' as const },
    ]
  },
  {
    id: 'arena',
    name: 'تالار همایش‌های بزرگ (آرنا)',
    description: 'سالن چندمنظوره با لژ تشریفات، دو طبقه بالکن و ظرفیت بالا',
    parts: [
      { name: 'جایگاه VIP ردیف اول', tier: 'vip' as const, rows: 5, seatsPerRow: 16, price: 1200000, shape: 'arc' as const },
      { name: 'همکف سالن اصلی', tier: 'ground' as const, rows: 12, seatsPerRow: 22, price: 750000, shape: 'arc' as const },
      { name: 'لژهای اختصاصی', tier: 'lodge' as const, rows: 3, seatsPerRow: 8, price: 1400000, shape: 'straight' as const },
      { name: 'بالکن طبقه اول', tier: 'balcony' as const, rows: 6, seatsPerRow: 24, price: 450000, shape: 'straight' as const },
      { name: 'بالکن طبقه دوم', tier: 'balcony' as const, rows: 5, seatsPerRow: 24, price: 320000, shape: 'straight' as const },
    ]
  },
  {
    id: 'cinema',
    name: 'سینما و آمفی‌تئاتر شیب‌دار',
    description: 'پلان مستطیل شیب‌دار یکپارچه به همراه صندلی‌های ویژه ویلچر و توان‌یابان',
    parts: [
      { name: 'ردیف‌های طلایی جلو', tier: 'vip' as const, rows: 3, seatsPerRow: 18, price: 800000, shape: 'straight' as const },
      { name: 'همکف سالن شیب‌دار', tier: 'ground' as const, rows: 10, seatsPerRow: 20, price: 550000, shape: 'straight' as const },
      { name: 'جایگاه توان‌یابان و همراه', tier: 'ground' as const, rows: 1, seatsPerRow: 6, price: 300000, shape: 'straight' as const, isAccessible: true },
      { name: 'لژ خانوادگی انتهای سالن', tier: 'lodge' as const, rows: 2, seatsPerRow: 12, price: 700000, shape: 'straight' as const },
    ]
  }
];

export const SalonPlanBuilderModal: React.FC<SalonPlanBuilderModalProps> = ({
  theme,
  initialSalon,
  onClose,
  onSaveSalon,
}) => {
  const isDark = theme === 'dark';

  // Basic Details
  const [salonName, setSalonName] = useState(initialSalon?.name || '');
  const [salonCity, setSalonCity] = useState(initialSalon?.city || 'مشهد مقدس');
  const [salonAddress, setSalonAddress] = useState(initialSalon?.address || '');

  // Sections (Parts)
  const [parts, setParts] = useState<PartOfSalon[]>(() => {
    if (initialSalon && initialSalon.parts && initialSalon.parts.length > 0) {
      return initialSalon.parts;
    }
    // Default template: Theater
    return TEMPLATES[0].parts.map((p, idx) => ({
      id: `part-${Date.now()}-${idx}`,
      salonId: 'temp',
      name: p.name,
      tier: p.tier,
      rows: p.rows,
      seatsPerRow: p.seatsPerRow,
      price: p.price,
      shape: p.shape,
      isAccessible: (p as any).isAccessible || false,
    }));
  });

  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [canvasViewMode, setCanvasViewMode] = useState<'macro_plan' | 'chairs_detail'>('macro_plan');
  const [hoveredCanvasSection, setHoveredCanvasSection] = useState<number | null>(null);

  // Capacity calculations
  const totalCapacity = parts.reduce((acc, p) => acc + (p.rows * p.seatsPerRow), 0);
  const potentialGrossRevenue = parts.reduce((acc, p) => acc + (p.rows * p.seatsPerRow * p.price), 0);

  // Apply a template
  const handleApplyTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setParts(
      tpl.parts.map((p, idx) => ({
        id: `part-${Date.now()}-${idx}`,
        salonId: initialSalon?.id || 'temp',
        name: p.name,
        tier: p.tier,
        rows: p.rows,
        seatsPerRow: p.seatsPerRow,
        price: p.price,
        shape: p.shape,
        isAccessible: (p as any).isAccessible || false,
      }))
    );
    setActivePartIndex(0);
  };

  // Add new Section
  const handleAddNewSection = () => {
    const newPart: PartOfSalon = {
      id: `part-${Date.now()}`,
      salonId: initialSalon?.id || 'temp',
      name: `جایگاه جدید ${parts.length + 1}`,
      tier: 'ground',
      rows: 5,
      seatsPerRow: 12,
      price: 500000,
      shape: 'straight',
    };
    setParts([...parts, newPart]);
    setActivePartIndex(parts.length);
  };

  // Remove section
  const handleRemoveSection = (idx: number) => {
    if (parts.length <= 1) {
      alert('حداقل یک جایگاه باید در سالن تعریف شده باشد.');
      return;
    }
    const updated = parts.filter((_, i) => i !== idx);
    setParts(updated);
    if (activePartIndex >= updated.length) {
      setActivePartIndex(updated.length - 1);
    }
  };

  // Update field of active part
  const updatePartField = <K extends keyof PartOfSalon>(key: K, value: PartOfSalon[K]) => {
    const updated = [...parts];
    updated[activePartIndex] = {
      ...updated[activePartIndex],
      [key]: value,
    };
    setParts(updated);
  };

  // Save Salon
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) {
      alert('لطفاً نام سالن را وارد کنید.');
      return;
    }
    if (parts.length === 0) {
      alert('حداقل یک بخش صندلی برای سالن الزامی است.');
      return;
    }

    const salonId = initialSalon?.id || `salon-${Date.now()}`;
    const finalizedParts: PartOfSalon[] = parts.map((p) => ({
      ...p,
      salonId,
    }));

    const newSalon: Salon = {
      id: salonId,
      name: salonName.trim(),
      city: salonCity.trim(),
      address: salonAddress.trim() || 'آدرس ثبت‌نشده',
      capacity: totalCapacity,
      parts: finalizedParts,
      layoutTemplate: 'theater',
      stagePosition: 'top',
    };

    onSaveSalon(newSalon);
    onClose();
  };

  const activePart = parts[activePartIndex] || parts[0];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip':
        return {
          fill: '#f59e0b',
          stroke: '#d97706',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          badge: 'bg-amber-500 text-slate-950',
          label: 'ویژه VIP',
        };
      case 'ground':
        return {
          fill: '#10b981',
          stroke: '#059669',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
          badge: 'bg-emerald-500 text-white',
          label: 'همکف',
        };
      case 'balcony':
        return {
          fill: '#6366f1',
          stroke: '#4f46e5',
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          badge: 'bg-indigo-500 text-white',
          label: 'بالکن',
        };
      case 'lodge':
        return {
          fill: '#ec4899',
          stroke: '#db2777',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
          badge: 'bg-rose-500 text-white',
          label: 'لژ اختصاصی',
        };
      default:
        return {
          fill: '#64748b',
          stroke: '#475569',
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          badge: 'bg-slate-500 text-white',
          label: 'عادی',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`max-w-6xl w-full border rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-4 flex flex-col max-h-[96vh] overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">
                  {initialSalon ? 'ویرایش و بازطراحی پلان سالن' : 'سازنده و طراح پلان معماری سالن'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  نسخه تعاملی ساخت پلان
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                طراحی بصری جایگاه‌ها، انحنای ردیف‌ها، ظرفیت صندلی‌ها و شبیه‌سازی پلان خرید مشتری
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Info Inputs & Template Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-400">نام سالن یا تالار:</label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="مثال: مرکز همایش‌های بین‌المللی برج میلاد"
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-400">شهر:</label>
              <input
                type="text"
                value={salonCity}
                onChange={(e) => setSalonCity(e.target.value)}
                placeholder="مشهد، تهران و..."
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-400">آدرس دقیق سالن:</label>
              <input
                type="text"
                value={salonAddress}
                onChange={(e) => setSalonAddress(e.target.value)}
                placeholder="خیابان، میدان، پلاک..."
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Preset Architectural Templates */}
          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-bold">
              <span>الگوهای معماری آماده:</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                    isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                  title={tpl.description}
                >
                  {tpl.name.split(' ')[0]} {tpl.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Body: Canvas on Right/Left + Inspector on other side */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
          
          {/* LEFT/MAIN: Interactive 2D Architectural Plan Canvas */}
          <div className="lg:col-span-7 flex flex-col min-h-0 border rounded-3xl overflow-hidden relative shadow-inner bg-slate-950 border-slate-800">
            
            {/* Canvas Toolbar */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 text-xs z-10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  نقشه دوبعدی هندسه سالن (2D Floor Plan)
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {toPersianDigits(parts.length)} بخش تعریف شده
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('macro_plan')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    canvasViewMode === 'macro_plan'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  بخش‌های کلی
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('chairs_detail')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    canvasViewMode === 'chairs_detail'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  شبیه‌ساز صندلی‌ها
                </button>
              </div>
            </div>

            {/* Visual SVG Plan Viewport */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start space-y-4 relative select-none">
              
              {/* STAGE (سن اجرای زنده) */}
              <div className="w-full max-w-md mx-auto pt-2">
                <div className="relative py-3 px-8 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-2 border-amber-500/40 text-center shadow-lg shadow-amber-500/10">
                  <div className="text-amber-400 font-black text-xs tracking-wider flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    سن اصلی اجرای برنامه / صحنه تالار (STAGE)
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  </div>
                  <div className="text-[9px] text-amber-500/70 mt-0.5">
                    خط دید مستقیم تماشاگران رو به صحنه
                  </div>

                  {/* Stage Lighting / Microphone Indicators */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-3 text-[8px] text-amber-500/60 bg-slate-950 px-3 py-0.5 rounded-full border border-amber-500/30">
                    🎤 میکروفن و مانیتور صدا
                  </div>
                </div>
              </div>

              {/* Sections Display */}
              {canvasViewMode === 'macro_plan' ? (
                /* MACRO PLAN: Interactive architectural layout blocks */
                <div className="w-full max-w-lg space-y-3 pt-3">
                  {parts.map((part, idx) => {
                    const isSelected = activePartIndex === idx;
                    const isHovered = hoveredCanvasSection === idx;
                    const tierStyle = getTierColor(part.tier);

                    // Visual shape representation
                    let shapeBadge = 'مستقیم';
                    let shapeRoundClass = 'rounded-2xl';
                    if (part.shape === 'arc') {
                      shapeBadge = 'هلالی قوسی';
                      shapeRoundClass = 'rounded-[2rem] border-t-4';
                    } else if (part.shape === 'angled_left') {
                      shapeBadge = 'زاویه‌دار چپ';
                      shapeRoundClass = 'rounded-2xl -skew-x-2';
                    } else if (part.shape === 'angled_right') {
                      shapeBadge = 'زاویه‌دار راست';
                      shapeRoundClass = 'rounded-2xl skew-x-2';
                    }

                    return (
                      <div
                        key={part.id || idx}
                        onClick={() => setActivePartIndex(idx)}
                        onMouseEnter={() => setHoveredCanvasSection(idx)}
                        onMouseLeave={() => setHoveredCanvasSection(null)}
                        className={`p-3.5 transition-all cursor-pointer border-2 relative ${shapeRoundClass} ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/30'
                            : isHovered
                            ? 'bg-slate-900/90 border-slate-600'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full shrink-0`} style={{ backgroundColor: tierStyle.fill }} />
                            <div>
                              <div className="font-bold text-xs text-white flex items-center gap-2">
                                <span>{part.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${tierStyle.badge}`}>
                                  {tierStyle.label}
                                </span>
                                {part.isAccessible && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    ♿ ویلچر
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                هندسه: {shapeBadge} · {toPersianDigits(part.rows)} ردیف × {toPersianDigits(part.seatsPerRow)} صندلی
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="font-mono font-black text-amber-400 text-xs">
                              {formatPrice(part.price)}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              ظرفیت {toPersianDigits(part.rows * part.seatsPerRow)} صندلی
                            </div>
                          </div>
                        </div>

                        {/* Visual Row lines mini bar */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
                          <div className="flex items-center gap-1 overflow-x-auto">
                            {Array.from({ length: Math.min(part.rows, 8) }).map((_, r) => (
                              <div
                                key={r}
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${Math.max(12, 30 - r * 1.5)}px`,
                                  backgroundColor: tierStyle.fill,
                                  opacity: 0.35 + (r / 10),
                                }}
                              />
                            ))}
                            {part.rows > 8 && <span className="text-[8px] text-slate-500">+{part.rows - 8}</span>}
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            ردیف ۱ تا {toPersianDigits(part.rows)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* CHAIRS DETAIL VIEW: Realistic chair grid simulation */
                <div className="w-full max-w-lg space-y-4 pt-2">
                  <div className="text-[11px] text-slate-400 text-center">
                    چیدمان صندلی‌های جایگاه فعال ({activePart.name}):
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 max-h-[340px] overflow-y-auto">
                    {Array.from({ length: Math.min(activePart.rows, 10) }).map((_, rIdx) => (
                      <div key={rIdx} className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px]">
                        <span className="w-6 font-mono text-[9px] text-slate-500 text-right shrink-0">
                          ر{toPersianDigits(rIdx + 1)}
                        </span>
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                          {Array.from({ length: Math.min(activePart.seatsPerRow, 20) }).map((_, sIdx) => (
                            <div
                              key={sIdx}
                              className="w-4 h-4 rounded-sm flex items-center justify-center font-mono text-[8px] font-bold border transition-transform hover:scale-125"
                              style={{
                                backgroundColor: `${getTierColor(activePart.tier).fill}22`,
                                borderColor: getTierColor(activePart.tier).fill,
                                color: getTierColor(activePart.tier).fill,
                              }}
                              title={`ردیف ${rIdx + 1} صندلی ${sIdx + 1}`}
                            >
                              {toPersianDigits(sIdx + 1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {activePart.rows > 10 && (
                      <div className="text-center text-[10px] text-slate-500 pt-1">
                        ... و {toPersianDigits(activePart.rows - 10)} ردیف دیگر با همین ساختار
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sound & Light Booth at back */}
              <div className="w-full max-w-xs mx-auto pt-2 pb-1">
                <div className="py-1 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-center text-[10px]">
                  اتاق فرمان، نورپردازی و صدابرداری تالار (FOH Booth)
                </div>
              </div>

            </div>

            {/* Bottom Plan Summary Metrics */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">ظرفیت کل سالن</div>
                <div className="font-bold font-mono text-emerald-400 text-sm mt-0.5">
                  {toPersianDigits(totalCapacity)} صندلی
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">تعداد جایگاه‌ها</div>
                <div className="font-bold font-mono text-indigo-400 text-sm mt-0.5">
                  {toPersianDigits(parts.length)} بخش
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">پتانسیل فروش هر سانس</div>
                <div className="font-bold font-mono text-amber-400 text-xs mt-0.5 truncate">
                  {formatPrice(potentialGrossRevenue)}
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">میانگین قیمت صندلی</div>
                <div className="font-bold font-mono text-slate-300 text-xs mt-0.5">
                  {formatPrice(totalCapacity > 0 ? Math.round(potentialGrossRevenue / totalCapacity) : 0)}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Inspector & Configuration Panel for Selected Section */}
          <div className={`lg:col-span-5 flex flex-col min-h-0 border rounded-3xl p-4 sm:p-5 space-y-4 overflow-y-auto ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-bold">
                  تنظیمات جایگاه فعال ({activePart.name})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddNewSection}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن بخش جدید</span>
              </button>
            </div>

            {/* Quick Section Switcher Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {parts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePartIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    activePartIndex === idx
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getTierColor(p.tier).fill }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Section Form Inputs */}
            <div className="space-y-3.5 text-xs">
              
              <div>
                <label className="block mb-1 font-bold text-[11px] text-slate-400">نام جایگاه:</label>
                <input
                  type="text"
                  value={activePart.name}
                  onChange={(e) => updatePartField('name', e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">طبقه و سطح کیفی:</label>
                  <select
                    value={activePart.tier}
                    onChange={(e) => updatePartField('tier', e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="vip">جایگاه ویژه VIP</option>
                    <option value="ground">سالن همکف</option>
                    <option value="balcony">بالکن طبقات</option>
                    <option value="lodge">لژ تشریفات و خانوادگی</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">هندسه چیدمان:</label>
                  <select
                    value={activePart.shape || 'straight'}
                    onChange={(e) => updatePartField('shape', e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="arc">قوسی و هلالی (Arc Theater)</option>
                    <option value="straight">ردیف‌های مستقیم (Straight)</option>
                    <option value="angled_left">مایل به چپ (Left Wing)</option>
                    <option value="angled_right">مایل به راست (Right Wing)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">تعداد ردیف‌ها:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={activePart.rows}
                    onChange={(e) => updatePartField('rows', Math.max(1, Number(e.target.value)))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">صندلی در هر ردیف:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={activePart.seatsPerRow}
                    onChange={(e) => updatePartField('seatsPerRow', Math.max(1, Number(e.target.value)))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[11px] text-slate-400">
                  قیمت بلیت هر صندلی در این بخش (تومان):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    value={activePart.price}
                    onChange={(e) => updatePartField('price', Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-200 text-amber-600'
                    }`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {formatPrice(activePart.price)}
                  </span>
                </div>
              </div>

              {/* Extra toggles */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={!!activePart.isAccessible}
                    onChange={(e) => updatePartField('isAccessible', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span>جایگاه مناسب‌سازی‌شده برای توان‌یابان و استفاده با ویلچر ♿</span>
                </label>
              </div>

              {/* Delete Active Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">
                  ظرفیت این بخش: {toPersianDigits(activePart.rows * activePart.seatsPerRow)} صندلی
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSection(activePartIndex)}
                  className="px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف این جایگاه</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>
              پلان ساخته شده مستقیماً در سامانه فروش آنلاین بلیت و ماژول گیشه مجازی فعال خواهد شد.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" />
              <span>{initialSalon ? 'بروزرسانی و ذخیره پلان سالن' : 'ایجاد سالن و ساخت نهایی پلان'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
