import { Salon, EventItem, DiscountCode, FactorItem } from '../types';

export const MOCK_SALONS: Salon[] = [
  {
    id: 'salon-1',
    name: 'سالن همایش‌های شهرما مشهد',
    city: 'مشهد',
    address: 'مشهد مقدس - میدان طالقانی - مجموعه فرهنگی هنری شهرما',
    capacity: 380,
    parts: [
      {
        id: 'part-vip',
        salonId: 'salon-1',
        name: 'جایگاه ویژه (VIP)',
        tier: 'vip',
        rows: 3,
        seatsPerRow: 14,
        price: 850000,
      },
      {
        id: 'part-ground-center',
        salonId: 'salon-1',
        name: 'همکف وسط',
        tier: 'ground',
        rows: 8,
        seatsPerRow: 18,
        price: 650000,
      },
      {
        id: 'part-ground-right',
        salonId: 'salon-1',
        name: 'همکف راست و چپ',
        tier: 'ground',
        rows: 6,
        seatsPerRow: 12,
        price: 450000,
      },
      {
        id: 'part-balcony',
        salonId: 'salon-1',
        name: 'بالکن طبقه اول',
        tier: 'balcony',
        rows: 4,
        seatsPerRow: 20,
        price: 320000,
      }
    ]
  },
  {
    id: 'salon-2',
    name: 'تالار وحدت تهران',
    city: 'تهران',
    address: 'تهران - خیابان حافظ - خیابان استاد شهریار',
    capacity: 700,
    parts: [
      {
        id: 'part-v-vip',
        salonId: 'salon-2',
        name: 'جایگاه همکف VIP',
        tier: 'vip',
        rows: 4,
        seatsPerRow: 16,
        price: 950000,
      },
      {
        id: 'part-v-ground',
        salonId: 'salon-2',
        name: 'همکف اصلی',
        tier: 'ground',
        rows: 10,
        seatsPerRow: 20,
        price: 750000,
      },
      {
        id: 'part-v-balcony',
        salonId: 'salon-2',
        name: 'بالکن اول و دوم',
        tier: 'balcony',
        rows: 6,
        seatsPerRow: 22,
        price: 400000,
      }
    ]
  },
  {
    id: 'salon-3',
    name: 'مرکز همایش‌های برج میلاد',
    city: 'تهران',
    address: 'تهران - بزرگراه همت غرب - برج بین‌المللی میلاد',
    capacity: 1600,
    parts: [
      {
        id: 'part-m-vip',
        salonId: 'salon-3',
        name: 'همکف ویژه A',
        tier: 'vip',
        rows: 4,
        seatsPerRow: 20,
        price: 900000,
      },
      {
        id: 'part-m-ground',
        salonId: 'salon-3',
        name: 'همکف سالن اصلی',
        tier: 'ground',
        rows: 12,
        seatsPerRow: 24,
        price: 650000,
      }
    ]
  }
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'event-1',
    title: 'کنسرت بزرگ علیرضا قربانی',
    subTitle: 'تور کنسرت‌های آواز پارسی و ارکستر سازهای زهی',
    category: 'concert',
    city: 'مشهد',
    salonId: 'salon-1',
    salonName: 'سالن همایش‌های شهرما مشهد',
    address: 'مشهد مقدس - میدان طالقانی - مجموعه فرهنگی شهرما',
    dateRange: '۱۸ الی ۲۲ آبان ۱۴۰۵',
    durationMinutes: 110,
    description: 'کنسرت باشکوه علیرضا قربانی با اجرای قطعات ماندگار «روزگار غریب»، «بوی گیسو»، «خیال خوش» و قطعات آلبوم جدید با همراهی ارکستر زهی به سرپرستی حسام ناصری در سالن شهرما مشهد.',
    rules: [
      'ورود کودکان زیر ۶ سال به سالن ممنوع است.',
      'همراه داشتن بلیت چاپی یا بلیت دیجیتال روی گوشی به همراه کارت ملی الزامی است.',
      'درب‌های سالن ۳۰ دقیقه قبل از شروع سانس باز خواهند شد.'
    ],
    cast: [
      { name: 'علیرضا قربانی', role: 'خواننده' },
      { name: 'حسام ناصری', role: 'آهنگساز و رهبر ارکستر' },
      { name: 'پویا سرایی', role: 'نوازنده سنتور' },
      { name: 'مهرداد عالمی', role: 'نوازنده ویولنسل' }
    ],
    minPrice: 320000,
    maxPrice: 850000,
    bannerGradient: 'from-amber-600 via-stone-900 to-slate-950',
    accentColor: 'text-amber-400',
    isFeatured: true,
    isActive: true,
    runTurns: [
      {
        id: 'sans-101',
        eventId: 'event-1',
        date: '۱۴۰۵/۰۸/۱۸',
        time: '۱۸:۳۰',
        weekday: 'چهارشنبه',
        availableSeatsCount: 142,
        totalSeatsCount: 380,
      },
      {
        id: 'sans-102',
        eventId: 'event-1',
        date: '۱۴۰۵/۰۸/۱۸',
        time: '۲۱:۳۰',
        weekday: 'چهارشنبه',
        availableSeatsCount: 45,
        totalSeatsCount: 380,
      },
      {
        id: 'sans-103',
        eventId: 'event-1',
        date: '۱۴۰۵/۰۸/۱۹',
        time: '۱۹:۰۰',
        weekday: 'پنج‌شنبه',
        availableSeatsCount: 220,
        totalSeatsCount: 380,
      },
      {
        id: 'sans-104',
        eventId: 'event-1',
        date: '۱۴۰۵/۰۸/۱۹',
        time: '۲۱:۴۵',
        weekday: 'پنج‌شنبه',
        availableSeatsCount: 18,
        totalSeatsCount: 380,
      }
    ]
  },
  {
    id: 'event-2',
    title: 'تئاتر موزیکال بینوایان',
    subTitle: 'اقتباسی از رمان شاهکار ویکتور هوگو',
    category: 'theater',
    city: 'تهران',
    salonId: 'salon-2',
    salonName: 'تالار وحدت تهران',
    address: 'تهران - خیابان حافظ - خیابان استاد شهریار',
    dateRange: '۲۰ الی ۲۹ آبان ۱۴۰۵',
    durationMinutes: 135,
    description: 'نمایش موزیکال بینوایان با گروه کر ۶۰ نفره و ارکستر سمفونیک زنده. جلوه‌های ویژه بصری و طراحی دکور متحول‌کننده، بازآفرینی پاریس قرن نوزدهم با بازی درخشان هنرمندان مطرح کشور.',
    rules: [
      'عکس‌برداری و فیلم‌برداری حین اجرای نمایش اکیداً ممنوع است.',
      'لطفاً گوشی همراه خود را در حالت بی‌صدا قرار دهید.'
    ],
    cast: [
      { name: 'حسین پارسایی', role: 'کارگردان' },
      { name: 'بردیا کیارس', role: 'رهبر ارکستر' },
      { name: 'پارسا پیروزفر', role: 'ژان والژان' },
      { name: 'نوید محمدزاده', role: 'ژاور' },
      { name: 'پریناز ایزدیار', role: 'فانتین' }
    ],
    minPrice: 400000,
    maxPrice: 950000,
    bannerGradient: 'from-rose-800 via-neutral-900 to-slate-950',
    accentColor: 'text-rose-400',
    isFeatured: true,
    isActive: true,
    runTurns: [
      {
        id: 'sans-201',
        eventId: 'event-2',
        date: '۱۴۰۵/۰۸/۲۰',
        time: '۱۹:۳۰',
        weekday: 'جمعه',
        availableSeatsCount: 95,
        totalSeatsCount: 700,
      },
      {
        id: 'sans-202',
        eventId: 'event-2',
        date: '۱۴۰۵/۰۸/۲۱',
        time: '۱۹:۳۰',
        weekday: 'شنبه',
        availableSeatsCount: 310,
        totalSeatsCount: 700,
      }
    ]
  },
  {
    id: 'event-3',
    title: 'کنسرت همایون شجریان',
    subTitle: 'در هوای بی‌قراری - همراه با ارکستر سیاوش',
    category: 'concert',
    city: 'مشهد',
    salonId: 'salon-1',
    salonName: 'سالن همایش‌های شهرما مشهد',
    address: 'مشهد مقدس - میدان طالقانی - سالن شهرما',
    dateRange: '۲۵ الی ۲۸ آبان ۱۴۰۵',
    durationMinutes: 120,
    description: 'شب‌های خاطره‌انگیز موسیقی اصیل و تلفیقی ایران با نوای جادویی همایون شجریان. اجرای قطعات خاطره‌انگیز «آهای خبردار»، «چرا رفتی»، «ابر می‌بارد» و تصنیف‌های نوستالژیک استاد شجریان.',
    cast: [
      { name: 'همایون شجریان', role: 'خواننده' },
      { name: 'سهراب پورناظری', role: 'تنبور و کمانچه' },
      { name: 'آزاد میرزاپور', role: 'تار' },
      { name: 'حسین رضایی‌نیا', role: 'دف و دایره' }
    ],
    minPrice: 350000,
    maxPrice: 850000,
    bannerGradient: 'from-emerald-800 via-stone-900 to-slate-950',
    accentColor: 'text-emerald-400',
    isFeatured: true,
    isActive: true,
    runTurns: [
      {
        id: 'sans-301',
        eventId: 'event-3',
        date: '۱۴۰۵/۰۸/۲۵',
        time: '۱۸:۴۵',
        weekday: 'سه‌شنبه',
        availableSeatsCount: 165,
        totalSeatsCount: 380,
      },
      {
        id: 'sans-302',
        eventId: 'event-3',
        date: '۱۴۰۵/۰۸/۲۵',
        time: '۲۱:۳۰',
        weekday: 'سه‌شنبه',
        availableSeatsCount: 22,
        totalSeatsCount: 380,
      }
    ]
  },
  {
    id: 'event-4',
    title: 'استندآپ کمدی شب‌های خنده',
    subTitle: 'جنگ شادی و طنز اجتماعی با حضور برترین کمدین‌ها',
    category: 'comedy',
    city: 'مشهد',
    salonId: 'salon-1',
    salonName: 'سالن همایش‌های شهرما مشهد',
    address: 'مشهد - میدان طالقانی',
    dateRange: '۱۵ الی ۱۷ آبان ۱۴۰۵',
    durationMinutes: 100,
    description: 'شبی شاد و پر از خنده همراه با خانواده با حضور ستارگان کمدی و استندآپ، موسیقی شاد زنده و مسابقه‌های تعاملی با تماشاگران.',
    cast: [
      { name: 'حسن ریوندی', role: 'کمدین اصلی' },
      { name: 'امیر کربلایی‌زاده', role: 'استندآپ کمدین' },
      { name: 'گروه پاپ باران', role: 'اجرای موسیقی زنده' }
    ],
    minPrice: 200000,
    maxPrice: 550000,
    bannerGradient: 'from-orange-700 via-neutral-900 to-slate-950',
    accentColor: 'text-orange-400',
    isFeatured: false,
    isActive: true,
    runTurns: [
      {
        id: 'sans-401',
        eventId: 'event-4',
        date: '۱۴۰۵/۰۸/۱۵',
        time: '۲۰:۳۰',
        weekday: 'دوشنبه',
        availableSeatsCount: 88,
        totalSeatsCount: 380,
      }
    ]
  },
  {
    id: 'event-5',
    title: 'همایش ملی هوش مصنوعی و اقتصاد فردا',
    subTitle: 'بزرگترین گردهمایی مدیران ارشد فناوری و اکوسیستم استارتاپی',
    category: 'conference',
    city: 'تهران',
    salonId: 'salon-3',
    salonName: 'مرکز همایش‌های برج میلاد',
    address: 'تهران - بزرگراه همت - مرکز همایش‌های بین‌المللی میلاد',
    dateRange: '۳۰ آبان ۱۴۰۵',
    durationMinutes: 360,
    description: 'بررسی راهکارهای عملی هوش مصنوعی مولد در تحول زنجیره ارزش کسب‌وکارها، سخنرانی‌های کلیدی صاحب‌نظران بین‌المللی و پنل‌های تخصصی سرمایه‌گذاری خطرپذیر.',
    cast: [
      { name: 'دکتر محمدرضا آراسته', role: 'دبیر علمی همایش' },
      { name: 'مهندس سارا رستمی', role: 'مدیر پنل سرمایه‌گذاری' }
    ],
    minPrice: 650000,
    maxPrice: 900000,
    bannerGradient: 'from-indigo-800 via-slate-900 to-slate-950',
    accentColor: 'text-indigo-400',
    isFeatured: false,
    isActive: true,
    runTurns: [
      {
        id: 'sans-501',
        eventId: 'event-5',
        date: '۱۴۰۵/۰۸/۳۰',
        time: '۰۹:۰۰',
        weekday: 'پنج‌شنبه',
        availableSeatsCount: 410,
        totalSeatsCount: 1600,
      }
    ]
  },
  {
    id: 'event-6',
    title: 'اکران ویژه VIP فیلم سینمایی مست عشق',
    subTitle: 'اکران اختصاصی همراه با نشست نقد و بررسی با حضور بازیگران',
    category: 'cinema',
    city: 'تهران',
    salonId: 'salon-2',
    salonName: 'تالار وحدت تهران',
    address: 'تهران - خیابان حافظ',
    dateRange: '۲۳ آبان ۱۴۰۵',
    durationMinutes: 130,
    description: 'اکران ویژه و خصوصی فیلم سینمایی مست عشق (روایتی از زندگی مولانا و شمس تبریزی) به همراه فرش قرمز و عکس یادگاری با بازیگران برجسته ایران و ترکیه.',
    cast: [
      { name: 'حسن فتحی', role: 'کارگردان' },
      { name: 'شهاب حسینی', role: 'شمس تبریزی' },
      { name: 'پارسا پیروزفر', role: 'مولانا' }
    ],
    minPrice: 300000,
    maxPrice: 700000,
    bannerGradient: 'from-cyan-800 via-neutral-900 to-slate-950',
    accentColor: 'text-cyan-400',
    isFeatured: false,
    isActive: true,
    runTurns: [
      {
        id: 'sans-601',
        eventId: 'event-6',
        date: '۱۴۰۵/۰۸/۲۳',
        time: '۱۷:۰۰',
        weekday: 'چهارشنبه',
        availableSeatsCount: 180,
        totalSeatsCount: 700,
      }
    ]
  }
];

