import React from 'react';
import { X, Calendar, MapPin, Clock, Users, AlertCircle, ChevronLeft } from 'lucide-react';
import { EventItem, RunTurn } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';

interface EventDetailsModalProps {
  theme: 'light' | 'dark';
  event: EventItem;
  onClose: () => void;
  onSelectSans: (event: EventItem, runTurn: RunTurn) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  theme,
  event,
  onClose,
  onSelectSans,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Modal Header with Close Button */}
        <div className={`relative p-6 md:p-8 bg-gradient-to-r ${event.bannerGradient} text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 max-w-xl">
            <span className="text-xs text-amber-300 font-bold bg-black/40 px-2.5 py-1 rounded">
              {event.city} · {event.salonName}
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">
              {event.title}
            </h2>
            {event.subTitle && (
              <p className="text-xs sm:text-sm text-slate-200 font-normal">
                {event.subTitle}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
          
          {/* Quick Info Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border text-xs ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>بازه اجرا</span>
                <span className="font-bold">{event.dateRange}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>مدت اجرا</span>
                <span className="font-bold">{event.durationMinutes} دقیقه</span>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>محل برگزاری</span>
                <span className="font-bold truncate">{event.salonName}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold">معرفی برنامه</h4>
            <p className={`text-xs sm:text-sm leading-relaxed text-justify ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {event.description}
            </p>
          </div>

          {/* Cast */}
          {event.cast && event.cast.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                هنرمندان و عوامل اجرایی
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {event.cast.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-right ${
                    isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-xs font-bold block truncate">{item.name}</span>
                    <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sans (RunTurns) Selection Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">
                انتخاب روز و سانس اجرا
              </h4>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                بهای بلیت: {formatPrice(event.minPrice)} تا {formatPrice(event.maxPrice)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.runTurns.map((sans) => {
                const isFewSeats = sans.availableSeatsCount < 30;
                return (
                  <div
                    key={sans.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      isDark
                        ? 'border-slate-800 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-950'
                        : 'border-slate-200 bg-slate-50/70 hover:border-amber-400 hover:bg-white shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">
                          {sans.weekday} {sans.date}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          isDark ? 'text-amber-400 bg-amber-400/10' : 'text-amber-700 bg-amber-100/70'
                        }`}>
                          ساعت {sans.time}
                        </span>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isFewSeats ? (
                          <span className="text-rose-500 font-bold">
                            تنها {toPersianDigits(sans.availableSeatsCount)} صندلی باقی مانده!
                          </span>
                        ) : (
                          <span>{toPersianDigits(sans.availableSeatsCount)} صندلی خالی موجود</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectSans(event, sans)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer group-hover:scale-105"
                    >
                      <span>انتخاب صندلی</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules and Regulations */}
          {event.rules && event.rules.length > 0 && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>قوانین و نکات مهم سالن</span>
              </div>
              <ul className={`list-disc list-inside space-y-1 pr-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {event.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
