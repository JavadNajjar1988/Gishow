import React from 'react';
import { X, HelpCircle, FileText, Info, ShieldCheck } from 'lucide-react';

interface InfoModalProps {
  theme: 'light' | 'dark';
  type: 'guide' | 'rules' | 'about' | 'track' | 'faq' | 'cooperate' | 'secure_payment' | null;
  onClose: () => void;
  onTrackSubmit?: (code: string) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ theme, type, onClose, onTrackSubmit }) => {
  const isDark = theme === 'dark';
  const [trackInput, setTrackInput] = React.useState('');
  const [coopSent, setCoopSent] = React.useState(false);
  const [coopOrganizer, setCoopOrganizer] = React.useState('');
  const [coopPhone, setCoopPhone] = React.useState('');
  const [coopEvent, setCoopEvent] = React.useState('');
  const [coopDesc, setCoopDesc] = React.useState('');

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`max-w-lg w-full border rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-right transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {type === 'guide' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              راهنمای خرید بلیت و انتخاب صندلی
            </h3>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>۱. رویداد مورد نظر خود را از صفحه اصلی انتخاب کرده و روی «انتخاب سانس و صندلی» کلیک کنید.</p>
              <p>۲. سانس و ساعت دلخواه خود را تعیین نمایید تا پلان زنده سالن بارگذاری شود.</p>
              <p>۳. از روی نقشه سالن، صندلی‌های سبز را با کلیک انتخاب کنید. صندلی‌های انتخابی به رنگ طلایی درمی‌آیند.</p>
              <p>۴. پس از انتخاب، ۱۰ دقیقه مهلت دارید تا اطلاعات خریدار را وارد و از طریق درگاه شاپرک پرداخت نمایید.</p>
              <p>۵. پس از پرداخت، بلیت دیجیتال حاوی QR Code صادر شده و پیامک لینک بلیت به شماره همراه شما ارسال می‌گردد.</p>
            </div>
          </div>
        )}

        {type === 'rules' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-500" />
              قوانین و مقررات خرید و استرداد بلیت
            </h3>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>• همراه داشتن اصل کارت ملی خریدار و بلیت دیجیتال یا چاپی در هنگام ورود به سالن الزامی است.</p>
              <p>• ورود کودکان زیر ۵ سال به سالن‌های کنسرت و همایش ممنوع می‌باشد مگر در برنامه‌های کودک.</p>
              <p>• بلیت‌های خریداری‌شده غیرقابل لغو یا تغییر سانس می‌باشند مگر در صورت لغو رویداد از طرف مراجع رسمی.</p>
              <p>• هر بارکد فقط یک‌بار در گیت ورودی معتبر است و از در اختیار گذاشتن تصویر بلیت به سایر افراد خودداری نمایید.</p>
            </div>
          </div>
        )}

        {type === 'about' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              درباره سامانه لیندو تیکت (LinduTicket)
            </h3>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>لیندو تیکت (LinduTicket) پلتفرم مدرن و هوشمند جهت فروش آنلاین بلیت، رزرواسیون صندلی‌های سالن با پلان تعاملی و مدیریت گیت ورود و گیشه حضوری رویدادهای هنری، کنسرت‌ها و همایش‌های کشور است.</p>
              <p>دفتر مرکزی: مشهد مقدس، میدان طالقانی، مجموعه همایش‌های شهرما.</p>
              <p>تلفن‌های تماس: ۰۹۱۵۲۴۵۴۶۱۲ - ۰۹۱۵۳۶۷۹۴۰۰</p>
            </div>
          </div>
        )}

        {type === 'secure_payment' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              راهنمای پرداخت امن شاپرک (بانک مرکزی)
            </h3>
            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>• کلیه پرداخت‌های سامانه لیندو تیکت از طریق درگاه‌های مستقیم شاپرک (به‌پرداخت ملت، پارسیان و زرین‌پال) انجام می‌شود.</p>
              <p>• آدرس درگاه پرداخت در مرورگر شما همواره با پیشوند رسمی <code className="font-mono text-amber-500">https://*.shaparak.ir</code> آغاز می‌گردد.</p>
              <p>• پس از اتمام پرداخت و فشردن دکمه تکمیل خرید در صفحه بانک، حتماً منتظر انتقال خودکار به سامانه لیندو تیکت و دریافت کد رهگیری بمانید.</p>
              <p>• در صورت بروز هرگونه قطعی ارتباط بانکی، وجه کسر شده ظرف حداکثر ۷۲ ساعت به همان کارت بانکی بازگردانده خواهد شد.</p>
            </div>
          </div>
        )}

        {type === 'faq' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              پرسش‌های متداول خریداران (FAQ)
            </h3>
            <div className={`space-y-3 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div>
                <strong className="block text-amber-500 mb-0.5">آیا برای ورود به سالن پرینت کاغذی بلیت الزامی است؟</strong>
                خیر، نمایش تصویر بلیت دیجیتال یا بارکد QR بر روی گوشی هوشمند برای اسکن توسط چکر ورودی سالن کافی است.
              </div>
              <div>
                <strong className="block text-amber-500 mb-0.5">در صورت مفقود شدن بلیت چطور آن را دریافت کنم؟</strong>
                از منوی بالای سایت با فشردن دکمه «پیگیری بلیت» و وارد کردن شماره فاکتور یا شماره موبایل، بلیت فوراً نمایش داده می‌شود.
              </div>
              <div>
                <strong className="block text-amber-500 mb-0.5">صندلی‌های انتخابی تا چه مدت برای من رزرو می‌ماند؟</strong>
                صندلی‌ها به مدت ۱۰ دقیقه برای شما قفل شده تا با آرامش فرآیند پرداخت را تکمیل نمایید.
              </div>
            </div>
          </div>
        )}

        {type === 'cooperate' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              درخواست همکاری و برگزاری برنامه (ویژه تهیه‌کنندگان)
            </h3>

            {coopSent ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold space-y-1">
                <p>درخواست برگزاری رویداد با موفقیت ثبت شد.</p>
                <p className="font-normal text-[11px] text-emerald-400">کارشناسان پشتیبانی لیندو تیکت ظرف ۲۴ ساعت جهت هماهنگی سالن و صدور قرارداد با شما تماس خواهند گرفت.</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  جهت فروش آنلاین بلیت کنسرت، تئاتر، استندآپ یا همایش در سالن‌های کشور فرم زیر را تکمیل نمایید:
                </p>
                <div>
                  <label className="block mb-1 font-medium">نام تهیه‌کننده یا موسسه:</label>
                  <input
                    type="text"
                    value={coopOrganizer}
                    onChange={(e) => setCoopOrganizer(e.target.value)}
                    placeholder="مثال: موسسه آوای هنر"
                    className={`w-full p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 font-medium">شماره تماس:</label>
                    <input
                      type="text"
                      value={coopPhone}
                      onChange={(e) => setCoopPhone(e.target.value)}
                      placeholder="0915..."
                      className={`w-full p-2 rounded-xl border font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">عنوان برنامه:</label>
                    <input
                      type="text"
                      value={coopEvent}
                      onChange={(e) => setCoopEvent(e.target.value)}
                      placeholder="عنوان کنسرت / تئاتر"
                      className={`w-full p-2 rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium">توضیحات و سالن مدنظر:</label>
                  <textarea
                    rows={2}
                    value={coopDesc}
                    onChange={(e) => setCoopDesc(e.target.value)}
                    placeholder="تعداد سانس، تاریخ پیشنهادی و سالن..."
                    className={`w-full p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    if (coopOrganizer && coopPhone) {
                      setCoopSent(true);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  ارسال درخواست همکاری
                </button>
              </div>
            )}
          </div>
        )}

        {type === 'track' && (
          <div className="space-y-3">
            <h3 className="text-base font-bold">
              پیگیری و دریافت مجدد بلیت
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              شماره فاکتور خرید (مثال: GSH-849201) یا شماره تلفن همراه خود را وارد کنید:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="GSH-849201"
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono ${
                  isDark ? 'bg-slate-950 border border-slate-800 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (onTrackSubmit && trackInput) {
                    onTrackSubmit(trackInput);
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                جستجو
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
