import {Salon, PartOfSalon, EventItem, CreateSalonPayload, CreateBarnamePayload, CreateSansPayload, Seat} from '../types';
import {api, ApiError} from '../auth/api';

export function serverId(id: string | number): number {
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('شناسه معتبر سرور لازم است.');
  return value;
}
export function moneyIRR(amount: number, unit: 'toman' | 'IRR' = 'toman'): number {
  const result = unit === 'toman' ? amount * 10 : amount;
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('مبلغ باید عدد صحیح ریالی در محدوده مجاز باشد.');
  return result;
}
export function normalizeSalon(raw: any): Salon {
  return {id: String(raw.id), name: raw.name, city: raw.city, address: raw.address || '', capacity: raw.capacity,
    version: raw.version, moneyUnit: raw.money_unit, isActive: raw.is_active ?? true,
    layoutTemplate: raw.layout_template, stagePosition: raw.stage_position, aislesCount: raw.aisles_count,
    parts: (raw.parts || []).map((p: any) => ({id: String(p.id), salonId: String(raw.id), name: p.name,
      tier: p.tier, rows: p.rows, seatsPerRow: p.seats_per_row, price: p.amount_irr == null ? 0 : p.amount_irr / 10,
      shape: p.shape, isAccessible: p.is_accessible, doorAccess: p.door_access}))};
}
function salonBody(payload: Partial<CreateSalonPayload>) {
  if (!payload.parts?.length) throw new Error('ذخیره سالن نیاز به پلان کامل دارد.');
  return {name: payload.name, city: payload.city, address: payload.address || '', is_active: payload.isActive ?? true,
    layout_template: payload.layoutTemplate || 'theater', stage_position: payload.stagePosition || 'top',
    aisles_count: payload.aislesCount ?? 2, version: payload.version ?? 0,
    parts: payload.parts.map(p => ({id: p.id ?? null, name: p.name, tier: p.tier, rows: p.rows,
      seats_per_row: p.seatsPerRow, amount_irr: moneyIRR(p.price, 'IRR'), shape: p.shape || 'straight',
      is_accessible: p.isAccessible ?? false, door_access: p.doorAccess || ''}))};
}
export const salonApi = {
  async getSalons(): Promise<Salon[]> {return (await api<any[]>('/admin/catalog/salons')).map(normalizeSalon);},
  async getVenueOptions(): Promise<Salon[]> {return (await api<any[]>('/admin/catalog/venue-options')).map(normalizeSalon);},
  async getForTurn(id: string): Promise<Salon> {return normalizeSalon(await api(`/catalog/run-turns/${serverId(id)}/salon`));},
  async createSalon(payload: CreateSalonPayload): Promise<Salon> {
    return normalizeSalon(await api('/admin/catalog/salons', 'POST', salonBody(payload)));
  },
  async updateSalon(id: number, payload: Partial<CreateSalonPayload>): Promise<Salon> {
    return normalizeSalon(await api(`/admin/catalog/salons/${serverId(id)}`, 'PATCH', salonBody(payload)));
  },
  async deleteSalon(id: number): Promise<void> {await api(`/admin/catalog/salons/${serverId(id)}`, 'DELETE');},
  async saveSalonPlan(id: number, parts: PartOfSalon[]): Promise<Salon> {
    throw new ApiError(501, 'پلان باید همراه مشخصات و نسخه سالن ذخیره شود.');
  },
};
export function normalizeTurn(raw: any) {
  const starts = raw.starts_at ? new Date(raw.starts_at) : null;
  return {id:String(raw.id),eventId:String(raw.event_id),salonId:String(raw.salon_id),
    salonName:raw.salon_name || '',salonAddress:raw.salon_address || '',
    date: starts ? new Intl.DateTimeFormat('fa-IR', {timeZone:'Asia/Tehran'}).format(starts) : raw.date || '',
    time: starts ? new Intl.DateTimeFormat('fa-IR', {timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hour12:false}).format(starts) : raw.time || '',
    weekday: starts ? new Intl.DateTimeFormat('fa-IR', {timeZone:'Asia/Tehran',weekday:'long'}).format(starts) : raw.weekday || '',
    availableSeatsCount: raw.available_seats ?? 0, totalSeatsCount: raw.total_seats ?? 0,
    isSoldOut: raw.is_sold_out ?? false, description: raw.description || '',
    salesStartAt: raw.sale_starts_at, salesEndAt: raw.sale_ends_at};
}
export function normalizeEvent(raw: any): EventItem {
  return {id:String(raw.id),moneyUnit:raw.money_unit,title:raw.title,subTitle:raw.sub_title,category:raw.category,city:raw.city || '',
    salonId:String(raw.salon_id),salonName:raw.salon_name || '',address:raw.address || '',dateRange:raw.date_range || '',
    durationMinutes:raw.duration_minutes ?? 0,description:raw.description || '',cast:raw.cast || [],rules:raw.rules || [],
    minPrice:(raw.min_price ?? 0)/10,maxPrice:(raw.max_price ?? 0)/10,
    bannerGradient:raw.banner_gradient || 'from-amber-600 via-stone-900 to-slate-950',accentColor:'#f59e0b',
    isFeatured:raw.is_featured ?? false,isActive:raw.is_active ?? false,isDraft:raw.publication_status === 'draft',
    ticketNotice:raw.ticket_description,language:raw.language,runTurns:(raw.run_turns || []).map(normalizeTurn)};
}
export const barnameApi = {
  async getEvents(): Promise<EventItem[]> {return (await api<any[]>('/catalog/events')).map(normalizeEvent);},
  async getManaged(): Promise<EventItem[]> {return (await api<any[]>('/admin/catalog/events')).map(normalizeEvent);},
  async getEventDetail(id: number): Promise<EventItem> {return normalizeEvent(await api(`/catalog/events/${serverId(id)}`));},
  async createBarname(payload: CreateBarnamePayload): Promise<EventItem> {
    return normalizeEvent(await api('/admin/catalog/events','POST',eventBody(payload)));
  },
  async updateBarname(id: number, payload: Partial<CreateBarnamePayload>): Promise<EventItem> {
    return normalizeEvent(await api(`/admin/catalog/events/${serverId(id)}`,'PATCH',eventBody(payload)));
  },
  async deleteBarname(id: number): Promise<void> {await api(`/admin/catalog/events/${serverId(id)}`,'DELETE');},
};
function eventBody(p: Partial<CreateBarnamePayload>) {
  if (p.posterUrl || p.notifyAt) throw new ApiError(501,'بارگذاری تصویر و زمان اطلاع‌رسانی هنوز پیاده نشده‌اند؛ برنامه ذخیره نشد.');
  return {title:p.title,salon_id:p.salonId,category:p.category,sub_title:p.subTitle || '',description:p.description || '',
    duration_minutes:p.durationMinutes,rules:p.rules || [],cast:p.cast || [],is_featured:p.isFeatured ?? false,
    publication_status:p.isDraft === false ? 'published':'draft',ticket_description:p.ticketNotice || '',language:p.language || 'fa'};
}
export const sansApi = {
  async createSans(p: CreateSansPayload) {
    if (!p.startsAt || !p.partPrices?.length) throw new Error('زمان استاندارد و قیمت تمام جایگاه‌ها لازم است.');
    return normalizeTurn(await api(`/admin/catalog/events/${serverId(p.barnameId)}/run-turns`,'POST',{
      salon_id:serverId(p.salonId),starts_at:p.startsAt,sale_starts_at:p.salesStartAt || null,sale_ends_at:p.salesEndAt || null,
      description:p.description || '',is_visible:true,part_prices:p.partPrices}));
  },
  async toggleSansSoldOut(id: number, value: boolean): Promise<void> {throw new ApiError(501,'وضعیت موجودی از سرور دریافت می‌شود؛ تغییر نمایشی مجاز نیست.');},
  async getSeatPlan(id: number): Promise<Seat[]> {
    return (await api<any[]>(`/catalog/run-turns/${serverId(id)}/seats`)).map(s=>({id:String(s.id),partId:String(s.part_id),
      partName:s.part_name,row:s.row,number:s.number,price:s.price_irr/10,
      status:['available','reserved','sold'].includes(s.status) ? s.status : 'reserved'}));
  },
};
export const fileUploadApi = {
  async uploadPoster(file: File): Promise<{url:string;fileName:string}> {
    throw new ApiError(501,'سرویس بارگذاری تصویر هنوز پیاده نشده است؛ تصویر فقط پیش‌نمایش است.');
  },
};
