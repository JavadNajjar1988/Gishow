import React from 'react';
import { Calendar, MapPin, Ticket, Clock, Music, Theater, Film, Smile, Presentation, ArrowLeft } from 'lucide-react';
import { EventItem } from '../types';
import { formatPrice } from '../utils/formatters';

interface EventCardProps {
  theme: 'light' | 'dark';
  event: EventItem;
  onSelect: (event: EventItem) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'concert':
      return Music;
    case 'theater':
      return Theater;
    case 'cinema':
      return Film;
    case 'comedy':
      return Smile;
    case 'conference':
      return Presentation;
    default:
      return Ticket;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'concert':
      return 'کنسرت';
    case 'theater':
      return 'تئاتر';
    case 'cinema':
      return 'سینما';
    case 'comedy':
      return 'کمدی';
    case 'conference':
      return 'همایش';
    default:
      return 'رویداد';
  }
};

export const EventCard: React.FC<EventCardProps> = ({ theme, event, onSelect }) => {
  const isDark = theme === 'dark';
  const Icon = getCategoryIcon(event.category);
  const isSoldOut = !!event.isSoldOut || (event.runTurns?.length > 0 && event.runTurns.every((t) => t.isSoldOut || t.availableSeatsCount === 0));

  return (
    <div className={`group rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between relative ${
      isSoldOut ? 'opacity-95' : ''
    } ${
      isDark
        ? 'border-slate-800 bg-slate-900/90 hover:border-slate-700 shadow-xl'
        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg shadow-sm'
    }`}>
      
      <div>
        {/* Artistic Visual Art Slot with Ambient Lighting */}
        <div className={`relative aspect-[16/10] w-full bg-gradient-to-br ${event.bannerGradient} p-5 flex flex-col justify-between overflow-hidden text-white`}>
          
          {/* Subtle Stage Spotlights */}
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-24 h-24 bg-black/40 rounded-full blur-xl pointer-events-none" />

          {/* Top Metadata & Sold Out Ribbon */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-1.5">
              <span className="font-bold bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10">
                {getCategoryLabel(event.category)}
              </span>
              {isSoldOut && (
                <span className="font-black bg-rose-600/95 text-white px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm border border-rose-400/40 text-[11px] animate-pulse">
                  سولد اوت (تکمیل ظرفیت)
                </span>
              )}
            </div>
            <span className="text-white/90 font-medium bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm">
              {event.city}
            </span>
          </div>

          {/* Center Graphic Icon */}
          <div className="relative z-10 my-auto flex items-center justify-center">
            <div className={`w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 ${
              isSoldOut ? 'ring-2 ring-rose-500/50' : ''
            }`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>

          {/* Bottom Duration & San Count */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              {event.durationMinutes} دقیقه
            </span>
            <span className="font-medium">
              {isSoldOut ? 'ظرفیت کل سانس‌ها تکمیل است' : `${event.runTurns.length} سانس فعال`}
            </span>
          </div>

        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-base font-extrabold tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {event.title}
            </h3>
            {isSoldOut && (
              <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Clean Metadata */}
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.salonName}</span>
          </div>

          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{event.dateRange}</span>
          </div>

          {/* Cast Preview */}
          {event.cast && event.cast.length > 0 && (
            <p className={`text-[11px] truncate pt-1 border-t ${
              isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'
            }`}>
              عوامل: {event.cast.map((c) => c.name).slice(0, 3).join('، ')}
            </p>
          )}

        </div>
      </div>

      {/* Card Footer: Price & CTA */}
      <div className={`px-5 pb-5 pt-3 border-t flex items-center justify-between ${
        isDark ? 'border-slate-800/80 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'
      }`}>
        
        <div>
          <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isSoldOut ? 'وضعیت فروش' : 'شروع قیمت از'}
          </span>
          <span className={`text-xs sm:text-sm font-extrabold ${
            isSoldOut ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isSoldOut ? 'بلیت‌ها پایان یافت' : formatPrice(event.minPrice)}
          </span>
        </div>

        <button
          onClick={() => onSelect(event)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            isSoldOut
              ? isDark
                ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          <span>{isSoldOut ? 'مشاهده سانس‌ها' : 'انتخاب صندلی'}</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

      </div>

    </div>
  );
};
