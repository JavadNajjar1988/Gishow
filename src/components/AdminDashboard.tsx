import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  DollarSign,
  Plus,
  ArrowRight,
  Building,
  Landmark,
  Users,
  CreditCard,
  FileCheck,
  Settings,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
  Check,
  Search,
  Trash2,
  UserPlus,
  Eye,
  Shield,
  Tag,
  X,
  UserX,
  UserCheck,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Store,
  Edit3,
  Sliders,
  RotateCcw,
  MapPin,
  Crown,
  Compass,
  MessageSquare,
  Send,
  Percent,
  Flame,
  Copy
} from 'lucide-react';
import { ChairIcon } from './ChairIcon';
import { SalonPlanBuilderModal } from './SalonPlanBuilderModal';
import {
  EventItem,
  FactorItem,
  Salon,
  MaliRecord,
  ArtistMember,
  BankTerminalConfig,
  ProducerDocument,
  SiteSettings,
  UserAccount,
  UserRole,
  PartOfSalon,
  RunTurn,
  DiscountCode
} from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import {
  MOCK_MALI_RECORDS,
  MOCK_ARTISTS,
  MOCK_BANK_TERMINALS,
  MOCK_DOCUMENTS,
  DEFAULT_SITE_SETTINGS,
  MOCK_USERS,
  MOCK_DISCOUNT_CODES
} from '../data/mockData';

