import React from 'react';
import { Calendar, MapPin, Music, Theater, Film, Smile, Presentation, Sparkles, ChevronLeft } from 'lucide-react';
import { EventItem } from '../types';
import { formatPrice } from '../utils/formatters';

interface HeroBannerProps {
  theme: 'light' | 'dark';
  featuredEvent: EventItem;
  onSelectEvent: (event: EventItem) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CATEGORIES: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'همه رویدادها', icon: Sparkles },
  { id: 'concert', label: 'کنسرت موسیقی', icon: Music },
  { id: 'theater', label: 'تئاتر و نمایش', icon: Theater },
  { id: 'comedy', label: 'کمدی و استندآپ', icon: Smile },
  { id: 'cinema', label: 'سینما و اکران', icon: Film },
  { id: 'conference', label: 'همایش و رویداد', icon: Presentation },
];

const CITIES = ['همه شهرها', 'مشهد', 'تهران'];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  theme,
  featuredEvent,
  onSelectEvent,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="relative pt-6 pb-8 overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 ${
        isDark ? 'bg-amber-500/10' : 'bg-amber-400/15'
      }`} />
      <div className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 ${
        isDark ? 'bg-rose-500/10' : 'bg-rose-400/10'
      }`} />

      {/* Featured Event Hero Showcase Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative rounded-3xl overflow-hidden border p-6 md:p-10 transition-colors shadow-xl ${
          isDark
            ? 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white'
            : 'border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 text-slate-900 shadow-slate-200/50'
        }`}>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left/Content info */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  رویداد ویژه و پرفروش هفته
                </span>
                <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{featuredEvent.city}</span>
                <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{featuredEvent.salonName}</span>
              </div>

              {/* Title with balance constraint */}
              <h1 className={`text-2xl sm:text-4xl font-black tracking-tight leading-snug ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {featuredEvent.title}
              </h1>

              {featuredEvent.subTitle && (
                <p className={`text-sm sm:text-base font-normal leading-relaxed max-w-2xl ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {featuredEvent.subTitle}
                </p>
              )}

              {/* Info icons */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{featuredEvent.dateRange}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{featuredEvent.address}</span>
                </div>
              </div>

              {/* Action and Price Row */}
              <div className="flex flex-wrap items-center gap-5 pt-4">
                <button
                  onClick={() => onSelectEvent(featuredEvent)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-extrabold text-sm hover:from-amber-400 hover:to-rose-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer flex items-center gap-2"
                >
                  <span>خرید آنلاین بلیت و انتخاب صندلی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-right">
                  <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>شروع قیمت از</span>
                  <span className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {formatPrice(featuredEvent.minPrice)}
                  </span>
                </div>
              </div>

            </div>

            {/* Right/Artistic Vector Showcase Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className={`relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border p-6 flex flex-col justify-between shadow-xl ${
                isDark 
                  ? 'border-slate-800 bg-gradient-to-tr from-stone-900 via-amber-950/40 to-slate-900' 
                  : 'border-slate-200 bg-gradient-to-tr from-slate-900 via-slate-800 to-amber-950 text-white'
              }`}>
                
                {/* Stage Lighting Effect */}
                <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent opacity-70 pointer-events-none" />
                
                <div className="relative z-10 flex justify-between items-start">
                  <span className="text-[11px] text-amber-300 font-bold bg-slate-950/70 px-2.5 py-1 rounded-md border border-amber-500/30">
                    اجرای زنده موسیقی
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 block">ظرفیت سالن</span>
                    <span className="text-xs font-bold text-white">۳۸۰ صندلی</span>
                  </div>
                </div>

                {/* Stylized Stage Silhouette */}
                <div className="relative z-10 my-auto text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                    <Music className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-amber-200 font-bold">پلان بصری سالن همایش‌های شهرما مشهد</p>
                  <p className="text-[11px] text-slate-300">انتخاب دقیق ردیف و صندلی با آیکون‌های اختصاصی</p>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-200 border-t border-slate-700/60 pt-3">
                  <span>سانس‌های چهارشنبه و پنج‌شنبه</span>
                  <span className="text-emerald-400 font-bold">در حال فروش آنلاین</span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Categories & Filter Bar */}
        <div className="mt-8 space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? isDark
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold shadow-xs'
                          : 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                        : isDark
                          ? 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* City Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <span className={`px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>شهر:</span>
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => onCityChange(city)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                    selectedCity === city
                      ? isDark
                        ? 'bg-slate-800 text-white font-bold'
                        : 'bg-slate-900 text-white font-bold'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
