import React from 'react';
import { Ticket, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

interface FooterProps {
  theme: 'light' | 'dark';
  onOpenRules: () => void;
  onOpenGuide: () => void;
  onOpenAbout: () => void;
  onOpenFaq?: () => void;
  onOpenCooperate?: () => void;
  onOpenSecurePayment?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  theme,
  onOpenRules,
  onOpenGuide,
  onOpenAbout,
  onOpenFaq,
  onOpenCooperate,
  onOpenSecurePayment,
}) => {
  const isDark = theme === 'dark';

  return (
    <footer className={`border-t text-xs no-print mt-16 transition-colors ${
      isDark ? 'border-slate-800/80 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1 text-right">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xs">
                <Ticket className="w-4 h-4" />
              </div>
              <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                سامانه لیندو تیکت (LinduTicket)
              </span>
            </div>
            <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              پلتفرم هوشمند فروش آنلاین بلیت کنسرت، تئاتر، سینما و همایش‌های فرهنگی با پلان تعاملی صندلی‌های سالن همایش‌های شهرما مشهد و برج میلاد.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-2.5 text-right">
            <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              راهنمای خریداران
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenGuide} className="hover:text-amber-500 transition-colors cursor-pointer">
                  نحوه خرید بلیت و انتخاب صندلی
                </button>
              </li>
              <li>
                <button onClick={onOpenRules} className="hover:text-amber-500 transition-colors cursor-pointer">
                  قوانین و مقررات استرداد بلیت
                </button>
              </li>
              <li>
                <button onClick={onOpenFaq} className="hover:text-amber-500 transition-colors cursor-pointer">
                  پرسش‌های متداول (FAQ)
                </button>
              </li>
              <li>
                <button onClick={onOpenSecurePayment} className="hover:text-amber-500 transition-colors cursor-pointer">
                  راهنمای پرداخت امن شاپرک
                </button>
              </li>
            </ul>
          </div>

          {/* Gate and Organizers */}
          <div className="space-y-2.5 text-right">
            <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              برگزارکنندگان و سالن‌ها
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenCooperate} className="text-amber-500 font-bold hover:underline cursor-pointer">
                  درخواست برگزاری رویداد (همکاری با ما)
                </button>
              </li>
              <li>
                <button onClick={onOpenAbout} className="hover:text-amber-500 transition-colors cursor-pointer">
                  درباره سامانه و دفتر مشهد
                </button>
              </li>
              <li className={isDark ? 'text-slate-400' : 'text-slate-500'}>سامانه گیت ورود: checker.gishow.ir</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-2.5 text-right">
            <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              تماس و پشتیبانی ۲۴ ساعته
            </h4>
            <div className={`space-y-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>پشتیبانی: ۰۹۱۵۲۴۵۴۶۱۲ - ۰۹۱۵۳۶۷۹۴۰۰</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span>ایمیل: support@gishow.ir</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>مشهد مقدس - میدان طالقانی - سالن شهرما</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={`mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-[11px] ${
          isDark ? 'border-slate-900 text-slate-500' : 'border-slate-100 text-slate-500'
        }`}>
          <p>© ۱۴۰۵ سامانه لیندو تیکت (LinduTicket). تمامی حقوق برای سامانه و تهیه‌کنندگان محفوظ است.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>متصل به شبکه شاپرک و درگاه‌های بانکی عضو شتاب</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