export const MOCK_DISCOUNT_CODES: DiscountCode[] = [
  {
    code: 'GISHOW20',
    discountPercent: 20,
    description: '۲۰٪ تخفیف ویژه کاربران سامانه گیشو'
  },
  {
    code: 'NOROOZ',
    fixedAmount: 50000,
    description: '۵۰,۰۰۰ تومان تخفیف هدیه'
  },
  {
    code: 'VIPCLUB',
    discountPercent: 15,
    description: '۱۵٪ تخفیف اعضای باشگاه مشتریان'
  }
];

// Seeded factors for demo and instant Ticket Checker testing
export const INITIAL_FACTORS: FactorItem[] = [
  {
    factorNumber: 'GSH-849201',
    trackingCode: 'TRK-983412',
    refId: 'MEL-184920491',
    event: MOCK_EVENTS[0],
    runTurn: MOCK_EVENTS[0].runTurns[0],
    salon: MOCK_SALONS[0],
    seats: [
      { id: 'chair-vip-1-5', partId: 'part-vip', partName: 'جایگاه ویژه (VIP)', row: 1, number: 5, price: 850000, status: 'sold' },
      { id: 'chair-vip-1-6', partId: 'part-vip', partName: 'جایگاه ویژه (VIP)', row: 1, number: 6, price: 850000, status: 'sold' }
    ],
    customerName: 'رضا کمالی فر',
    customerMobile: '09121112233',
    customerNationalCode: '0923485721',
    subtotal: 1700000,
    discountAmount: 340000,
    finalAmount: 1360000,
    discountCode: 'GISHOW20',
    paymentGateway: 'mellat',
    paidAt: '۱۴۰۵/۰۸/۱۵ - ۱۱:۳۰',
    qrPayload: 'GISHOW:GSH-849201:E1:S101:CH-1-5,1-6',
    isCheckedIn: false
  },
  {
    factorNumber: 'GSH-739105',
    trackingCode: 'TRK-582019',
    refId: 'PAR-920485721',
    event: MOCK_EVENTS[0],
    runTurn: MOCK_EVENTS[0].runTurns[0],
    salon: MOCK_SALONS[0],
    seats: [
      { id: 'chair-gc-3-10', partId: 'part-ground-center', partName: 'همکف وسط', row: 3, number: 10, price: 650000, status: 'sold' }
    ],
    customerName: 'فاطمه موسوی',
    customerMobile: '09358889900',
    customerNationalCode: '0019284756',
    subtotal: 650000,
    discountAmount: 0,
    finalAmount: 650000,
    paymentGateway: 'parsian',
    paidAt: '۱۴۰۵/۰۸/۱۵ - ۱۴:۲۲',
    qrPayload: 'GISHOW:GSH-739105:E1:S101:CH-3-10',
    isCheckedIn: true,
    checkedInAt: '۱۴۰۵/۰۸/۱۸ - ۱۸:۱۰'
  }
];

