import {
  Salon,
  PartOfSalon,
  EventItem,
  RunTurn,
  CreateSalonPayload,
  CreateBarnamePayload,
  CreateSansPayload,
  Seat
} from '../types';
import { apiRequest, BackendError } from '../auth/api';

/**
 * Salon API Services
 */
export const salonApi = {
  // Fetch list of salons from /api/events or /api/admin/salons
  async getSalons(): Promise<Salon[]> {
    // Attempt standard salon list from backend
    try {
      const data = await apiRequest<any[]>('/admin/salons', { method: 'GET' });
      return data.map(normalizeSalon);
    } catch (err: any) {
      if (err.status === 404) {
        // Fallback: derive salons from existing events list if admin/salons endpoint is not yet mounted
        const events = await apiRequest<any[]>('/events/', { method: 'GET' });
        const uniqueSalonsMap = new Map<number, Salon>();
        events.forEach((evt) => {
          if (evt.salon_id && !uniqueSalonsMap.has(evt.salon_id)) {
            uniqueSalonsMap.set(evt.salon_id, {
              id: String(evt.salon_id),
              name: evt.salon_name || `سالن شماره ${evt.salon_id}`,
              city: evt.city || 'مشهد',
              address: '',
              capacity: 0,
              parts: [],
            });
          }
        });
        return Array.from(uniqueSalonsMap.values());
      }
      throw err;
    }
  },

  // Create a new salon
  async createSalon(payload: CreateSalonPayload): Promise<{ success: boolean; salonId: number; message: string }> {
    return apiRequest<{ success: boolean; salonId: number; message: string }>('/admin/salons', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        city: payload.city,
        address: payload.address || '',
        capacity: payload.capacity || 0,
        layout_template: payload.layoutTemplate,
        stage_position: payload.stagePosition,
        aisles_count: payload.aislesCount,
        parts: payload.parts || [],
      }),
    });
  },

  // Update an existing salon (Phase 3 proposed route: PUT /api/admin/salons/{id})
  async updateSalon(salonId: number, payload: Partial<CreateSalonPayload>): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/salons/${salonId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Delete a salon (Phase 3 proposed route: DELETE /api/admin/salons/{id})
  async deleteSalon(salonId: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/salons/${salonId}`, {
      method: 'DELETE',
    });
  },

  // Save/Update Salon Plan & Parts
  async saveSalonPlan(
    salonId: number,
    parts: PartOfSalon[],
    meta?: { layoutTemplate?: string; stagePosition?: string; aislesCount?: number }
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/salons/${salonId}/plan`, {
      method: 'POST',
      body: JSON.stringify({
        parts: parts.map((p) => ({
          name: p.name,
          tier: p.tier,
          rows: p.rows,
          seats_per_row: p.seatsPerRow,
          price: p.price,
          shape: p.shape,
          is_accessible: p.isAccessible,
          door_access: p.doorAccess,
        })),
        meta,
      }),
    });
  },
};

/**
 * Event / Barname API Services
 */
