export type EventCategory = 'concert' | 'theater' | 'cinema' | 'comedy' | 'conference';

export interface CastMember {
  name: string;
  role: string;
}

export interface RunTurn {
  id: string;
  eventId: string;
  salonId?: string; // Every sans can have an independent salon
  salonName?: string;
  salonAddress?: string;
  date: string;
  time: string;
  weekday: string;
  availableSeatsCount: number;
  totalSeatsCount: number;
  isSoldOut?: boolean;
  salesStartAt?: string;
  salesEndAt?: string;
  description?: string;
  venueCoordinates?: string;
  tierPrices?: Record<string, number>;
}

export interface PartOfSalon {
  id: string;
  salonId: string;
  name: string;
  tier: 'vip' | 'ground' | 'balcony' | 'lodge';
  rows: number;
  seatsPerRow: number;
  price: number;
  shape?: 'straight' | 'arc' | 'angled_left' | 'angled_right';
  rowStart?: number;
  isAccessible?: boolean;
  doorAccess?: string;
  color?: string;
}

export interface Salon {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number;
  parts: PartOfSalon[];
  layoutTemplate?: 'arena' | 'theater' | 'blackbox' | 'cinema' | 'custom';
  stagePosition?: 'top' | 'center' | 'thrust' | 'bottom';
  aislesCount?: number;
  isActive?: boolean;
  version?: number;
  moneyUnit?: string;
}

export type SeatStatus = 'available' | 'selected' | 'reserved' | 'sold';

export interface Seat {
  id: string;
  partId: string;
  partName: string;
  row: number;
  number: number;
  price: number;
  status: SeatStatus;
}

export interface EventItem {
  images?: {id:number;url:string;preview_url:string;alt:string}[];
  moneyUnit?: string;
  id: string;
  title: string;
  subTitle?: string;
  category: EventCategory;
  city: string;
  salonId: string;
  salonName: string;
  address: string;
  dateRange: string;
  durationMinutes: number;
  description: string;
  rules?: string[];
  cast: CastMember[];
  minPrice: number;
  maxPrice: number;
  bannerGradient: string;
  accentColor: string;
  isFeatured?: boolean;
  isActive: boolean;
  isDraft?: boolean;
  isSoldOut?: boolean;
  notifyAt?: string;
  posterUrl?: string;
  ticketNotice?: string;
  language?: 'fa' | 'en';
  runTurns: RunTurn[];
}

export interface DiscountCode {
  id?: string;
  code: string;
  discountPercent?: number;
  fixedAmount?: number;
  description: string;
  eventId?: string; // 'all' or specific eventId
  eventTitle?: string;
  maxUsage?: number;
  usedCount?: number;
  expiresAt?: string;
  isActive?: boolean;
  minOrderAmount?: number;
}

export interface FactorItem {
  factorNumber: string;
  trackingCode: string;
  refId: string;
  event: EventItem;
  runTurn: RunTurn;
  salon: Salon;
  seats: Seat[];
  customerName: string;
  customerMobile: string;
  customerNationalCode: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  discountCode?: string;
  paymentGateway: 'mellat' | 'parsian' | 'zarinpal' | 'pos' | 'cash' | 'complimentary';
  paidAt: string;
  qrPayload: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
}

export interface TicketScanCheckResult {
  status: 'valid' | 'already_checked' | 'invalid';
  factor?: FactorItem;
  message: string;
  timestamp: string;
}

export type ActiveAppMode = 'portal' | 'checker' | 'admin' | 'my-tickets' | 'box-office' | 'producer';

// Gishow Specific Feature Models (Mapped directly from Gishow / LinduTicket ASP.NET MVC controllers)

export interface MaliRecord {
  id: string;
  eventTitle: string;
  producerName: string;
  runTurnDate: string;
  totalGrossSale: number;
  commissionPercent: number; // e.g. 4%
  commissionAmount: number;
  taxAmount: number;
  netPayableToProducer: number;
  shebaNumber: string;
  status: 'settled' | 'pending' | 'processing';
  settledDate?: string;
  trackingNumber?: string;
}

export interface ArtistMember {
  id: string;
  name: string;
  role: 'خواننده' | 'کارگردان' | 'بازیگر' | 'سرپرست ارکستر' | 'نوازنده' | 'نویسنده';
  bio: string;
  imageUrl?: string;
  assignedEvents: string[];
}

export interface BankTerminalConfig {
  id: string;
  bankName: 'به‌پرداخت ملت' | 'تجارت الکترونیک پارسیان' | 'زرین‌پال' | 'سداد ملی';
  terminalId: string;
  merchantId: string;
  userName?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface ProducerDocument {
  id: string;
  producerName: string;
  eventName: string;
  docType: 'مجوز فرهنگ و ارشاد اسلامی' | 'مجوز اداره اماکن' | 'قرارداد اجاره سالن' | 'کارت ملی تهیه‌کننده';
  fileName: string;
  uploadDate: string;
  status: 'approved' | 'pending_review' | 'rejected';
  rejectionReason?: string;
}

export interface SiteSettings {
  siteName: string;
  siteEnName: string;
  supportPhone: string;
  supportMobile: string;
  officeAddress: string;
  smsProvider: 'kavenegar' | 'melipayamak' | 'ghasedak';
  smsApiKey: string;
  smsPatternCode: string;
  vatTaxPercent: number;
  defaultCommissionPercent: number;
  reservationLockMinutes: number;
  metaDescription: string;
}

export interface CooperateRequest {
  id: string;
  organizerName: string;
  phone: string;
  eventTitle: string;
  category: EventCategory;
  city: string;
  preferredSalon: string;
  estimatedAudience: number;
  description: string;
  createdAt: string;
}

export type UserRole = 'super_admin' | 'producer' | 'gate_checker' | 'customer';

export interface UserAccount {
  id: string;
  fullName: string;
  mobile: string;
  nationalCode?: string;
  role: UserRole;
  isActive: boolean;
  registeredAt: string;
  ticketsCount: number;
  totalPurchasedAmount: number;
}

// Phase 3 Backend Request Payloads & Response Schemas
export interface CreateSalonPayload {
  name: string;
  city: string;
  address?: string;
  capacity?: number;
  layoutTemplate?: string;
  stagePosition?: string;
  aislesCount?: number;
  version?: number;
  isActive?: boolean;
  parts?: Array<{
    id?: number;
    name: string;
    tier: string;
    rows: number;
    seatsPerRow: number;
    price: number;
    shape?: string;
    isAccessible?: boolean;
    doorAccess?: string;
  }>;
}

export interface CreateBarnamePayload {
  title: string;
  subTitle?: string;
  category: EventCategory;
  city: string;
  salonId: number;
  dateRange: string;
  durationMinutes: number;
  description?: string;
  rules?: string[];
  cast?: Array<{ name: string; role: string }>;
  minPriceRial: number;
  maxPriceRial: number;
  isFeatured?: boolean;
  isDraft?: boolean;
  notifyAt?: string;
  posterUrl?: string;
  ticketNotice?: string;
  language?: 'fa' | 'en';
}

export interface CreateSansPayload {
  barnameId: number;
  salonId: number; // Every sans can have an independent salon
  dateShamsi: string;
  time: string;
  weekday: string;
  salesStartAt?: string;
  salesEndAt?: string;
  description?: string;
  tierPricesRial?: Record<string, number>;
  isSoldOut?: boolean;
  startsAt?: string;
  partPrices?: {part_id: number; amount_irr: number}[];
}