export const MOCK_MALI_RECORDS: import('../types').MaliRecord[] = [
  {
    id: 'mali-1',
    eventTitle: 'کنسرت بزرگ ارکسترال علیرضا قربانی',
    producerName: 'موسسه فرهنگی هنری آوای باران',
    runTurnDate: '۱۸ آبان ۱۴۰۵ (سانس ۱)',
    totalGrossSale: 247000000,
    commissionPercent: 4.5,
    commissionAmount: 11115000,
    taxAmount: 1000350,
    netPayableToProducer: 234884650,
    shebaNumber: 'IR680120000000001234567890',
    status: 'settled',
    settledDate: '۱۴۰۵/۰۸/۱۹ - ۱۰:۳۰',
    trackingNumber: 'PAY-83920194'
  },
  {
    id: 'mali-2',
    eventTitle: 'کنسرت بزرگ ارکسترال علیرضا قربانی',
    producerName: 'موسسه فرهنگی هنری آوای باران',
    runTurnDate: '۱۹ آبان ۱۴۰۵ (سانس ۲)',
    totalGrossSale: 247000000,
    commissionPercent: 4.5,
    commissionAmount: 11115000,
    taxAmount: 1000350,
    netPayableToProducer: 234884650,
    shebaNumber: 'IR680120000000001234567890',
    status: 'processing',
    trackingNumber: 'PAY-83920205'
  },
  {
    id: 'mali-3',
    eventTitle: 'نمایش کمدی موزیکال «خواستگاری پرماجرا»',
    producerName: 'گروه تئاتر صحنه نو مشهد',
    runTurnDate: '۲۲ آبان ۱۴۰۵',
    totalGrossSale: 85000000,
    commissionPercent: 5.0,
    commissionAmount: 4250000,
    taxAmount: 382500,
    netPayableToProducer: 80367500,
    shebaNumber: 'IR120560000000009876543210',
    status: 'pending'
  }
];

