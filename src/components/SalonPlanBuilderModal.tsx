import React, { useState, useRef } from 'react';
import {VenueLayoutEditor} from './VenueLayoutEditor';
import {FloorPlan} from '../types';
import { Salon, PartOfSalon } from '../types';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import { salonApi, moneyIRR, serverId } from '../services/apiServices';
import {useDialogFocus} from '../hooks/useDialogFocus';
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
  Maximize2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  DoorClosed,
  ShieldCheck
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
      { name: 'جایگاه ویژه VIP', tier: 'vip' as const, rows: 4, seatsPerRow: 14, price: 950000, shape: 'arc' as const, doorAccess: 'درب شرقی ۱' },
      { name: 'همکف مرکزی', tier: 'ground' as const, rows: 8, seatsPerRow: 18, price: 650000, shape: 'arc' as const, doorAccess: 'درب مرکزی' },
      { name: 'همکف جناح راست', tier: 'ground' as const, rows: 7, seatsPerRow: 10, price: 500000, shape: 'angled_right' as const, doorAccess: 'درب راست' },
      { name: 'همکف جناح چپ', tier: 'ground' as const, rows: 7, seatsPerRow: 10, price: 500000, shape: 'angled_left' as const, doorAccess: 'درب چپ' },
      { name: 'بالکن طبقه اول', tier: 'balcony' as const, rows: 6, seatsPerRow: 20, price: 380000, shape: 'straight' as const, doorAccess: 'پله و آسانسور بالکن' },
    ]
  },
  {
    id: 'arena',
    name: 'تالار همایش‌های بزرگ (آرنا)',
    description: 'سالن چندمنظوره با لژ تشریفات، دو طبقه بالکن و ظرفیت بالا',
    parts: [
      { name: 'جایگاه VIP ردیف اول', tier: 'vip' as const, rows: 5, seatsPerRow: 16, price: 1200000, shape: 'arc' as const, doorAccess: 'گیت VIP' },
      { name: 'همکف سالن اصلی', tier: 'ground' as const, rows: 12, seatsPerRow: 22, price: 750000, shape: 'arc' as const, doorAccess: 'درب‌های اصلی' },
      { name: 'لژهای اختصاصی', tier: 'lodge' as const, rows: 3, seatsPerRow: 8, price: 1400000, shape: 'straight' as const, doorAccess: 'ورودی لژ تشریفات' },
      { name: 'بالکن طبقه اول', tier: 'balcony' as const, rows: 6, seatsPerRow: 24, price: 450000, shape: 'straight' as const, doorAccess: 'گیت بالکن الف' },
      { name: 'بالکن طبقه دوم', tier: 'balcony' as const, rows: 5, seatsPerRow: 24, price: 320000, shape: 'straight' as const, doorAccess: 'گیت بالکن ب' },
    ]
  },
  {
    id: 'cinema',
    name: 'سینما و آمفی‌تئاتر شیب‌دار',
    description: 'پلان مستطیل شیب‌دار یکپارچه به همراه صندلی‌های ویژه ویلچر و توان‌یابان',
    parts: [
      { name: 'ردیف‌های طلایی جلو', tier: 'vip' as const, rows: 3, seatsPerRow: 18, price: 800000, shape: 'straight' as const, doorAccess: 'درب همکف' },
      { name: 'همکف سالن شیب‌دار', tier: 'ground' as const, rows: 10, seatsPerRow: 20, price: 550000, shape: 'straight' as const, doorAccess: 'درب همکف' },
      { name: 'جایگاه توان‌یابان و همراه', tier: 'ground' as const, rows: 1, seatsPerRow: 6, price: 300000, shape: 'straight' as const, isAccessible: true, doorAccess: 'رمپ اختصاصی توان‌یابان' },
      { name: 'لژ خانوادگی انتهای سالن', tier: 'lodge' as const, rows: 2, seatsPerRow: 12, price: 700000, shape: 'straight' as const, doorAccess: 'درب انتهای سالن' },
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, onClose);

  // Basic Details
  const [salonName, setSalonName] = useState(initialSalon?.name || '');
  const [salonCity, setSalonCity] = useState(initialSalon?.city || 'مشهد مقدس');
  const [salonAddress, setSalonAddress] = useState(initialSalon?.address || '');
  const [layoutTemplate, setLayoutTemplate] = useState<'arena' | 'theater' | 'blackbox' | 'cinema' | 'custom'>(
    (initialSalon?.layoutTemplate as any) || 'theater'
  );
  const [stagePosition, setStagePosition] = useState<'top' | 'center' | 'thrust' | 'bottom'>(
    (initialSalon?.stagePosition as any) || 'top'
  );
  const [aislesCount, setAislesCount] = useState<number>(initialSalon?.aislesCount ?? 2);
  const [isActive, setIsActive] = useState<boolean>(initialSalon?.isActive !== undefined ? initialSalon.isActive : true);

  const [floorPlan,setFloorPlan]=useState<FloorPlan|undefined>(initialSalon?.floorPlan);
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
      doorAccess: p.doorAccess || '',
    }));
  });

  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  // Saving & Feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedOnServer, setIsSavedOnServer] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Capacity calculations: Strictly computed from valid rows * seatsPerRow, never an arbitrary number!
  const totalCapacity = parts.reduce((acc, p) => acc + (p.rows * p.seatsPerRow), 0);
  const potentialGrossRevenue = parts.reduce((acc, p) => acc + (p.rows * p.seatsPerRow * p.price), 0);

  // Validation checks: detect empty plan, duplicate names, invalid sections
  const duplicatePartNames = parts.filter((p, index) => parts.findIndex(o => o.name.trim() === p.name.trim()) !== index);
  const invalidParts = parts.filter((p) => !p.name.trim() || p.rows <= 0 || p.seatsPerRow <= 0);
  const hasValidationErrors = parts.length === 0 || duplicatePartNames.length > 0 || invalidParts.length > 0;

  // Apply a template
  const handleApplyTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setLayoutTemplate(tpl.id as any);
    setFloorPlan(undefined);
    setParts(
      tpl.parts.map((p, idx) => ({
        id: `part-${initialSalon?.id || 'new'}-${idx}`,
        salonId: initialSalon?.id || 'temp',
        name: p.name,
        tier: p.tier,
        rows: p.rows,
        seatsPerRow: p.seatsPerRow,
        price: p.price,
        shape: p.shape,
        isAccessible: (p as any).isAccessible || false,
        doorAccess: p.doorAccess || '',
      }))
    );
    setActivePartIndex(0);
    setSaveFeedback(null);
    setIsSavedOnServer(false);
  };

  // Add new Section
  const handleAddNewSection = () => {
    const newPart: PartOfSalon = {
      id: `part-${crypto.randomUUID()}`,
      salonId: initialSalon?.id || 'temp',
      name: `جایگاه جدید ${parts.length + 1}`,
      tier: 'ground',
      rows: 5,
      seatsPerRow: 12,
      price: 500000,
      shape: 'straight',
      doorAccess: `درب ورودی ${parts.length + 1}`,
      isAccessible: false,
      placement:floorPlan?{x:10,y:25,width:35,height:18}:undefined,
    };
    setParts([...parts, newPart]);
    setActivePartIndex(parts.length);
    setIsSavedOnServer(false);
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

  // Move Section Up or Down to control order of parts
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parts.length) return;
    const reordered = [...parts];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setParts(reordered);
    setActivePartIndex(targetIndex);
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

  // Save Salon to Server API layer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid=dialogRef.current?.querySelector<HTMLInputElement>('input:invalid');
    if(invalid){invalid.reportValidity();return;}
    if (!salonName.trim()) {
      alert('لطفاً نام سالن را وارد کنید.');
      return;
    }
    if (parts.length === 0) {
      alert('حداقل یک بخش صندلی برای سالن الزامی است.');
      return;
    }
    if (duplicatePartNames.length > 0) {
      alert(`نام جایگاه‌های زیر تکراری است: ${duplicatePartNames.map(p => p.name).join('، ')}. نام هر بخش باید یکتا باشد.`);
      return;
    }

    if (hasValidationErrors || isSaving) return;
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const payload = {
        name: salonName.trim(), city: salonCity.trim(), address: salonAddress.trim(),
        layoutTemplate, stagePosition, aislesCount, isActive, floorPlan,
        version: initialSalon?.version ?? 0,
        parts: parts.map(p => ({
          id: /^\d+$/.test(p.id) ? serverId(p.id) : undefined,
          name:p.name.trim(), tier:p.tier, rows:p.rows, seatsPerRow:p.seatsPerRow,
          price:moneyIRR(p.price), shape:p.shape, isAccessible:p.isAccessible, doorAccess:p.doorAccess, placement:p.placement, aisleAfter:p.aisleAfter,
        })),
      };
      const saved = initialSalon
        ? await salonApi.updateSalon(serverId(initialSalon.id), payload)
        : await salonApi.createSalon(payload);
      setSaveFeedback({type:'success',message:'سالن و پلان با شناسه‌های سرور ذخیره شدند.'});
      setIsSavedOnServer(true);
      onSaveSalon(saved);
      onClose();
    } catch (err: any) {
      // Honest response: inform user that backend route is pending implementation according to Phase 3 contract
      const isRoutePending = err.status === 404 || err.code === 'NOT_FOUND' || err.message?.includes('یافت نشد');
      setIsSavedOnServer(false);
      setSaveFeedback({
        type: 'warning',
        message: isRoutePending
          ? 'سرویس ذخیره سالن و پلان در دسترس نیست. تغییرات ذخیره نشدند و فرم برای تلاش دوباره حفظ شده است.'
          : `خطای سرور (${err.message || 'خطا در ذخیره‌سازی'}). سالن در سرور ذخیره نشد.`,
      });
    } finally {
      setIsSaving(false);
    }
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
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="ویرایش سالن و پلان" dir="rtl" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div data-site-theme={theme} className={`max-w-6xl w-full border rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-4 flex flex-col max-h-[96vh] overflow-y-auto ${
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
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
              isSavedOnServer
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isSavedOnServer ? '✓ ذخیره‌شده در سرور' : 'پیش‌نمایش محلی (ذخیره‌نشده در سرور)'}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {hasValidationErrors && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex flex-wrap items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {parts.length === 0 && <span className="font-bold">پلان خالی است: حداقل یک جایگاه صندلی باید تعریف شود.</span>}
            {duplicatePartNames.length > 0 && (
              <span>نام جایگاه‌های تکراری: <strong>{duplicatePartNames.map(p => p.name).join('، ')}</strong></span>
            )}
            {invalidParts.length > 0 && (
              <span>جایگاه‌های نامعتبر (ردیف یا صندلی صفر یا بدون نام): <strong>{invalidParts.map(p => p.name || 'بدون نام').join('، ')}</strong></span>
            )}
          </div>
        )}

        <details open={!initialSalon} className="shrink-0"><summary className="cursor-pointer text-sm font-bold">مشخصات سالن و الگوهای چیدمان</summary><div className="mt-4 space-y-4">
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

        {/* Architectural Settings Strip: Stage Position, Layout Template, Aisles, Active Status & Valid Capacity */}
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">نوع چیدمان:</span>
              <select
                value={layoutTemplate}
                onChange={(e) => setLayoutTemplate(e.target.value as any)}
                className={`py-1 px-2.5 rounded-lg border text-xs font-bold ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="theater">تئاتر و کنسرت استاندارد</option>
                <option value="arena">آرنا و تالار بزرگ</option>
                <option value="cinema">سینما و آمفی‌تئاتر</option>
                <option value="blackbox">بلک‌باکس تجربی</option>
                <option value="custom">سفارشی</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">موقعیت صحنه در نمای خودکار:</span>
              <select
                value={stagePosition}
                disabled={!!floorPlan}
                onChange={(e) => setStagePosition(e.target.value as any)}
                className={`py-1 px-2.5 rounded-lg border text-xs font-bold ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="top">بالای سالن (روبرو)</option>
                <option value="center">مرکز سالن (سن گرد)</option>
                <option value="thrust">پیش‌آمده در جمعیت (Thrust)</option>
                <option value="bottom">پایین سالن</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">راهروهای نمای خودکار:</span>
              <select
                value={aislesCount}
                disabled={!!floorPlan}
                onChange={(e) => setAislesCount(Number(e.target.value))}
                className={`py-1 px-2 rounded-lg border text-xs font-mono font-bold ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="1">۱ راهرو (وسط)</option>
                <option value="2">۲ راهرو (طرفین)</option>
                <option value="3">۳ راهرو</option>
                <option value="4">۴ راهرو</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300 mr-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
              />
              <span>سالن فعال و آماده سانس‌بندی</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              ظرفیت معتبر صندلی‌ها: {toPersianDigits(totalCapacity)} صندلی
            </span>
          </div>
        </div>

        </div></details>
        {/* Main Body: Canvas on Right/Left + Inspector on other side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0">
          
          <div className="lg:col-span-7 min-h-0 overflow-y-auto site-surface p-4" data-site-theme={theme}>
            <VenueLayoutEditor activePartId={activePart?.id} parts={parts} plan={floorPlan} onSelectPart={setActivePartIndex} onChange={(next,plan)=>{setParts(next);setFloorPlan(plan);setIsSavedOnServer(false);}}/>
          </div>

          {/* RIGHT: Inspector & Configuration Panel for Selected Section */}
          <div className={`lg:col-span-5 flex flex-col border rounded-3xl p-4 sm:p-5 space-y-4 overflow-y-auto ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            
            <label className="text-xs">راهرو بعد از شماره صندلی، با فاصله جدا کنید
              <input key={activePart.id} className="site-input w-full mt-2" dir="ltr" placeholder="5 10" defaultValue={(activePart.aisleAfter||[]).join(' ')} onChange={e=>{const nums=e.target.value.trim().split(/\s+/).filter(Boolean).map(Number);const valid=nums.length<=20&&new Set(nums).size===nums.length&&nums.every(n=>Number.isInteger(n)&&n>0&&n<activePart.seatsPerRow);e.target.setCustomValidity(valid?'':'شماره راهرو معتبر نیست؛ شماره‌ها باید یکتا و بین صندلی‌های جایگاه باشند.');if(valid)updatePartField('aisleAfter',nums.sort((a,b)=>a-b));}}/>
              <span className="block mt-1">شماره‌ها باید بین یک و تعداد صندلی منهای یک باشند. بدون مقدار یعنی بدون فاصله راهرو بین صندلی‌ها.</span>
            </label>
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

            {/* Quick Section Switcher Buttons + Reorder Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {parts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-0.5">
                  <button
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
                  {activePartIndex === idx && (
                    <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        title="انتقال جایگاه به بالا"
                        className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === parts.length - 1}
                        title="انتقال جایگاه به پایین"
                        className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Validation Alerts */}
            {duplicatePartNames.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>نام جایگاه تکراری است ({duplicatePartNames.map(p => p.name).join('، ')}). هر بخش باید نام مجزا داشته باشد.</span>
              </div>
            )}

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">
                    قیمت بلیت هر صندلی (تومان):
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

                <div>
                  <label className="block mb-1 font-bold text-[11px] text-slate-400">
                    درب یا گیت ورودی اختصاصی:
                  </label>
                  <input
                    type="text"
                    value={activePart.doorAccess || ''}
                    onChange={(e) => updatePartField('doorAccess', e.target.value)}
                    placeholder="مثال: درب شرقی ۱، ورودی بالکن"
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
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

        {/* Action Buttons Footer with Honest Server Status Banner */}
        <div className={`space-y-3 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0 sticky bottom-0 z-10 ${isDark?'bg-slate-900':'bg-white'}`}>

          {/* Honest Feedback Banner */}
          {saveFeedback && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
              saveFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : saveFeedback.type === 'warning'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {saveFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-relaxed">{saveFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                وضعیت: پیش‌نمایش معماری قبل از ذخیره · ظرفیت کل {toPersianDigits(totalCapacity)} صندلی
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || hasValidationErrors}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال برقراری ارتباط با سرور...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{initialSalon ? 'بروزرسانی و ذخیره پلان سالن' : 'ایجاد سالن و ساخت نهایی پلان'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
