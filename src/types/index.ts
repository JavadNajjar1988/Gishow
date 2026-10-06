export type EventCategory = 'concert' | 'theater' | 'cinema' | 'comedy' | 'conference';

export interface CastMember {
  name: string;
  role: string;
}

export interface RunTurn {
  id: string;
  eventId: string;
  date: string;
  time: string;
  weekday: string;
  availableSeatsCount: number;
  totalSeatsCount: number;
  isSoldOut?: boolean;
}

export interface PartOfSalon {
  id: string;
  salonId: string;
  name: string;
  tier: 'vip' | 'ground' | 'balcony' | 'lodge';
  rows: number;
  seatsPerRow: number;
  price: number;
}

export interface Salon {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number;
  parts: PartOfSalon[];
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
  runTurns: RunTurn[];
}

export interface DiscountCode {
  code: string;
  discountPercent?: number;
  fixedAmount?: number;
  description: string;
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
  paymentGateway: 'mellat' | 'parsian' | 'zarinpal';
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

export type ActiveAppMode = 'portal' | 'checker' | 'admin' | 'my-tickets';

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