export const MOCK_ARTISTS: import('../types').ArtistMember[] = [
  {
    id: 'art-1',
    name: 'علیرضا قربانی',
    role: 'خواننده',
    bio: 'خواننده صاحب‌نام موسیقی سنتی و اصیل ایرانی، دارنده تندیس بهترین اجرای موسیقی معاصر.',
    assignedEvents: ['کنسرت بزرگ ارکسترال علیرضا قربانی']
  },
  {
    id: 'art-2',
    name: 'حسام ناصری',
    role: 'سرپرست ارکستر',
    bio: 'آهنگساز، تنظیم‌کننده و سرپرست ارکستر پروژه‌های با من بخوان و صدای شب.',
    assignedEvents: ['کنسرت بزرگ ارکسترال علیرضا قربانی']
  },
  {
    id: 'art-3',
    name: 'محمدرضا هدایتی',
    role: 'بازیگر',
    bio: 'بازیگر و خواننده شناخته شده سینما و تلویزیون، بازیگر نقش اول نمایش موزیکال.',
    assignedEvents: ['نمایش کمدی موزیکال «خواستگاری پرماجرا»']
  },
  {
    id: 'art-4',
    name: 'کیوان کلهر',
    role: 'نوازنده',
    bio: 'استاد برجسته کمانچه و آهنگساز بین‌المللی موسیقی سنتی.',
    assignedEvents: ['شب تکنوازی کمانچه استاد کلهر']
  }
];