interface AdminDashboardProps {
  theme: 'light' | 'dark';
  events: EventItem[];
  factors: FactorItem[];
  salons: Salon[];
  discountCodes?: DiscountCode[];
  onAddDiscountCode?: (code: DiscountCode) => void;
  onUpdateDiscountCode?: (updated: DiscountCode) => void;
  onDeleteDiscountCode?: (codeId: string) => void;
  onBackToPortal: () => void;
  onAddEvent: (newEvent: EventItem) => void;
  onAddSalon?: (newSalon: Salon) => void;
  onUpdateSalon?: (updated: Salon) => void;
  onDeleteSalon?: (salonId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  onUpdateEvent?: (updated: EventItem) => void;
  onToggleTheme?: () => void;
  onOpenBoxOffice?: () => void;
  onOpenProducer?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  theme,
  events,
  factors,
  salons,
  discountCodes,
  onAddDiscountCode,
  onUpdateDiscountCode,
  onDeleteDiscountCode,
  onBackToPortal,
  onAddEvent,
  onAddSalon,
  onUpdateSalon,
  onDeleteSalon,
  onDeleteEvent,
  onUpdateEvent,
  onToggleTheme,
  onOpenBoxOffice,
  onOpenProducer,
}) => {
  const isDark = theme === 'dark';

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'salons'
    | 'events'
    | 'producer_hub'
    | 'users'
    | 'chair_block'
    | 'factors'
    | 'mali'
    | 'artists'
    | 'terminals'
    | 'documents'
    | 'discounts'
    | 'settings'
  >('overview');

  // Search queries per section
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddSalonModal, setShowAddSalonModal] = useState(false);
  const [showPlanBuilderModal, setShowPlanBuilderModal] = useState(false);
  const [editingSalonForBuilder, setEditingSalonForBuilder] = useState<Salon | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSansModal, setShowAddSansModal] = useState<EventItem | null>(null);
  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [viewSalonPlan, setViewSalonPlan] = useState<Salon | null>(null);

  // Discounts state & management
  const [internalDiscounts, setInternalDiscounts] = useState<DiscountCode[]>(discountCodes || MOCK_DISCOUNT_CODES);
  const activeDiscounts = discountCodes || internalDiscounts;
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscDesc, setNewDiscDesc] = useState('');
  const [newDiscType, setNewDiscType] = useState<'percent' | 'fixed'>('percent');
  const [newDiscValue, setNewDiscValue] = useState<number>(20);
  const [newDiscEventId, setNewDiscEventId] = useState<string>('all');
  const [newDiscMaxUsage, setNewDiscMaxUsage] = useState<number>(100);
  const [newDiscMinOrder, setNewDiscMinOrder] = useState<number>(0);
  const [newDiscExpiry, setNewDiscExpiry] = useState<string>('۱۴۰۵/۱۰/۳۰');
  const [copiedCodeToast, setCopiedCodeToast] = useState<string | null>(null);

  // New Sans Modal Sold Out option
  const [newSansIsSoldOut, setNewSansIsSoldOut] = useState<boolean>(false);

  // Producer Hub State (اختصاصی تهیه‌کننده و مدیر برنامه)
  const [producerSelectedEventId, setProducerSelectedEventId] = useState<string>(events[0]?.id || '');
  const [producerSubTab, setProducerSubTab] = useState<'analytics' | 'sanses' | 'holds' | 'attendees' | 'discounts' | 'sms' | 'settlement'>('analytics');
  const [producerEventPromoCode, setProducerEventPromoCode] = useState('');
  const [producerEventPromoPercent, setProducerEventPromoPercent] = useState(20);
  const [producerEventPromoCount, setProducerEventPromoCount] = useState(100);
  const [producerPromoCodes, setProducerPromoCodes] = useState<Array<{ code: string; percent: number; usedCount: number; maxCount: number }>>([
    { code: 'PRODUCERVIP', percent: 20, usedCount: 38, maxCount: 100 },
    { code: 'SPECIAL15', percent: 15, usedCount: 54, maxCount: 150 },
  ]);
  const [producerSmsText, setProducerSmsText] = useState('');
  const [producerSmsSuccess, setProducerSmsSuccess] = useState(false);
  const [producerSettlementSuccess, setProducerSettlementSuccess] = useState(false);
  const [producerHoldSeatInput, setProducerHoldSeatInput] = useState('');
  const [producerHeldSeats, setProducerHeldSeats] = useState<string[]>([
    'vip-r1-s1', 'vip-r1-s2', 'vip-r1-s3', 'vip-r1-s4'
  ]);
  const [eventSalesPaused, setEventSalesPaused] = useState<Record<string, boolean>>({});

  // Producer Memoized Calculations
  const producerEvent = useMemo(() => {
    return events.find((e) => e.id === producerSelectedEventId) || events[0];
  }, [events, producerSelectedEventId]);

  const producerSalon = useMemo(() => {
    if (!producerEvent) return salons[0];
    return salons.find((s) => s.id === producerEvent.salonId) || salons[0];
  }, [salons, producerEvent]);

  const producerFactors = useMemo(() => {
    if (!producerEvent) return [];
    return factors.filter((f) => f.event.id === producerEvent.id);
  }, [factors, producerEvent]);

  const producerGrossSale = producerFactors.reduce((acc, f) => acc + f.finalAmount, 0);
  const producerCommission = Math.round((producerGrossSale * 4) / 100);
  const producerNet = producerGrossSale - producerCommission - Math.round((producerCommission * 9) / 100);
  const producerTicketsSold = producerFactors.reduce((acc, f) => acc + f.seats.length, 0);
  const producerTotalCap = (producerEvent?.runTurns?.length || 1) * (producerSalon?.capacity || 400);
  const producerOccupancy = producerTotalCap > 0 ? Math.min(100, Math.round((producerTicketsSold / producerTotalCap) * 100)) : 0;

  // Users State (UserListsController)
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserNationalCode, setNewUserNationalCode] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('customer');

  // Salon Builder Form State (Salons/Create & Floorplan Designer)
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonCity, setNewSalonCity] = useState('مشهد');
  const [newSalonAddress, setNewSalonAddress] = useState('');
  const [newSalonLayoutType, setNewSalonLayoutType] = useState<'horseshoe' | 'proscenium' | 'amphitheater'>('horseshoe');
  const [builderPreviewTab, setBuilderPreviewTab] = useState<'blueprint' | 'chairs'>('blueprint');
  const [newSalonParts, setNewSalonParts] = useState<
    Array<{
      id: string;
      name: string;
      tier: 'vip' | 'ground' | 'balcony' | 'lodge';
      position: 'front' | 'center' | 'right' | 'left' | 'balcony' | 'lodge';
      rows: number;
      seatsPerRow: number;
      startRow: number;
      price: number;
    }>
  >([
    { id: 'p1', name: 'جایگاه ویژه VIP', tier: 'vip', position: 'front', rows: 3, seatsPerRow: 14, startRow: 1, price: 850000 },
    { id: 'p2', name: 'همکف مرکزی', tier: 'ground', position: 'center', rows: 7, seatsPerRow: 10, startRow: 4, price: 650000 },
    { id: 'p3', name: 'همکف بال راست', tier: 'ground', position: 'right', rows: 7, seatsPerRow: 6, startRow: 4, price: 550000 },
    { id: 'p4', name: 'همکف بال چپ', tier: 'ground', position: 'left', rows: 7, seatsPerRow: 6, startRow: 4, price: 550000 },
    { id: 'p5', name: 'بالکن طبقه اول', tier: 'balcony', position: 'balcony', rows: 4, seatsPerRow: 16, startRow: 11, price: 380000 },
  ]);

  // New Event Form State (BarnameController / Barname/Create)
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'concert' | 'theater' | 'comedy' | 'conference' | 'cinema'>('concert');
  const [newCity, setNewCity] = useState('مشهد');
  const [newSalonId, setNewSalonId] = useState(salons[0]?.id || '');
  const [newMinPrice, setNewMinPrice] = useState(350000);
  const [newDateRange, setNewDateRange] = useState('۱۵ الی ۲۰ آذر ۱۴۰۵');
  const [newDescription, setNewDescription] = useState('');

  // New Sans Form State
  const [newSansDate, setNewSansDate] = useState('۱۴۰۵/۰۹/۲۰');
  const [newSansTime, setNewSansTime] = useState('۱۹:۰۰');
  const [newSansWeekday, setNewSansWeekday] = useState('پنج‌شنبه');

  // States for Gishow original modules
  const [maliRecords, setMaliRecords] = useState<MaliRecord[]>(MOCK_MALI_RECORDS);
  const [artists, setArtists] = useState<ArtistMember[]>(MOCK_ARTISTS);
  const [terminals, setTerminals] = useState<BankTerminalConfig[]>(MOCK_BANK_TERMINALS);
  const [documents, setDocuments] = useState<ProducerDocument[]>(MOCK_DOCUMENTS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Chair Blocking State (ChairForBarnameController)
  const [selectedBarnameForChair, setSelectedBarnameForChair] = useState<string>(events[0]?.id || '');
  const [blockedSeatIds, setBlockedSeatIds] = useState<string[]>(['vip-1-1', 'vip-1-2', 'vip-1-3', 'vip-1-4']);

  // New Artist Form State
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistRole, setNewArtistRole] = useState<'خواننده' | 'کارگردان' | 'بازیگر' | 'سرپرست ارکستر' | 'نوازنده'>('خواننده');
  const [newArtistBio, setNewArtistBio] = useState('');

  // Metrics
  const totalRevenue = factors.reduce((acc, curr) => acc + curr.finalAmount, 0);
  const totalTicketsSold = factors.reduce((acc, curr) => acc + curr.seats.length, 0);
  const totalSeatsCapacity = salons.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalSansCount = events.reduce((acc, curr) => acc + curr.runTurns.length, 0);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchQuery === '' ||
        u.fullName.includes(searchQuery) ||
        u.mobile.includes(searchQuery) ||
        (u.nationalCode && u.nationalCode.includes(searchQuery));
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, userRoleFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      return (
        searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city.includes(searchQuery)
      );
    });
  }, [events, searchQuery]);

  // Open Create Salon Modal (Architectural Visual Plan Builder)
  const handleOpenCreateSalon = () => {
    setEditingSalonForBuilder(null);
    setShowPlanBuilderModal(true);
  };

  // Open Edit Salon Modal (Architectural Visual Plan Builder)
  const handleOpenEditSalon = (salon: Salon) => {
    setEditingSalonForBuilder(salon);
    setShowPlanBuilderModal(true);
  };

  // Save Salon from Architectural Plan Builder
  const handleSaveSalonFromBuilder = (savedSalon: Salon) => {
    if (editingSalonForBuilder) {
      if (onUpdateSalon) onUpdateSalon(savedSalon);
    } else {
      if (onAddSalon) onAddSalon(savedSalon);
    }
    setShowPlanBuilderModal(false);
    setEditingSalonForBuilder(null);
  };

  // Add Part to Salon
  const handleAddPart = () => {
    const nextIdx = newSalonParts.length + 1;
    setNewSalonParts((prev) => [
      ...prev,
      {
        id: `part-${Date.now()}`,
        name: `جایگاه ردیف‌های جدید ${nextIdx}`,
        tier: 'ground',
        position: 'center',
        rows: 5,
        seatsPerRow: 10,
        startRow: 1,
        price: 500000,
      },
    ]);
  };

  // Remove Part from Salon
  const handleRemovePart = (index: number) => {
    if (newSalonParts.length <= 1) {
      alert('حداقل یک جایگاه یا بخش برای سالن باید تعریف شده باشد.');
      return;
    }
    setNewSalonParts((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Apply Blueprint Preset
  const handleApplyPreset = (preset: 'horseshoe' | 'theater' | 'cinema') => {
    if (preset === 'horseshoe') {
      setNewSalonLayoutType('horseshoe');
      setNewSalonParts([
        { id: `p-${Date.now()}-1`, name: 'جایگاه ویژه (VIP)', tier: 'vip', position: 'front', rows: 3, seatsPerRow: 14, startRow: 1, price: 850000 },
        { id: `p-${Date.now()}-2`, name: 'همکف مرکزی', tier: 'ground', position: 'center', rows: 7, seatsPerRow: 10, startRow: 4, price: 650000 },
        { id: `p-${Date.now()}-3`, name: 'همکف بال راست', tier: 'ground', position: 'right', rows: 7, seatsPerRow: 6, startRow: 4, price: 550000 },
        { id: `p-${Date.now()}-4`, name: 'همکف بال چپ', tier: 'ground', position: 'left', rows: 7, seatsPerRow: 6, startRow: 4, price: 550000 },
        { id: `p-${Date.now()}-5`, name: 'بالکن طبقه اول', tier: 'balcony', position: 'balcony', rows: 4, seatsPerRow: 16, startRow: 11, price: 380000 },
      ]);
    } else if (preset === 'theater') {
      setNewSalonLayoutType('proscenium');
      setNewSalonParts([
        { id: `p-${Date.now()}-1`, name: 'همکف ارکستر جلو', tier: 'vip', position: 'front', rows: 4, seatsPerRow: 16, startRow: 1, price: 750000 },
        { id: `p-${Date.now()}-2`, name: 'همکف میانی اصلی', tier: 'ground', position: 'center', rows: 8, seatsPerRow: 18, startRow: 5, price: 600000 },
        { id: `p-${Date.now()}-3`, name: 'لژ اختصاصی راست', tier: 'lodge', position: 'right', rows: 2, seatsPerRow: 4, startRow: 1, price: 900000 },
        { id: `p-${Date.now()}-4`, name: 'لژ اختصاصی چپ', tier: 'lodge', position: 'left', rows: 2, seatsPerRow: 4, startRow: 1, price: 900000 },
        { id: `p-${Date.now()}-5`, name: 'بالکن فوقانی تالار', tier: 'balcony', position: 'balcony', rows: 5, seatsPerRow: 20, startRow: 13, price: 400000 },
      ]);
    } else {
      setNewSalonLayoutType('amphitheater');
      setNewSalonParts([
        { id: `p-${Date.now()}-1`, name: 'ردیف‌های پیشین سن (A)', tier: 'vip', position: 'front', rows: 4, seatsPerRow: 14, startRow: 1, price: 500000 },
        { id: `p-${Date.now()}-2`, name: 'ردیف‌های میانی سالن (B)', tier: 'ground', position: 'center', rows: 8, seatsPerRow: 18, startRow: 5, price: 400000 },
        { id: `p-${Date.now()}-3`, name: 'ردیف‌های بالایی سالن (C)', tier: 'ground', position: 'balcony', rows: 6, seatsPerRow: 20, startRow: 13, price: 300000 },
      ]);
    }
  };

  // Save Salon & Floorplan Handler
  const handleSaveSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalonName) return;

    const totalCap = newSalonParts.reduce((acc, p) => acc + p.rows * p.seatsPerRow, 0);
    const targetId = editingSalonId || `salon-${Date.now()}`;
    const salonObj: Salon = {
      id: targetId,
      name: newSalonName,
      city: newSalonCity,
      address: newSalonAddress || `${newSalonCity} - خیابان اصلی`,
      capacity: totalCap,
      parts: newSalonParts.map((p, idx) => ({
        id: p.id || `part-${Date.now()}-${idx}`,
        salonId: targetId,
        name: p.name,
        tier: p.tier,
        rows: Number(p.rows),
        seatsPerRow: Number(p.seatsPerRow),
        price: Number(p.price),
      })),
    };

    if (editingSalonId) {
      if (onUpdateSalon) {
        onUpdateSalon(salonObj);
      }
    } else {
      if (onAddSalon) {
        onAddSalon(salonObj);
      }
    }
    setShowAddSalonModal(false);
    setEditingSalonId(null);
    setNewSalonName('');
    setNewSalonAddress('');
  };

  // Create Event Handler
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const chosenSalon = salons.find((s) => s.id === newSalonId) || salons[0];
    const created: EventItem = {
      id: `event-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      city: newCity,
      salonId: chosenSalon.id,
      salonName: chosenSalon.name,
      address: chosenSalon.address,
      dateRange: newDateRange,
      durationMinutes: 110,
      description: newDescription || 'رویداد فرهنگی و هنری جدید ثبت شده در سامانه گیشو.',
      cast: [{ name: 'هنرمند اصلی', role: 'اجرا' }],
      minPrice: Number(newMinPrice),
      maxPrice: Number(newMinPrice) * 2,
      bannerGradient: 'from-amber-700 via-stone-900 to-slate-950',
      accentColor: 'text-amber-400',
      isActive: true,
      runTurns: [
        {
          id: `sans-${Date.now()}-1`,
          eventId: `event-${Date.now()}`,
          date: '۱۴۰۵/۰۹/۱۵',
          time: '۱۹:۰۰',
          weekday: 'پنج‌شنبه',
          availableSeatsCount: chosenSalon.capacity,
          totalSeatsCount: chosenSalon.capacity,
        },
      ],
    };

    onAddEvent(created);
    setShowAddEventModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Create User Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserMobile) return;

    const createdUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: newUserName,
      mobile: newUserMobile,
      nationalCode: newUserNationalCode || '---',
      role: newUserRole,
      isActive: true,
      registeredAt: '۱۴۰۵/۰۸/۲۴',
      ticketsCount: 0,
      totalPurchasedAmount: 0,
    };

    setUsers((prev) => [createdUser, ...prev]);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserMobile('');
    setNewUserNationalCode('');
  };

  // Add Sans Handler
  const handleAddSansToEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddSansModal) return;

    const targetEvent = showAddSansModal;
    const chosenSalon = salons.find((s) => s.id === targetEvent.salonId) || salons[0];
    const newSans: RunTurn = {
      id: `sans-${Date.now()}`,
      eventId: targetEvent.id,
      date: newSansDate,
      time: newSansTime,
      weekday: newSansWeekday,
      availableSeatsCount: newSansIsSoldOut ? 0 : chosenSalon.capacity,
      totalSeatsCount: chosenSalon.capacity,
      isSoldOut: newSansIsSoldOut,
    };

    const updated = {
      ...targetEvent,
      runTurns: [...targetEvent.runTurns, newSans],
    };

    if (onUpdateEvent) {
      onUpdateEvent(updated);
    }
    setShowAddSansModal(null);
    setNewSansIsSoldOut(false);
  };

  // Toggle Event Sold Out Status
  const handleToggleEventSoldOut = (evt: EventItem) => {
    if (!onUpdateEvent) return;
    const isNowSoldOut = !evt.isSoldOut;
    onUpdateEvent({
      ...evt,
      isSoldOut: isNowSoldOut,
      runTurns: evt.runTurns.map((rt) => ({
        ...rt,
        isSoldOut: isNowSoldOut,
        availableSeatsCount: isNowSoldOut ? 0 : rt.totalSeatsCount,
      })),
    });
  };

  // Create Discount Code
  const handleCreateDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscCode.trim()) return;

    const chosenEvent = events.find((ev) => ev.id === newDiscEventId);
    const newDiscount: DiscountCode = {
      id: `disc-${Date.now()}`,
      code: newDiscCode.trim().toUpperCase(),
      description: newDiscDesc.trim() || `تخفیف ${newDiscType === 'percent' ? `${newDiscValue}٪` : formatPrice(newDiscValue)}`,
      discountPercent: newDiscType === 'percent' ? Number(newDiscValue) : undefined,
      fixedAmount: newDiscType === 'fixed' ? Number(newDiscValue) : undefined,
      eventId: newDiscEventId,
      eventTitle: chosenEvent?.title,
      maxUsage: Number(newDiscMaxUsage),
      usedCount: 0,
      minOrderAmount: Number(newDiscMinOrder) || undefined,
      expiresAt: newDiscExpiry,
      isActive: true,
    };

    if (onAddDiscountCode) {
      onAddDiscountCode(newDiscount);
    } else {
      setInternalDiscounts((prev) => [newDiscount, ...prev]);
    }

    setShowAddDiscountModal(false);
    setNewDiscCode('');
    setNewDiscDesc('');
    setNewDiscValue(20);
  };

  // Toggle Discount Code Active/Inactive
  const handleToggleDiscountActive = (item: DiscountCode) => {
    const updated: DiscountCode = { ...item, isActive: item.isActive === false ? true : false };
    if (onUpdateDiscountCode) {
      onUpdateDiscountCode(updated);
    } else {
      setInternalDiscounts((prev) => prev.map((d) => (d.code === item.code ? updated : d)));
    }
  };

  // Delete Discount Code
  const handleDeleteDiscount = (code: string) => {
    if (onDeleteDiscountCode) {
      onDeleteDiscountCode(code);
    } else {
      setInternalDiscounts((prev) => prev.filter((d) => d.code !== code));
    }
  };

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'مدیر ارشد سامانه', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    producer: { label: 'تهیه‌کننده و مجری', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    gate_checker: { label: 'اپراتور گیت چکر', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    customer: { label: 'خریدار عادی', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navigation & Workspace Header */}
      <header className={`border-b sticky top-0 z-30 transition-colors backdrop-blur-md ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo & Mode */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black">داشبورد جامع مدیریت لیندو تیکت</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  LinduTicket Core v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                سیستم یکپارچه مدیریت سالن‌ها، رویدادها، کاربران، گیت چکر و تسویه مالی
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2.5">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="تغییر تم"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {onOpenBoxOffice && (
              <button
                onClick={onOpenBoxOffice}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="صدور مستقیم بلیت و ثبت کارتخوان POS در گیشه سالن"
              >
                <Store className="w-3.5 h-3.5" />
                <span>گیشه مجازی (POS)</span>
              </button>
            )}

            {onOpenProducer && (
              <button
                onClick={onOpenProducer}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
                title="ورود به پنل و کنسول اختصاصی اختیارات تهیه‌کننده و مدیر برنامه"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>کنسول تهیه‌کننده</span>
              </button>
            )}

            <button
              onClick={handleOpenCreateSalon}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Building className="w-3.5 h-3.5" />
              <span>ایجاد سالن جدید</span>
            </button>

            <button
              onClick={() => setShowAddEventModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تعریف رویداد جدید</span>
            </button>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>افزودن کاربر</span>
            </button>

            <button
              onClick={onBackToPortal}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به پرتال</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs Bar */}
        <div className={`flex items-center gap-2 border-b pb-3 text-xs font-bold overflow-x-auto scrollbar-none ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {[
            { id: 'overview', label: '📊 نمای کلی و شاخص‌ها', count: null },
            { id: 'salons', label: '🏛️ مدیریت سالن‌ها و پلان‌ها', count: salons.length },
            { id: 'events', label: '🎭 رویدادها و سانس‌ها', count: events.length },
            { id: 'producer_hub', label: '👑 کنسول تهیه‌کننده و مدیر برنامه', count: events.length },
            { id: 'users', label: '👥 مدیریت کاربران و دسترسی‌ها', count: users.length },
            { id: 'chair_block', label: '🎟️ بلاک صندلی ارگان‌ها', count: blockedSeatIds.length },
            { id: 'factors', label: '🧾 تراکنش‌ها و فاکتورها', count: factors.length },
            { id: 'mali', label: '💰 حسابداری و تسویه مالی', count: maliRecords.length },
            { id: 'artists', label: '🎨 عوامل و هنرمندان', count: artists.length },
            { id: 'terminals', label: '💳 پایانه‌ها و درگاه‌ها', count: terminals.length },
            { id: 'documents', label: '📑 مدارک و مجوزهای ارشاد', count: documents.length },
            { id: 'discounts', label: '🏷️ کدهای تخفیف', count: 3 },
            { id: 'settings', label: '⚙️ تنظیمات سامانه و پیامک', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery('');
              }}
              className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                  : isDark
                  ? 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                  {toPersianDigits(tab.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW & KEY PERFORMANCE INDICATORS
        ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    درآمد کل و فروش ناخالص
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums">{formatPrice(totalRevenue)}</div>
                <div className="text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                  <span>+۱۸.۴٪ رشد نسبت به ماه گذشته</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    کل بلیت‌های صادر شده
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-500 tabular-nums">
                  {toPersianDigits(totalTicketsSold)} صندلی
                </div>
                <div className="text-[11px] text-slate-400">
                  از مجموع {toPersianDigits(totalSeatsCapacity)} ظرفیت سالن‌ها
                </div>
              </div>

              <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    رویدادها و سانس‌های فعال
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums">
                  {toPersianDigits(events.length)} عنوان / {toPersianDigits(totalSansCount)} سانس
                </div>
                <div className="text-[11px] text-indigo-400">در حال فروش آنلاین در سامانه</div>
              </div>

              <div className={`p-6 rounded-3xl border space-y-3 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    سالن‌های همکار و کاربران
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums">
                  {toPersianDigits(salons.length)} سالن / {toPersianDigits(users.length)} کاربر
                </div>
                <div className="text-[11px] text-slate-400">مشهد، تهران و سایر شهرستان‌ها</div>
              </div>

            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Invoices */}
              <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    آخرین تراکنش‌های بانکی شاپرک
                  </h3>
                  <button onClick={() => setActiveTab('factors')} className="text-xs text-indigo-500 hover:underline cursor-pointer">
                    مشاهده همه ({toPersianDigits(factors.length)})
                  </button>
                </div>

                <div className="space-y-3">
                  {factors.slice(0, 3).map((f) => (
                    <div key={f.factorNumber} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <div className="font-bold">{f.customerName} - {f.event.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          فاکتور: {f.factorNumber} · {f.paidAt}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold font-mono text-emerald-500">{formatPrice(f.finalAmount)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{f.paymentGateway}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Events Overview */}
              <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    پرفروش‌ترین برنامه‌های روی صحنه
                  </h3>
                  <button onClick={() => setActiveTab('events')} className="text-xs text-indigo-500 hover:underline cursor-pointer">
                    مدیریت رویدادها
                  </button>
                </div>

                <div className="space-y-3">
                  {events.slice(0, 3).map((evt) => (
                    <div key={evt.id} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <div className="font-bold">{evt.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {evt.salonName} ({evt.city}) · {toPersianDigits(evt.runTurns.length)} سانس
                        </div>
                      </div>
                      <div className="text-left font-bold font-mono text-amber-500">
                        شروع از {formatPrice(evt.minPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: SALONS & FLOORPLANS (SalonsController / Salons/Create / SalonPlan)
        ========================================================================= */}
        {activeTab === 'salons' && (
          <div className="space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />
                  مدیریت سالن‌ها، تالارهای همایش و پلان جایگاه‌ها (SalonsController)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تعریف تالارهای همایش، پیکربندی جایگاه‌های همکف و بالکن، تعیین تعداد ردیف‌ها و ظرفیت دقیق صندلی‌ها.
                </p>
              </div>

              <button
                onClick={handleOpenCreateSalon}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف سالن و پلان جدید</span>
              </button>
            </div>

            {/* Salons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((salon) => (
                <div
                  key={salon.id}
                  className={`p-6 rounded-3xl border space-y-5 transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black">{salon.name}</h3>
                      <span className="text-xs text-amber-500 font-bold">{salon.city}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      ظرفیت {toPersianDigits(salon.capacity)} صندلی
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                    {salon.address}
                  </p>

                  <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="font-bold text-[11px] text-slate-400">جایگاه‌ها و طبقات پیکربندی شده:</div>
                    <div className="space-y-1.5">
                      {salon.parts.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-[11px]">
                          <span>{p.name} ({toPersianDigits(p.rows)} ردیف × {toPersianDigits(p.seatsPerRow)} صندلی):</span>
                          <span className="font-mono font-bold text-amber-500">{formatPrice(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewSalonPlan(salon)}
                        className="px-2.5 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="مشاهده چیدمان صندلی‌های سالن"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>نقشه صندلی‌ها</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditSalon(salon)}
                        className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="ویرایش و بازطراحی پلان سالن"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش پلان</span>
                      </button>
                    </div>

                    {onDeleteSalon && (
                      <button
                        onClick={() => {
                          if (confirm(`آیا از حذف سالن "${salon.name}" اطمینان دارید؟`)) {
                            onDeleteSalon(salon.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="حذف سالن"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 3: EVENTS & SANSER (BarnameController & RunTurnsController)
        ========================================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  مدیریت رویدادها، کنسرت‌ها و سانس‌ها (Barname & RunTurns)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تعریف برنامه جدید، انتساب به سالن، افزودن سانس‌های اجرا، تعیین قیمت و وضعیت فعال بودن فروش.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی برنامه یا سالن..."
                    className={`pr-9 pl-4 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>تعریف رویداد جدید</span>
                </button>
              </div>
            </div>

            {/* Events Table */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`border-b ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <tr>
                      <th className="p-4 font-bold">عنوان رویداد</th>
                      <th className="p-4 font-bold">دسته‌بندی</th>
                      <th className="p-4 font-bold">سالن و شهر</th>
                      <th className="p-4 font-bold">بازه اجرا</th>
                      <th className="p-4 font-bold">سانس‌ها</th>
                      <th className="p-4 font-bold">بازه قیمت</th>
                      <th className="p-4 font-bold">وضعیت فروش</th>
                      <th className="p-4 font-bold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="p-4 font-bold">{evt.title}</td>
                        <td className="p-4">{evt.category}</td>
                        <td className="p-4">{evt.salonName} ({evt.city})</td>
                        <td className="p-4">{evt.dateRange}</td>
                        <td className="p-4">
                          <span className="font-mono font-bold text-indigo-400">
                            {toPersianDigits(evt.runTurns.length)} سانس
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-500">
                          {formatPrice(evt.minPrice)} تا {formatPrice(evt.maxPrice)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                            <button
                              onClick={() => {
                                if (onUpdateEvent) {
                                  onUpdateEvent({ ...evt, isActive: !evt.isActive });
                                }
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer whitespace-nowrap transition-colors ${
                                evt.isActive
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                              }`}
                            >
                              {evt.isActive ? 'در حال فروش' : 'متوقف'}
                            </button>

                            <button
                              onClick={() => handleToggleEventSoldOut(evt)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1 ${
                                evt.isSoldOut
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-500'
                              }`}
                              title="تغییر وضعیت رویداد به سولد اوت (تکمیل ظرفیت)"
                            >
                              <Flame className="w-3 h-3 text-rose-500" />
                              <span>{evt.isSoldOut ? 'سولد اوت' : 'ظرفیت موجود'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setProducerSelectedEventId(evt.id);
                                setActiveTab('producer_hub');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
                              title="ورود به پنل اختصاصی تهیه‌کننده این رویداد"
                            >
                              <span>👑 پنل تهیه‌کننده</span>
                            </button>

                            <button
                              onClick={() => setShowAddSansModal(evt)}
                              className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-[11px] font-bold cursor-pointer"
                              title="افزودن سانس جدید"
                            >
                              + سانس
                            </button>

                            {onDeleteEvent && (
                              <button
                                onClick={() => onDeleteEvent(evt.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                title="حذف رویداد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 3.5: PRODUCER & EVENT MANAGER CONSOLE (ProducerHubController)
        ========================================================================= */}
        {activeTab === 'producer_hub' && (
          <div className="space-y-6">
            
            {/* Header & Event Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  کنسول و اختیارات اختصاصی تهیه‌کننده و مدیر برنامه (Producer Console)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  مدیریت اجرایی و مالی رویداد، نظارت بر سانس‌ها، صدور بلیت‌های مهمان، بلاک سهمیه حامیان مالی و تسویه حساب بانکی.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Event Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">انتخاب رویداد:</span>
                  <select
                    value={producerSelectedEventId}
                    onChange={(e) => setProducerSelectedEventId(e.target.value)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                    }`}
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        🎭 {evt.title} ({evt.city})
                      </option>
                    ))}
                  </select>
                </div>

                {onOpenProducer && (
                  <button
                    onClick={onOpenProducer}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    title="مشاهده در نمای مستقل تمام‌صفحه کنسول تهیه‌کننده"
                  >
                    <Crown className="w-4 h-4" />
                    <span>نمای تمام‌صفحه کنسول</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Event Banner */}
            <div className={`p-6 rounded-3xl border transition-colors ${
              isDark ? 'bg-gradient-to-r from-slate-900 to-indigo-950/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      رویداد فعال تهیه‌کننده
                    </span>
                    <span className="text-xs text-slate-400">
                      سالن: {producerSalon.name} ({producerSalon.city})
                    </span>
                  </div>
                  <h3 className="text-xl font-black">{producerEvent.title}</h3>
                  <p className="text-xs text-slate-400">
                    بازه زمانی: {producerEvent.dateRange} · {toPersianDigits(producerEvent.runTurns.length)} سانس
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = {
                        ...producerEvent,
                        isActive: !producerEvent.isActive,
                      };
                      if (onUpdateEvent) onUpdateEvent(updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      producerEvent.isActive
                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span>{producerEvent.isActive ? 'توقف موقت فروش این رویداد' : 'بازگشایی فروش آنلاین'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddSansModal(producerEvent)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سانس فوق‌العاده</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Financial & Sales KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>فروش ناخالص گیشه</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {formatPrice(producerGrossSale)}
                </div>
                <div className="text-[10px] text-slate-400">
                  از {toPersianDigits(producerFactors.length)} تراکنش موفق
                </div>
              </div>

              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>خالص سهم تهیه‌کننده</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {formatPrice(producerNet)}
                </div>
                <div className="text-[10px] text-emerald-500 font-bold">
                  پس از کسر ۴٪ کارمزد و ۹٪ مالیات
                </div>
              </div>

              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>صندلی‌های فروخته‌شده</span>
                  <Ticket className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-black font-mono">
                  {toPersianDigits(producerTicketsSold)} صندلی
                </div>
                <div className="text-[10px] text-slate-400">
                  از {toPersianDigits(producerTotalCap)} ظرفیت کل سانس‌ها
                </div>
              </div>

              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>درصد تکمیل سالن</span>
                  <Users className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-400">
                  {toPersianDigits(producerOccupancy)}٪
                </div>
                <div className="text-[10px] text-slate-400">
                  میانگین پرشدگی صندلی‌ها
                </div>
              </div>

            </div>

            {/* Sub-tabs Navigation */}
            <div className={`flex items-center gap-1.5 border-b pb-3 text-xs font-bold overflow-x-auto scrollbar-none ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              {[
                { id: 'analytics', label: '📊 تحلیل فروش جایگاه‌ها' },
                { id: 'sanses', label: '⏰ مدیریت سانس‌ها و زمان‌بندی' },
                { id: 'holds', label: '🎟️ سهمیه بلیت‌های مهمان و تشریفات' },
                { id: 'attendees', label: '👥 لیست تماشاگران و خریداران' },
                { id: 'discounts', label: '🏷️ کدهای تخفیف ویژه' },
                { id: 'sms', label: '📱 اطلاع‌رسانی پیامکی' },
                { id: 'settlement', label: '💰 تسویه حساب و شماره شبا' },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setProducerSubTab(subTab.id as any)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                    producerSubTab === subTab.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : isDark
                      ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* SUBTAB 1: ANALYTICS */}
            {producerSubTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Breakdown by Parts */}
                <div className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="text-xs font-bold text-slate-400">تفکیک فروش و ظرفیت جایگاه‌های سالن:</h4>
                  <div className="space-y-3">
                    {producerSalon.parts.map((p) => {
                      const partCap = p.rows * p.seatsPerRow;
                      const soldEstimate = Math.min(partCap, Math.round((partCap * producerOccupancy) / 100));
                      return (
                        <div key={p.id} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{p.name} ({p.tier.toUpperCase()})</span>
                            <span className="font-mono text-slate-400">
                              {toPersianDigits(soldEstimate)} / {toPersianDigits(partCap)} صندلی · {formatPrice(p.price)}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.round((soldEstimate / partCap) * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="text-xs font-bold text-slate-400">جدول مالی شفاف فروش:</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">مجموع فروش ناخالص:</span>
                      <span className="font-mono font-bold">{formatPrice(producerGrossSale)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800 text-rose-400">
                      <span>کارمزد خدمات سامانه (۴٪):</span>
                      <span className="font-mono font-bold">-{formatPrice(producerCommission)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800 text-rose-400">
                      <span>مالیات بر ارزش افزوده (۹٪ کارمزد):</span>
                      <span className="font-mono font-bold">-{formatPrice(Math.round((producerCommission * 9) / 100))}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                      <span>خالص بستانکاری تهیه‌کننده:</span>
                      <span className="font-mono font-black text-sm">{formatPrice(producerNet)}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 2: SANSES */}
            {producerSubTab === 'sanses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400">سانس‌های اجرا و زمان‌بندی:</h4>
                  <button
                    onClick={() => setShowAddSansModal(producerEvent)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سانس جدید</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {producerEvent.runTurns.map((turn, idx) => (
                    <div
                      key={turn.id}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">
                          سانس {toPersianDigits(idx + 1)} · {turn.weekday}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">{turn.time}</span>
                      </div>

                      <div className="text-sm font-black">{turn.date}</div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                        <span>ظرفیت سالن:</span>
                        <span className="font-mono font-bold text-white">{toPersianDigits(turn.totalSeatsCount)} صندلی</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 3: COMPLIMENTARY & GUEST TICKETS */}
            {producerSubTab === 'holds' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold">صدور بلیت‌های مهمان ویژه و سهمیه تهیه‌کننده</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      صدور بلیت رایگان رسمی با بارکد QR برای مهمانان افتخاری، داوران و همراهان گروه اجرایی
                    </p>
                  </div>
                </div>

                {/* Form to issue complimentary ticket */}
                <div className={`p-5 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block mb-1 text-slate-400 font-bold">نام مهمان ویژه:</label>
                      <input
                        type="text"
                        placeholder="جناب آقای رضایی"
                        className={`w-full p-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400 font-bold">شماره تماس مهمان:</label>
                      <input
                        type="text"
                        placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                        className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400 font-bold">جایگاه صندلی:</label>
                      <select
                        className={`w-full p-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {producerSalon.parts.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => alert('بلیت مهمان با موفقیت صادر و بارکد ورود ثبت شد.')}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>صدور آنی بلیت مهمان ویژه</span>
                    </button>
                  </div>
                </div>

                {/* Quarantined Sponsor seats */}
                <div className={`p-5 rounded-3xl border space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      صندلی‌های قرنطینه و سهمیه ارگان‌ها / حامیان مالی
                    </h5>
                    <span className="text-[11px] font-mono text-slate-400">
                      {toPersianDigits(producerHeldSeats.length)} صندلی قفل شده
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {producerHeldSeats.map((seatId) => (
                      <span
                        key={seatId}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3" />
                        {seatId.toUpperCase()}
                        <button
                          onClick={() => setProducerHeldSeats((prev) => prev.filter((s) => s !== seatId))}
                          className="hover:text-rose-400 cursor-pointer mr-1"
                          title="آزادسازی صندلی برای خرید عمومی"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 4: ATTENDEES */}
            {producerSubTab === 'attendees' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400">
                    اسامی و مشخصات خریداران بلیت رویداد ({toPersianDigits(producerFactors.length)} فاکتور):
                  </h4>
                </div>

                <div className={`rounded-3xl border overflow-hidden ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className={`border-b ${
                        isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <tr>
                          <th className="p-4 font-bold">شماره فاکتور</th>
                          <th className="p-4 font-bold">خریدار</th>
                          <th className="p-4 font-bold">شماره تماس</th>
                          <th className="p-4 font-bold">صندلی‌ها</th>
                          <th className="p-4 font-bold">مبلغ پرداختی</th>
                          <th className="p-4 font-bold">وضعیت ورود (گیت)</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                      }`}>
                        {producerFactors.map((f) => (
                          <tr key={f.factorNumber} className="hover:bg-slate-800/30">
                            <td className="p-4 font-mono font-bold text-indigo-400">{f.factorNumber}</td>
                            <td className="p-4 font-bold">{f.customerName}</td>
                            <td className="p-4 font-mono text-slate-400">{f.customerMobile}</td>
                            <td className="p-4">
                              {f.seats.map((s) => `${s.partName} ردیف ${s.row} صندلی ${s.number}`).join('، ')}
                            </td>
                            <td className="p-4 font-mono font-bold text-emerald-400">{formatPrice(f.finalAmount)}</td>
                            <td className="p-4">
                              {f.isCheckedIn ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  وارد سالن شده
                                </span>
                              ) : (
                                <span className="text-slate-400">ورود ثبت نشده</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: DISCOUNTS */}
            {producerSubTab === 'discounts' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-400">کدهای تخفیف ویژه این رویداد:</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {producerPromoCodes.map((promo) => (
                    <div
                      key={promo.code}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-black text-amber-400 text-sm">{promo.code}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          تخفیف {toPersianDigits(promo.percent)}٪ · مصرف {toPersianDigits(promo.usedCount)} از {toPersianDigits(promo.maxCount)}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        فعال
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 6: SMS BROADCAST */}
            {producerSubTab === 'sms' && (
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  ارسال پیامک اطلاع‌رسانی گروهی به خریداران بلیت
                </h4>
                <textarea
                  rows={3}
                  value={producerSmsText}
                  onChange={(e) => setProducerSmsText(e.target.value)}
                  placeholder="متن پیامک ارسالی (مثلاً: تماشاگر گرامی، درب‌های سالن ۳۰ دقیقه قبل از اجرا باز می‌شود...)"
                  className={`w-full p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    گیرندگان: {toPersianDigits(producerFactors.length)} نفر خریدار بلیت
                  </span>
                  <button
                    onClick={() => {
                      setProducerSmsSuccess(true);
                      setTimeout(() => setProducerSmsSuccess(false), 5000);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال پیامک به تمام تماشاگران</span>
                  </button>
                </div>
                {producerSmsSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>پیامک به صف ارسال مخابرات تحویل داده شد.</span>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 7: FINANCIAL SETTLEMENT */}
            {producerSubTab === 'settlement' && (
              <div className={`p-6 rounded-3xl border space-y-5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  درخواست تسویه حساب مالی و واریز به شماره شبا
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block mb-1 text-slate-400 font-bold">شماره شبای بانکی تهیه‌کننده:</label>
                    <input
                      type="text"
                      defaultValue="IR720120000000008765432101"
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                        isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400 font-bold">مبلغ قابل تسویه در این مرحله:</label>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm">
                      {formatPrice(producerNet)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setProducerSettlementSuccess(true);
                      setTimeout(() => setProducerSettlementSuccess(false), 5000);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    تایید و ارسال درخواست تسویه حساب
                  </button>
                </div>

                {producerSettlementSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>درخواست تسویه با موفقیت ثبت شد و حداکثر تا ۲۴ ساعت آینده به حساب واریز می‌گردد.</span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TAB 4: USER MANAGEMENT (UserListsController / RigesterUser / Roles)
        ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  مدیریت کاربران، مدیران، تهیه‌کنندگان و اپراتورهای چکر (UserLists)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تعریف سطوح دسترسی (مدیر ارشد، تهیه‌کننده، اپراتور چکر ورودی سالن، مشتری عادی)، مسدودسازی و سوابق خرید.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی نام یا موبایل..."
                    className={`pr-9 pl-4 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت کاربر جدید</span>
                </button>
              </div>
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
              {[
                { id: 'all', label: 'همه کاربران' },
                { id: 'super_admin', label: 'مدیران ارشد سیستم' },
                { id: 'producer', label: 'تهیه‌کنندگان و مجریان' },
                { id: 'gate_checker', label: 'اپراتورهای گیت چکر' },
                { id: 'customer', label: 'خریداران عادی' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setUserRoleFilter(rf.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    userRoleFilter === rf.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`border-b ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <tr>
                      <th className="p-4 font-bold">نام و نام خانوادگی</th>
                      <th className="p-4 font-bold">شماره موبایل</th>
                      <th className="p-4 font-bold">کد ملی</th>
                      <th className="p-4 font-bold">نقش کاربری</th>
                      <th className="p-4 font-bold">تاریخ ثبت‌نام</th>
                      <th className="p-4 font-bold">تعداد بلیت‌ها</th>
                      <th className="p-4 font-bold">وضعیت حساب</th>
                      <th className="p-4 font-bold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="p-4 font-bold">{usr.fullName}</td>
                        <td className="p-4 font-mono">{usr.mobile}</td>
                        <td className="p-4 font-mono">{usr.nationalCode || '---'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleLabels[usr.role].color}`}>
                            {roleLabels[usr.role].label}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{usr.registeredAt}</td>
                        <td className="p-4 font-mono font-bold text-amber-500">
                          {toPersianDigits(usr.ticketsCount)} بلیت
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setUsers((prev) =>
                                prev.map((u) => (u.id === usr.id ? { ...u, isActive: !u.isActive } : u))
                              );
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                              usr.isActive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}
                          >
                            {usr.isActive ? 'فعال' : 'مسدود شده'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {usr.role !== 'super_admin' && (
                              <button
                                onClick={() => {
                                  setUsers((prev) =>
                                    prev.map((u) => {
                                      if (u.id !== usr.id) return u;
                                      const nextRole: UserRole =
                                        u.role === 'customer'
                                          ? 'gate_checker'
                                          : u.role === 'gate_checker'
                                          ? 'producer'
                                          : 'customer';
                                      return { ...u, role: nextRole };
                                    })
                                  );
                                }}
                                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                                title="تغییر نقش"
                              >
                                تغییر نقش
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setUsers((prev) => prev.filter((u) => u.id !== usr.id));
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="حذف کاربر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 5: CHAIR BLOCKING FOR ORGANIZATIONS (ChairForBarnameController)
        ========================================================================= */}
        {activeTab === 'chair_block' && (
          <div className={`p-6 rounded-3xl border space-y-6 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  مدیریت اختصاصی صندلی‌ها و بلاک ارگان‌ها (ChairForBarname)
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  صندلی‌های ویژه مهمانان ارگانی، اسپانسرها و عوامل را انتخاب و قفل نمایید تا برای خریداران عادی سایت نمایش داده نشود.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">برنامه:</span>
                <select
                  value={selectedBarnameForChair}
                  onChange={(e) => setSelectedBarnameForChair(e.target.value)}
                  className={`text-xs px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">جایگاه VIP ردیف اول و دوم (روی صندلی کلیک کنید تا بلاک/آزاد شود):</span>
                <span className="text-amber-500 font-bold">
                  {toPersianDigits(blockedSeatIds.length)} صندلی در وضعیت بلاک ارگانی
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const seatKey = `seat-vip-${idx + 1}`;
                  const isBlocked = blockedSeatIds.includes(seatKey);
                  return (
                    <button
                      key={seatKey}
                      onClick={() => {
                        setBlockedSeatIds((prev) =>
                          prev.includes(seatKey) ? prev.filter((s) => s !== seatKey) : [...prev, seatKey]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 ${
                        isBlocked
                          ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-xs'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-amber-500'
                      }`}
                    >
                      <span>ر۱-ش{toPersianDigits(idx + 1)}</span>
                      <span className="text-[10px] font-sans font-normal">
                        {isBlocked ? 'بلاک' : 'آزاد'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setBlockedSeatIds([])}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  آزادسازی همه صندلی‌ها
                </button>
                <button
                  onClick={() =>
                    setBlockedSeatIds(Array.from({ length: 12 }).map((_, i) => `seat-vip-${i + 1}`))
                  }
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                >
                  بلاک کل ردیف ۱ برای مهمانان VIP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: FACTORS & ORDERS (FactorListsController)
        ========================================================================= */}
        {activeTab === 'factors' && (
          <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={`border-b ${
                  isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  <tr>
                    <th className="p-4 font-bold">شماره فاکتور</th>
                    <th className="p-4 font-bold">خریدار</th>
                    <th className="p-4 font-bold">رویداد</th>
                    <th className="p-4 font-bold">صندلی‌ها</th>
                    <th className="p-4 font-bold">مبلغ پرداختی</th>
                    <th className="p-4 font-bold">درگاه</th>
                    <th className="p-4 font-bold">وضعیت ورود</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                }`}>
                  {factors.map((f) => (
                    <tr key={f.factorNumber} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="p-4 font-mono font-bold text-amber-500">{f.factorNumber}</td>
                      <td className="p-4">
                        <div className="font-bold">{f.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{f.customerMobile}</div>
                      </td>
                      <td className="p-4 max-w-xs truncate">{f.event.title}</td>
                      <td className="p-4 text-[11px]">
                        {f.seats.map((s) => `ر${s.row}ش${s.number}`).join('، ')}
                      </td>
                      <td className="p-4 font-black font-mono text-emerald-500">{formatPrice(f.finalAmount)}</td>
                      <td className="p-4 uppercase text-[10px] text-slate-400 font-mono">{f.paymentGateway}</td>
                      <td className="p-4">
                        {f.isCheckedIn ? (
                          <span className="text-emerald-500 font-bold">وارد شده</span>
                        ) : (
                          <span className="text-slate-400">در انتظار ورود</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: FINANCIAL SETTLEMENTS (MaliManagmentController)
        ========================================================================= */}
        {activeTab === 'mali' && (
          <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  حسابداری و تسویه حساب تهیه‌کنندگان (MaliManagment)
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  کسر کمیسیون گیشو (۴.۵٪)، مالیات ارزش افزوده و واریز به شماره شبای رسمی تهیه‌کننده برنامه.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                کل مطالبات تسویه شده: {formatPrice(maliRecords.filter(m => m.status === 'settled').reduce((a, b) => a + b.netPayableToProducer, 0))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={`border-b ${
                  isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  <tr>
                    <th className="p-4 font-bold">عنوان رویداد و سانس</th>
                    <th className="p-4 font-bold">تهیه‌کننده / موسسه</th>
                    <th className="p-4 font-bold">فروش ناخالص</th>
                    <th className="p-4 font-bold">کمیسیون گیشو</th>
                    <th className="p-4 font-bold">خالص پرداختی</th>
                    <th className="p-4 font-bold">شماره شبا</th>
                    <th className="p-4 font-bold">وضعیت</th>
                    <th className="p-4 font-bold">عملیات</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                }`}>
                  {maliRecords.map((m) => (
                    <tr key={m.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="p-4">
                        <div className="font-bold">{m.eventTitle}</div>
                        <div className="text-[10px] text-slate-400">{m.runTurnDate}</div>
                      </td>
                      <td className="p-4">{m.producerName}</td>
                      <td className="p-4 font-mono font-bold">{formatPrice(m.totalGrossSale)}</td>
                      <td className="p-4 font-mono text-rose-500">
                        {formatPrice(m.commissionAmount)}
                        <span className="text-[10px] text-slate-400 mr-1">({toPersianDigits(m.commissionPercent)}٪)</span>
                      </td>
                      <td className="p-4 font-mono font-black text-emerald-500">{formatPrice(m.netPayableToProducer)}</td>
                      <td className="p-4 font-mono text-[10px]">{m.shebaNumber}</td>
                      <td className="p-4">
                        {m.status === 'settled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> تسویه شده
                          </span>
                        )}
                        {m.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            <Clock className="w-3 h-3" /> در حال واریز
                          </span>
                        )}
                        {m.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-slate-500/10 text-slate-400 font-bold border border-slate-500/20">
                            <Clock className="w-3 h-3" /> در انتظار سانس
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {m.status !== 'settled' ? (
                          <button
                            onClick={() => {
                              setMaliRecords((prev) =>
                                prev.map((item) =>
                                  item.id === m.id
                                    ? { ...item, status: 'settled', settledDate: '۱۴۰۵/۰۸/۲۳', trackingNumber: `PAY-${Date.now().toString().slice(-8)}` }
                                    : item
                                )
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            ثبت تسویه
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">{m.trackingNumber}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: ARTISTS AND CAST (ActressesController)
        ========================================================================= */}
        {activeTab === 'artists' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                هنرمندان، خوانندگان و عوامل صحنه (Actresses)
              </h3>
              <button
                onClick={() => setShowAddArtistModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن هنرمند جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {artists.map((art) => (
                <div
                  key={art.id}
                  className={`p-5 rounded-2xl border space-y-3 transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {art.name.slice(0, 1)}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {art.role}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{art.name}</h4>
                    <p className="text-xs mt-1 leading-relaxed text-slate-400">
                      {art.bio}
                    </p>
                  </div>
                  <div className="text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-400">
                    برنامه‌های مرتبط: {art.assignedEvents.join('، ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: BANK TERMINALS (BankTerminalsController)
        ========================================================================= */}
        {activeTab === 'terminals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              تنظیمات پایانه‌ها و درگاه‌های پرداخت شاپرک (BankTerminals)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {terminals.map((term) => (
                <div
                  key={term.id}
                  className={`p-6 rounded-3xl border space-y-4 transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">{term.bankName}</h4>
                    {term.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        درگاه پیش‌فرض فعال
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">شماره ترمینال (Terminal ID):</span>
                      <span className="font-mono font-bold">{term.terminalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">کد پذیرنده (Merchant ID):</span>
                      <span className="font-mono font-bold truncate max-w-[140px]">{term.merchantId}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-500">
                      متصل به شاپرک
                    </span>
                    {!term.isDefault && (
                      <button
                        onClick={() => {
                          setTerminals((prev) =>
                            prev.map((t) => ({ ...t, isDefault: t.id === term.id }))
                          );
                        }}
                        className="px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                      >
                        انتخاب به عنوان درگاه پیش‌فرض
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 10: PERMITS & DOCUMENTS (ImagesMadareksController)
        ========================================================================= */}
        {activeTab === 'documents' && (
          <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                مدارک، مجوزهای ارشاد و احراز هویت تهیه‌کنندگان (ImagesMadareks)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={`border-b ${
                  isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  <tr>
                    <th className="p-4 font-bold">نوع سند / مجوز</th>
                    <th className="p-4 font-bold">نام رویداد و تهیه‌کننده</th>
                    <th className="p-4 font-bold">نام فایل ضمیمه</th>
                    <th className="p-4 font-bold">تاریخ ارسال</th>
                    <th className="p-4 font-bold">وضعیت تایید</th>
                    <th className="p-4 font-bold">عملیات ناظر</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'
                }`}>
                  {documents.map((doc) => (
                    <tr key={doc.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="p-4 font-bold">{doc.docType}</td>
                      <td className="p-4">
                        <div>{doc.eventName}</div>
                        <div className="text-[10px] text-slate-400">{doc.producerName}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-indigo-400">{doc.fileName}</td>
                      <td className="p-4 font-mono">{doc.uploadDate}</td>
                      <td className="p-4">
                        {doc.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> تایید شده
                          </span>
                        )}
                        {doc.status === 'pending_review' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            <Clock className="w-3 h-3" /> در انتظار تایید
                          </span>
                        )}
                        {doc.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> رد شده
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {doc.status === 'pending_review' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setDocuments((prev) =>
                                  prev.map((d) => (d.id === doc.id ? { ...d, status: 'approved' } : d))
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              تایید مجوز
                            </button>
                            <button
                              onClick={() => {
                                setDocuments((prev) =>
                                  prev.map((d) => (d.id === doc.id ? { ...d, status: 'rejected' } : d))
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              رد
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 11: DISCOUNTS (MarkdownListsController)
        ========================================================================= */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  مدیریت کدهای تخفیف و پروموشن‌ها (MarkdownLists)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعریف، تخصیص به رویداد، پایش میزان مصرف و فعال/غیرفعال‌سازی کدهای تخفیف سامانه لیندو تیکت
                </p>
              </div>

              <button
                onClick={() => setShowAddDiscountModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف کد تخفیف جدید</span>
              </button>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">تعداد کل کدهای تخفیف</div>
                <div className="text-2xl font-mono font-black text-amber-400 mt-2">
                  {toPersianDigits(activeDiscounts.length)} کد
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {toPersianDigits(activeDiscounts.filter((d) => d.isActive !== false).length)} کد فعال در گیشه
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">مجموع دفعات استفاده موفق</div>
                <div className="text-2xl font-mono font-black text-indigo-400 mt-2">
                  {toPersianDigits(activeDiscounts.reduce((sum, d) => sum + (d.usedCount || 0), 0))} بار
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  توسط خریداران در فرایند پرداخت
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-xs text-slate-400 font-bold">بیشترین تخفیف فعال</div>
                <div className="text-2xl font-mono font-black text-emerald-400 mt-2">
                  {toPersianDigits(Math.max(...activeDiscounts.map((d) => d.discountPercent || 0), 0))}٪ تخفیف
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  اعمال خودکار روی فاکتور نهایی
                </div>
              </div>
            </div>

            {/* Discounts Table */}
            <div className={`rounded-3xl border overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`border-b ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <tr>
                      <th className="p-4 font-bold">کد تخفیف</th>
                      <th className="p-4 font-bold">میزان تخفیف</th>
                      <th className="p-4 font-bold">رویداد مرتبط</th>
                      <th className="p-4 font-bold">سقف / مصرف</th>
                      <th className="p-4 font-bold">حداقل خرید</th>
                      <th className="p-4 font-bold">تاریخ انقضا</th>
                      <th className="p-4 font-bold">وضعیت</th>
                      <th className="p-4 font-bold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeDiscounts.map((disc) => (
                      <tr key={disc.id || disc.code} className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/60'
                      }`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 text-xs">
                              {disc.code}
                            </span>
                            <button
                              onClick={() => {
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard.writeText(disc.code);
                                }
                                setCopiedCodeToast(disc.code);
                                setTimeout(() => setCopiedCodeToast(null), 3000);
                              }}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="کپی کد تخفیف"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={disc.description}>
                            {disc.description}
                          </div>
                        </td>
                        <td className="p-4 font-bold">
                          {disc.discountPercent ? (
                            <span className="text-emerald-400 font-mono text-sm">
                              {toPersianDigits(disc.discountPercent)}٪ تخفیف
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-mono text-sm">
                              {formatPrice(disc.fixedAmount || 0)}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            disc.eventId === 'all' || !disc.eventId
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {disc.eventId === 'all' || !disc.eventId ? 'کلیه رویدادها' : disc.eventTitle || 'اختصاصی رویداد'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-xs">
                            {toPersianDigits(disc.usedCount || 0)} از {disc.maxUsage ? toPersianDigits(disc.maxUsage) : 'نامحدود'}
                          </div>
                          {disc.maxUsage && (
                            <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-amber-400 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, Math.round(((disc.usedCount || 0) / disc.maxUsage) * 100))}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {disc.minOrderAmount ? formatPrice(disc.minOrderAmount) : 'بدون شرط'}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {disc.expiresAt || 'همیشگی'}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleDiscountActive(disc)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors border ${
                              disc.isActive !== false
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            {disc.isActive !== false ? '● فعال' : '○ غیرفعال'}
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDeleteDiscount(disc.code)}
                            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="حذف کد تخفیف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 12: SITE SETTINGS (AdminSettingSiteController)
        ========================================================================= */}
        {activeTab === 'settings' && (
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  تنظیمات جامع سامانه و وب‌سرویس پیامک (AdminSettingSite)
                </h3>
              </div>

              <button
                onClick={() => {
                  setSettingsSavedToast(true);
                  setTimeout(() => setSettingsSavedToast(false), 3000);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره کلیه تنظیمات</span>
              </button>
            </div>

            {settingsSavedToast && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                تنظیمات سامانه گیشو با موفقیت در پایگاه داده ذخیره گردید.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-amber-500">اطلاعات هویتی و پشتیبانی</h4>
                <div className="space-y-1">
                  <label className="text-xs font-medium">عنوان رسمی سامانه (فارسی):</label>
                  <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">تلفن پشتیبانی دفتر مشهد:</label>
                  <input
                    type="text"
                    value={siteSettings.supportPhone}
                    onChange={(e) => setSiteSettings({ ...siteSettings, supportPhone: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">شماره همراه اضطراری گیشه:</label>
                  <input
                    type="text"
                    value={siteSettings.supportMobile}
                    onChange={(e) => setSiteSettings({ ...siteSettings, supportMobile: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">آدرس دفتر مرکزی:</label>
                  <textarea
                    rows={2}
                    value={siteSettings.officeAddress}
                    onChange={(e) => setSiteSettings({ ...siteSettings, officeAddress: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-amber-500">تنظیمات پیامک و ضرایب سامانه</h4>
                <div className="space-y-1">
                  <label className="text-xs font-medium">سرویس‌دهنده پیامک خدماتی (SMS Provider):</label>
                  <select
                    value={siteSettings.smsProvider}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smsProvider: e.target.value as any })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="kavenegar">کاوه‌نگار (Kavenegar Web API)</option>
                    <option value="melipayamak">ملی‌پیامک (MeliPayamak SOAP/REST)</option>
                    <option value="ghasedak">قاصدک (Ghasedak SMS)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">کد الگوی پترن پیامک تایید بلیت:</label>
                  <input
                    type="text"
                    value={siteSettings.smsPatternCode}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smsPatternCode: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">درصد کارمزد گیشو (٪):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={siteSettings.defaultCommissionPercent}
                      onChange={(e) => setSiteSettings({ ...siteSettings, defaultCommissionPercent: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">تایمر قفل صندلی (دقیقه):</label>
                    <input
                      type="number"
                      value={siteSettings.reservationLockMinutes}
                      onChange={(e) => setSiteSettings({ ...siteSettings, reservationLockMinutes: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL 0: INTERACTIVE ARCHITECTURAL HALL & FLOOR PLAN BUILDER
      ========================================================================= */}
      {showPlanBuilderModal && (
        <SalonPlanBuilderModal
          theme={theme}
          initialSalon={editingSalonForBuilder}
          onClose={() => {
            setShowPlanBuilderModal(false);
            setEditingSalonForBuilder(null);
          }}
          onSaveSalon={handleSaveSalonFromBuilder}
        />
      )}

      {/* =========================================================================
          MODAL 1: CREATE NEW SALON (Salons/Create)
      ========================================================================= */}
      {showAddSalonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-2xl w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-500" />
                تعریف سالن و پلان معماری جدید
              </h3>
              <button
                onClick={() => setShowAddSalonModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">نام سالن یا تالار:</label>
                  <input
                    type="text"
                    required
                    value={newSalonName}
                    onChange={(e) => setNewSalonName(e.target.value)}
                    placeholder="مثال: تالار همایش‌های بین‌المللی رازی"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">شهر:</label>
                  <input
                    type="text"
                    required
                    value={newSalonCity}
                    onChange={(e) => setNewSalonCity(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">آدرس دقیق سالن:</label>
                <input
                  type="text"
                  value={newSalonAddress}
                  onChange={(e) => setNewSalonAddress(e.target.value)}
                  placeholder="مشهد مقدس - بزرگراه شهید کلانتری..."
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Sections & Parts Config */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-500">تعریف جایگاه‌ها و ردیف‌های صندلی سالن:</span>
                  <span className="font-mono text-emerald-400">
                    ظرفیت کل محاسبه‌شده: {toPersianDigits(newSalonParts.reduce((a, b) => a + b.rows * b.seatsPerRow, 0))} صندلی
                  </span>
                </div>

                {newSalonParts.map((part, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl border grid grid-cols-2 sm:grid-cols-5 gap-2 items-center ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">نام جایگاه:</span>
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => {
                          const updated = [...newSalonParts];
                          updated[idx].name = e.target.value;
                          setNewSalonParts(updated);
                        }}
                        className={`w-full p-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">طبقه/تیپ:</span>
                      <select
                        value={part.tier}
                        onChange={(e) => {
                          const updated = [...newSalonParts];
                          updated[idx].tier = e.target.value as any;
                          setNewSalonParts(updated);
                        }}
                        className={`w-full p-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        <option value="vip">VIP ویژه</option>
                        <option value="ground">همکف</option>
                        <option value="balcony">بالکن</option>
                        <option value="lodge">لژ اختصاصی</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">تعداد ردیف:</span>
                      <input
                        type="number"
                        min="1"
                        value={part.rows}
                        onChange={(e) => {
                          const updated = [...newSalonParts];
                          updated[idx].rows = Number(e.target.value);
                          setNewSalonParts(updated);
                        }}
                        className={`w-full p-1.5 rounded-lg border text-xs font-mono ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">صندلی هر ردیف:</span>
                      <input
                        type="number"
                        min="1"
                        value={part.seatsPerRow}
                        onChange={(e) => {
                          const updated = [...newSalonParts];
                          updated[idx].seatsPerRow = Number(e.target.value);
                          setNewSalonParts(updated);
                        }}
                        className={`w-full p-1.5 rounded-lg border text-xs font-mono ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">قیمت صندلی:</span>
                      <input
                        type="number"
                        step="50000"
                        value={part.price}
                        onChange={(e) => {
                          const updated = [...newSalonParts];
                          updated[idx].price = Number(e.target.value);
                          setNewSalonParts(updated);
                        }}
                        className={`w-full p-1.5 rounded-lg border text-xs font-mono ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSalonModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
                >
                  ثبت سالن و تولید پلان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CREATE NEW EVENT (Barname/Create)
      ========================================================================= */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-lg w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                تعریف رویداد، کنسرت یا تئاتر جدید
              </h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-medium">عنوان برنامه:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: کنسرت بزرگ همایون شجریان"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">دسته‌بندی:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="concert">کنسرت موسیقی</option>
                    <option value="theater">تئاتر و نمایش</option>
                    <option value="comedy">کمدی و استندآپ</option>
                    <option value="conference">همایش و سمینار</option>
                    <option value="cinema">سینما</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">شهر برگزاری:</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">سالن اجرا:</label>
                <select
                  value={newSalonId}
                  onChange={(e) => setNewSalonId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {salons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}) - ظرفیت {s.capacity} صندلی
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">بازه تاریخ اجرا:</label>
                  <input
                    type="text"
                    value={newDateRange}
                    onChange={(e) => setNewDateRange(e.target.value)}
                    placeholder="مثال: ۲۵ الی ۲۸ دی ۱۴۰۵"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">حداقل قیمت بلیت (تومان):</label>
                  <input
                    type="number"
                    step="50000"
                    value={newMinPrice}
                    onChange={(e) => setNewMinPrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">توضیحات و معرفی اثر:</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="اطلاعات رویداد، عوامل اجرایی و مقررات سالن..."
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-md"
                >
                  ذخیره و انتشار رویداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CREATE NEW USER (UserLists/RegisterUser)
      ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                تعریف کاربر یا اپراتور جدید
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-medium">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: کامران یزدانی"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">شماره موبایل:</label>
                <input
                  type="text"
                  required
                  value={newUserMobile}
                  onChange={(e) => setNewUserMobile(e.target.value)}
                  placeholder="0915..."
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">کد ملی (اختیاری):</label>
                <input
                  type="text"
                  value={newUserNationalCode}
                  onChange={(e) => setNewUserNationalCode(e.target.value)}
                  placeholder="092..."
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">نقش و سطح دسترسی:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="customer">خریدار عادی (مشتری)</option>
                  <option value="gate_checker">اپراتور گیت ورودی (چکر بلیت)</option>
                  <option value="producer">تهیه‌کننده و مجری رویداد</option>
                  <option value="super_admin">مدیر ارشد سامانه</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md"
                >
                  ثبت کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ADD SANS TO EVENT (RunTurns/Create)
      ========================================================================= */}
      {showAddSansModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                افزودن سانس به «{showAddSansModal.title}»
              </h3>
              <button
                onClick={() => setShowAddSansModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSansToEvent} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-medium">تاریخ شمسی اجرا:</label>
                <input
                  type="text"
                  value={newSansDate}
                  onChange={(e) => setNewSansDate(e.target.value)}
                  placeholder="۱۴۰۵/۰۹/۲۵"
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">ساعت اجرا:</label>
                  <input
                    type="text"
                    value={newSansTime}
                    onChange={(e) => setNewSansTime(e.target.value)}
                    placeholder="۱۹:۳۰"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">روز هفته:</label>
                  <input
                    type="text"
                    value={newSansWeekday}
                    onChange={(e) => setNewSansWeekday(e.target.value)}
                    placeholder="جمعه"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSansModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  افزودن سانس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: SALON FLOORPLAN PREVIEW (SalonPlan)
      ========================================================================= */}
      {viewSalonPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-3xl w-full border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />
                  پلان معماری و ساختار سالن: {viewSalonPlan.name}
                </h3>
                <span className="text-xs text-slate-400">
                  ظرفیت کل: {toPersianDigits(viewSalonPlan.capacity)} صندلی · شهر: {viewSalonPlan.city}
                </span>
              </div>
              <button
                onClick={() => setViewSalonPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Representation */}
            <div className="text-center py-2 px-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black text-xs">
              سن اجرای زنده / صحنه اصلی (STAGE)
            </div>

            {/* Visual Floorplan by Parts */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {viewSalonPlan.parts.map((p) => (
                <div key={p.id} className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-amber-500">{p.name} ({p.tier.toUpperCase()})</span>
                    <span className="font-mono text-slate-400">
                      {toPersianDigits(p.rows)} ردیف × {toPersianDigits(p.seatsPerRow)} صندلی = {toPersianDigits(p.rows * p.seatsPerRow)} صندلی
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {Array.from({ length: Math.min(p.rows, 5) }).map((_, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1 justify-center">
                        <span className="text-[9px] text-slate-500 font-mono w-6">ر{rIdx + 1}</span>
                        <div className="flex items-center gap-0.5 overflow-x-auto py-0.5">
                          {Array.from({ length: Math.min(p.seatsPerRow, 18) }).map((_, sIdx) => (
                            <div
                              key={sIdx}
                              className="w-3.5 h-3.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40 text-[7px] flex items-center justify-center font-mono text-emerald-400"
                              title={`ردیف ${rIdx + 1} صندلی ${sIdx + 1}`}
                            >
                              {sIdx + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {p.rows > 5 && (
                      <div className="text-center text-[10px] text-slate-400 pt-1">
                        ... و {toPersianDigits(p.rows - 5)} ردیف دیگر مشابه
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewSalonPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                بستن نقشه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: ADD ARTIST (Actresses/Create)
      ========================================================================= */}
      {showAddArtistModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              افزودن هنرمند یا عوامل جدید (Actresses)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-medium">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  placeholder="مثال: همایون شجریان"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">نقش در اثر:</label>
                <select
                  value={newArtistRole}
                  onChange={(e) => setNewArtistRole(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="خواننده">خواننده</option>
                  <option value="کارگردان">کارگردان</option>
                  <option value="بازیگر">بازیگر</option>
                  <option value="سرپرست ارکستر">سرپرست ارکستر</option>
                  <option value="نوازنده">نوازنده</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">بیوگرافی کوتاه:</label>
                <textarea
                  rows={3}
                  value={newArtistBio}
                  onChange={(e) => setNewArtistBio(e.target.value)}
                  placeholder="رزومه کوتاه و سوابق هنری..."
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddArtistModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (!newArtistName) return;
                  setArtists((prev) => [
                    ...prev,
                    {
                      id: `art-${Date.now()}`,
                      name: newArtistName,
                      role: newArtistRole,
                      bio: newArtistBio || 'هنرمند و فعال صحنه.',
                      assignedEvents: [events[0]?.title || 'کنسرت جدید'],
                    },
                  ]);
                  setShowAddArtistModal(false);
                  setNewArtistName('');
                  setNewArtistBio('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                ثبت هنرمند
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: CREATE DISCOUNT CODE (تعریف کد تخفیف در پنل مدیریت)
      ========================================================================= */}
      {showAddDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                تعریف کد تخفیف جدید (Discount Voucher)
              </h3>
              <button
                onClick={() => setShowAddDiscountModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscountSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">کد کوپن تخفیف (حروف لاتین یا عدد):</label>
                <input
                  type="text"
                  required
                  value={newDiscCode}
                  onChange={(e) => setNewDiscCode(e.target.value.toUpperCase())}
                  placeholder="مثال: SUMMER40 یا TEHRAN10"
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold uppercase ${
                    isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">توضیحات و مناسبت تخفیف:</label>
                <input
                  type="text"
                  value={newDiscDesc}
                  onChange={(e) => setNewDiscDesc(e.target.value)}
                  placeholder="مثال: تخفیف مناسبتی افتتاح سالن جدید"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">نوع تخفیف:</label>
                  <select
                    value={newDiscType}
                    onChange={(e) => setNewDiscType(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="percent">درصدی (٪)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">
                    {newDiscType === 'percent' ? 'درصد تخفیف (۱ الی ۱۰۰):' : 'مبلغ تخفیف (تومان):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newDiscType === 'percent' ? 100 : 2000000}
                    value={newDiscValue}
                    onChange={(e) => setNewDiscValue(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">اختصاص به رویداد خاص:</label>
                <select
                  value={newDiscEventId}
                  onChange={(e) => setNewDiscEventId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="all">کلیه رویدادهای سامانه لیندو تیکت</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">حداکثر سقف استفاده:</label>
                  <input
                    type="number"
                    min="1"
                    value={newDiscMaxUsage}
                    onChange={(e) => setNewDiscMaxUsage(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">کف خرید سبد (تومان):</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newDiscMinOrder}
                    onChange={(e) => setNewDiscMinOrder(Number(e.target.value))}
                    placeholder="۰ = بدون شرط"
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">تاریخ انقضای کد تخفیف:</label>
                <input
                  type="text"
                  value={newDiscExpiry}
                  onChange={(e) => setNewDiscExpiry(e.target.value)}
                  placeholder="۱۴۰۵/۱۰/۳۰"
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDiscountModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  ثبت کد تخفیف در سامانه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
