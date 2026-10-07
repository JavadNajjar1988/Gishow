import React from 'react';
import { Ticket, ShieldCheck, LayoutDashboard, Search, Sparkles, Sun, Moon, Store, Crown } from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {hasPermission} from '../auth/api';
import { ActiveAppMode } from '../types';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeMode: ActiveAppMode;
  onModeChange: (mode: ActiveAppMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onTicketTrackClick: () => void;
  onAccountClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeMode,
  onModeChange,
  searchQuery,
  onSearchChange,
  onTicketTrackClick,
  onAccountClick
}) => {
  const isDark = theme === 'dark';
  const {user} = useAuth();

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
      isDark 
        ? 'bg-slate-950/90 backdrop-blur-md border-slate-800/80 text-slate-100' 
        : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onModeChange('portal')}
              className="flex items-center gap-2.5 text-right group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className={`text-xl font-black tracking-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  لیندو تیکت
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    isDark 
                      ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' 
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    LinduTicket
                  </span>
                </span>
                <p className={`text-[10px] hidden sm:block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  سامانه هوشمند فروش آنلاین بلیت و رزرواسیون سالن
                </p>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation & Quick Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="جستجوی کنسرت، تئاتر، هنرمند یا سالن..."
                className={`w-full rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                  isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-amber-500/50'
                    : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Zone 3: Mode Switcher, Theme Toggle & Navigation Actions */}
          <div className="flex items-center gap-2.5">
            
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={isDark ? 'تغییر به تم سفید (روشن)' : 'تغییر به تم تیره (Dark Mode)'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mode Switcher Tabs */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-medium ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => onModeChange('portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'portal'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خرید بلیت</span>
              </button>

              {hasPermission(user, 'events.read') && (
              <button
                onClick={() => onModeChange('box-office')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'box-office'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="گیشه مجازی و صدور بلیت حضوری / کارتخوان POS"
              >
                <Store className="w-3.5 h-3.5" />
                <span>گیشه مجازی</span>
              </button>
              )}

              {hasPermission(user, 'tickets.check') && (
              <button
                onClick={() => onModeChange('checker')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'checker'
                    ? 'bg-rose-500 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="سامانه اعتبارسنجی و گیت ورود (checker.gishow.ir)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>چکِر گیت</span>
              </button>
              )}

              {(hasPermission(user, 'events.read') || hasPermission(user, 'reports.read') || hasPermission(user, 'seats.manage')) && (
              <button
                onClick={() => onModeChange('producer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'producer'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="کنسول اختصاصی تهیه‌کننده و مدیر برنامه (LinduProducer Hub)"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>پنل تهیه‌کننده</span>
              </button>
              )}

              {(hasPermission(user, 'accounts.manage') || hasPermission(user, 'roles.manage')) && (
              <button
                onClick={() => onModeChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'admin'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="پنل مدیریت کل سامانه (AdminSite)"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>مدیریت</span>
              </button>
              )}
            </div>

            <button onClick={onAccountClick} className="text-xs px-3 py-2 rounded-xl border font-bold">{user ? 'حساب من' : 'ورود و ثبت‌نام'}</button>
            {/* Ticket Track Button */}
            <button
              onClick={onTicketTrackClick}
              className={`text-xs px-3.5 py-2 rounded-xl border transition-colors hidden lg:block cursor-pointer font-medium ${
                isDark 
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
              }`}
            >
              پیگیری بلیت
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