export const MOCK_BANK_TERMINALS: import('../types').BankTerminalConfig[] = [
  {
    id: 'term-1',
    bankName: 'به‌پرداخت ملت',
    terminalId: '7481920',
    merchantId: '9823411',
    userName: 'gishow_melat_user',
    isActive: true,
    isDefault: true
  },
  {
    id: 'term-2',
    bankName: 'تجارت الکترونیک پارسیان',
    terminalId: '4920158',
    merchantId: '8271043',
    userName: 'gishow_parsian_gw',
    isActive: true,
    isDefault: false
  },
  {
    id: 'term-3',
    bankName: 'زرین‌پال',
    terminalId: 'zarin_merchant_live',
    merchantId: '98410294-8192-4820-9182',
    isActive: true,
    isDefault: false
  }
];

export const MOCK_DOCUMENTS: import('../types').ProducerDocument[] = [
  {
    id: 'doc-1',
    producerName: 'موسسه فرهنگی هنری آوای باران',
    eventName: 'کنسرت بزرگ علیرضا قربانی',
    docType: 'مجوز فرهنگ و ارشاد اسلامی',
    fileName: 'mojavvez_ershad_ghorbani_1405.pdf',
    uploadDate: '۱۴۰۵/۰۷/۱۰',
    status: 'approved'
  },
  {
    id: 'doc-2',
    producerName: 'موسسه فرهنگی هنری آوای باران',
    eventName: 'کنسرت بزرگ علیرضا قربانی',
    docType: 'مجوز اداره اماکن',
    fileName: 'mojavvez_amaken_salone_shahr_ma.pdf',
    uploadDate: '۱۴۰۵/۰۷/۱۴',
    status: 'approved'
  },
  {
    id: 'doc-3',
    producerName: 'گروه تئاتر صحنه نو مشهد',
    eventName: 'خواستگاری پرماجرا',
    docType: 'قرارداد اجاره سالن',
    fileName: 'gharardad_salone_shahr_ma_theater.pdf',
    uploadDate: '۱۴۰۵/۰۷/۲۵',
    status: 'approved'
  },
  {
    id: 'doc-4',
    producerName: 'شرکت همایش‌آوران نوین',
    eventName: 'سمینار هوش مصنوعی و کسب‌وکار',
    docType: 'کارت ملی تهیه‌کننده',
    fileName: 'kart_melli_modir_amell.jpg',
    uploadDate: '۱۴۰۵/۰۸/۰۱',
    status: 'pending_review'
  }
];