export const barnameApi = {
  // Fetch all active events with optional category and city filtering
  async getEvents(params?: { category?: string; city?: string; search?: string }): Promise<EventItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.city && params.city !== 'همه شهرها') query.set('city', params.city);
    if (params?.search) query.set('search', params.search);

    const endpoint = `/events/?${query.toString()}`;
    const rawEvents = await apiRequest<any[]>(endpoint, { method: 'GET' });
    return rawEvents.map(normalizeEvent);
  },

  // Fetch single event details
  async getEventDetail(eventId: number): Promise<EventItem> {
    const raw = await apiRequest<any>(`/events/${eventId}`, { method: 'GET' });
    return normalizeEvent(raw);
  },

  // Create new program/event (Phase 3 proposed route: POST /api/admin/events)
  async createBarname(payload: CreateBarnamePayload): Promise<{ success: boolean; eventId: number; message: string }> {
    return apiRequest<{ success: boolean; eventId: number; message: string }>('/admin/events', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        sub_title: payload.subTitle,
        category: payload.category,
        city: payload.city,
        salon_id: payload.salonId,
        date_range: payload.dateRange,
        duration_minutes: payload.durationMinutes,
        description: payload.description,
        rules: payload.rules,
        cast: payload.cast,
        min_price: payload.minPriceRial,
        max_price: payload.maxPriceRial,
        is_featured: payload.isFeatured,
        is_draft: payload.isDraft,
        notify_at: payload.notifyAt,
        poster_url: payload.posterUrl,
        ticket_notice: payload.ticketNotice,
        language: payload.language,
      }),
    });
  },

  // Update existing event
  async updateBarname(eventId: number, payload: Partial<CreateBarnamePayload>): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Delete event
  async deleteBarname(eventId: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/events/${eventId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Sans / Showtime (RunTurn) API Services
 */
export const sansApi = {
  // Create a new sans for an event, optionally with an independent salon
  async createSans(payload: CreateSansPayload): Promise<{ success: boolean; sansId: number; message: string }> {
    return apiRequest<{ success: boolean; sansId: number; message: string }>(`/admin/events/${payload.barnameId}/sans`, {
      method: 'POST',
      body: JSON.stringify({
        barname_id: payload.barnameId,
        salon_id: payload.salonId,
        date: payload.dateShamsi,
        time: payload.time,
        weekday: payload.weekday,
        sales_start_at: payload.salesStartAt,
        sales_end_at: payload.salesEndAt,
        description: payload.description,
        tier_prices: payload.tierPricesRial,
        is_sold_out: payload.isSoldOut,
      }),
    });
  },

  // Toggle sans sold out status
  async toggleSansSoldOut(sansId: number, isSoldOut: boolean): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/admin/sans/${sansId}/sold-out`, {
      method: 'PATCH',
      body: JSON.stringify({ is_sold_out: isSoldOut }),
    });
  },

  // Fetch real seat plan for a specific sans
  async getSeatPlan(runTurnId: number): Promise<Seat[]> {
    const rawSeats = await apiRequest<any[]>(`/seats/plan/${runTurnId}`, { method: 'GET' });
    return rawSeats.map((s) => ({
      id: String(s.id),
      partId: String(s.part_id),
      partName: s.part_name,
      row: s.row,
      number: s.number,
      price: s.price,
      status: s.status,
    }));
  },
};

/**
 * File / Poster Upload Service (connecting to multipart service, not storing data URLs)
 */
export const fileUploadApi = {
  async uploadPoster(file: File): Promise<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<{ url: string; fileName: string }>('/upload/poster', {
      method: 'POST',
      body: formData,
    });
  },
};

/**
 * Normalization helper from Backend Schemas to Frontend EventItem
 */
function normalizeEvent(raw: any): EventItem {
  return {
    id: String(raw.id),
    title: raw.title,
    subTitle: raw.sub_title,
    category: raw.category,
    city: raw.city,
    salonId: String(raw.salon_id),
    salonName: raw.salon_name || '',
    address: '',
    dateRange: raw.date_range,
    durationMinutes: raw.duration_minutes || 90,
    description: raw.description || '',
    minPrice: raw.min_price || 0,
    maxPrice: raw.max_price || 0,
    bannerGradient: raw.banner_gradient || 'from-amber-600 via-stone-900 to-slate-950',
    accentColor: '#f59e0b',
    isFeatured: !!raw.is_featured,
    isActive: true,
    rules: [
      'حضور در سالن حداقل ۳۰ دقیقه قبل از شروع برنامه الزامی است.',
      'ورود با لباس رسمی و رعایت شئونات اسلامی الزامی می‌باشد.',
      'همراه داشتن بارکد بلیت دیجیتال یا چاپ کاغذی در گیت ورودی ضروری است.',
    ],
    cast: [],
    runTurns: (raw.run_turns || []).map((rt: any) => ({
      id: String(rt.id),
      eventId: String(raw.id),
      date: rt.date,
      time: rt.time,
      weekday: rt.weekday,
      availableSeatsCount: rt.available_seats !== undefined ? rt.available_seats : 300,
      totalSeatsCount: 380,
      isSoldOut: !!rt.is_sold_out,
    })),
  };
}

function normalizeSalon(raw: any): Salon {
  return {
    id: String(raw.id),
    name: raw.name,
    city: raw.city,
    address: raw.address || '',
    capacity: raw.capacity || 0,
    parts: (raw.parts || []).map((p: any) => ({
      id: String(p.id),
      salonId: String(raw.id),
      name: p.name,
      tier: p.tier,
      rows: p.rows,
      seatsPerRow: p.seats_per_row,
      price: p.default_price || 0,
    })),
  };
}