export const DEFAULT_SITE_SETTINGS: import('../types').SiteSettings = {
  siteName: 'سامانه رزرواسیون و فروش آنلاین بلیت گیشو',
  siteEnName: 'Gishow Ticket Reservation System',
  supportPhone: '۰۵۱-۳۸۴۵۱۱۲۰',
  supportMobile: '۰۹۱۵۲۴۵۴۶۱۲',
  officeAddress: 'مشهد مقدس - میدان طالقانی - مجموعه فرهنگی هنری شهرما',
  smsProvider: 'kavenegar',
  smsApiKey: '7391084275910248592038475019284759',
  smsPatternCode: 'gishow-ticket-confirm',
  vatTaxPercent: 9,
  defaultCommissionPercent: 4.5,
  reservationLockMinutes: 10,
  metaDescription: 'گیشو: معتبرترین سامانه خرید آنلاین بلیت کنسرت، تئاتر، همایش و سینما در مشهد و سراسر کشور.'
};

export const INITIAL_COOPERATE_REQUESTS: import('../types').CooperateRequest[] = [
  {
    id: 'coop-1',
    organizerName: 'موسسه آوای ماندگار شرق',
    phone: '09153112233',
    eventTitle: 'کنسرت پاپ آرون افشار',
    category: 'concert',
    city: 'مشهد',
    preferredSalon: 'سالن همایش‌های شهرما مشهد',
    estimatedAudience: 1200,
    description: 'درخواست فروش بلیت ۳ سانس کنسرت در آذرماه ۱۴۰۵.',
    createdAt: '۱۴۰۵/۰۸/۱۲'
  }
];

export const MOCK_USERS: import('../types').UserAccount[] = [
  {
    id: 'usr-1',
    fullName: 'مهندس حسینی (مدیر سیستم)',
    mobile: '09152454612',
    nationalCode: '0921457812',
    role: 'super_admin',
    isActive: true,
    registeredAt: '۱۴۰۴/۰۶/۱۵',
    ticketsCount: 0,
    totalPurchasedAmount: 0
  },
  {
    id: 'usr-2',
    fullName: 'موسسه آوای باران (مهندس کمالی)',
    mobile: '09121112233',
    nationalCode: '0019284756',
    role: 'producer',
    isActive: true,
    registeredAt: '۱۴۰۵/۰۱/۲۰',
    ticketsCount: 0,
    totalPurchasedAmount: 0
  },
  {
    id: 'usr-3',
    fullName: 'اپراتور گیت ورودی ۱ (سالن شهرما)',
    mobile: '09358889900',
    nationalCode: '0943827164',
    role: 'gate_checker',
    isActive: true,
    registeredAt: '۱۴۰۵/۰۲/۱۰',
    ticketsCount: 0,
    totalPurchasedAmount: 0
  },
  {
    id: 'usr-4',
    fullName: 'علیرضا رادمنش',
    mobile: '09123456789',
    nationalCode: '0082736451',
    role: 'customer',
    isActive: true,
    registeredAt: '۱۴۰۵/۰۵/۱۴',
    ticketsCount: 4,
    totalPurchasedAmount: 2850000
  },
  {
    id: 'usr-5',
    fullName: 'سارا سعادت',
    mobile: '09361234567',
    nationalCode: '0918273645',
    role: 'customer',
    isActive: true,
    registeredAt: '۱۴۰۵/۰۷/۰۱',
    ticketsCount: 2,
    totalPurchasedAmount: 1300000
  },
  {
    id: 'usr-6',
    fullName: 'محسن کریمی (مسدود شده)',
    mobile: '09909876543',
    nationalCode: '0928374650',
    role: 'customer',
    isActive: false,
    registeredAt: '۱۴۰۵/۰۸/۰۲',
    ticketsCount: 1,
    totalPurchasedAmount: 650000
  }
];

