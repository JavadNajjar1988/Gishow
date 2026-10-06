import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, MapPin, Sparkles, Eye } from 'lucide-react';
import { EventItem, RunTurn, Salon, Seat, SeatStatus } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { ChairIcon } from './ChairIcon';

interface SeatMapModalProps {
  theme: 'light' | 'dark';
  event: EventItem;
  runTurn: RunTurn;
  salon: Salon;
  onClose: () => void;
  onProceedToCheckout: (selectedSeats: Seat[]) => void;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  theme,
  event,
  runTurn,
  salon,
  onClose,
  onProceedToCheckout,
}) => {
  const isDark = theme === 'dark';

  // Active section filter or 'all'
  const [activeSection, setActiveSection] = useState<'all' | 'vip' | 'ground' | 'balcony'>('all');
  
  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // 10-minute temporary reservation timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);

  // Generate realistic seat matrix for this salon and sans
  const initialSeats = useMemo(() => {
    const list: Seat[] = [];

    // 1. VIP Section (Front curved rows: Rows 1 to 3)
    for (let r = 1; r <= 3; r++) {
      for (let s = 1; s <= 14; s++) {
        const hash = (r * 19 + s * 7 + runTurn.id.length * 11) % 100;
        let status: SeatStatus = 'available';
        if (hash < 25) status = 'sold';
        else if (hash < 32) status = 'reserved';

        list.push({
          id: `vip-r${r}-s${s}`,
          partId: 'part-vip',
          partName: 'جایگاه ویژه (VIP)',
          row: r,
          number: s,
          price: 850000,
          status,
        });
      }
    }

    // 2. Ground Floor (Rows 4 to 10) divided into 3 blocks: Right Wing (1-5), Center Wing (6-13), Left Wing (14-18)
    for (let r = 4; r <= 10; r++) {
      // Right Wing: 5 seats
      for (let s = 1; s <= 5; s++) {
        const hash = (r * 23 + s * 13 + 41) % 100;
        let status: SeatStatus = 'available';
        if (hash < 30) status = 'sold';
        list.push({
          id: `ground-right-r${r}-s${s}`,
          partId: 'part-ground-right',
          partName: 'همکف راست',
          row: r,
          number: s,
          price: 550000,
          status,
        });
      }
      // Center Wing: 8 seats
      for (let s = 6; s <= 13; s++) {
        const hash = (r * 17 + s * 11 + 23) % 100;
        let status: SeatStatus = 'available';
        if (hash < 35) status = 'sold';
        else if (hash < 40) status = 'reserved';
        list.push({
          id: `ground-center-r${r}-s${s}`,
          partId: 'part-ground-center',
          partName: 'همکف وسط',
          row: r,
          number: s,
          price: 650000,
          status,
        });
      }
      // Left Wing: 5 seats
      for (let s = 14; s <= 18; s++) {
        const hash = (r * 31 + s * 9 + 59) % 100;
        let status: SeatStatus = 'available';
        if (hash < 28) status = 'sold';
        list.push({
          id: `ground-left-r${r}-s${s}`,
          partId: 'part-ground-left',
          partName: 'همکف چپ',
          row: r,
          number: s,
          price: 550000,
          status,
        });
      }
    }

    // 3. Balcony Section (Tiered back floor: Rows 11 to 14, 16 seats each)
    for (let r = 11; r <= 14; r++) {
      for (let s = 1; s <= 16; s++) {
        const hash = (r * 29 + s * 5 + 73) % 100;
        let status: SeatStatus = 'available';
        if (hash < 22) status = 'sold';
        list.push({
          id: `balcony-r${r}-s${s}`,
          partId: 'part-balcony',
          partName: 'بالکن طبقه اول',
          row: r,
          number: s,
          price: 380000,
          status,
        });
      }
    }

    return list;
  }, [salon, runTurn]);

  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Countdown timer
  useEffect(() => {
    if (selectedSeatIds.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedSeatIds([]);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSeatIds.length]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${toPersianDigits(m)}:${s < 10 ? '۰' : ''}${toPersianDigits(s)}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'reserved') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        alert('حداکثر می‌توانید ۸ صندلی را در یک سفارش رزرو نمایید.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  // Group seats by architecture
  const vipSeats = seats.filter((s) => s.partId === 'part-vip');
  const groundSeats = seats.filter((s) => s.partId.startsWith('part-ground'));
  const balconySeats = seats.filter((s) => s.partId === 'part-balcony');

  // Ground rows 4 to 10
  const groundRows = [4, 5, 6, 7, 8, 9, 10];
  const balconyRows = [11, 12, 13, 14];
  const vipRows = [1, 2, 3];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className={`relative w-full max-w-6xl rounded-3xl border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black">
                پلان معماری سالن و انتخاب صندلی
              </h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {salon.name}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {event.title} · سانس {runTurn.weekday} {runTurn.date} ساعت {runTurn.time}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedSeatIds.length > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}>
                <Clock className="w-4 h-4 animate-pulse text-amber-500" />
                <span>مهلت رزرو:</span>
                <span className="font-mono text-sm tracking-wider">{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div className={`flex items-center rounded-xl border p-0.5 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="p-1.5 hover:text-amber-500 transition-colors cursor-pointer"
                title="بزرگنمایی پلان"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className="p-1.5 hover:text-amber-500 transition-colors cursor-pointer"
                title="کوچک‌نمایی پلان"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:text-amber-500 transition-colors cursor-pointer"
                title="بازنشانی اندازه"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Filters & Visual Legend */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          
          {/* Quick Section Jump */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-medium ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              مشاهده بخش:
            </span>
            {[
              { id: 'all', label: 'نمای کامل سالن' },
              { id: 'vip', label: 'جایگاه VIP' },
              { id: 'ground', label: 'همکف (۳ بلوک)' },
              { id: 'balcony', label: 'بالکن' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium text-xs ${
                  activeSection === sec.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Seat Status Legend with realistic icon visuals */}
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <ChairIcon status="available" seatNumber={1} isDark={isDark} className="w-4 h-4" />
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>صندلی آزاد</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChairIcon status="selected" seatNumber={1} isDark={isDark} className="w-4 h-4" />
              <span className="text-amber-500 font-bold">انتخاب شما</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChairIcon status="sold" seatNumber={1} isDark={isDark} className="w-4 h-4" />
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>فروخته شده</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChairIcon status="reserved" seatNumber={1} isDark={isDark} className="w-4 h-4" />
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>رزرو موقت</span>
            </div>
          </div>

        </div>

        {/* Interactive Architectural Canvas Area */}
        <div className={`flex-1 overflow-auto p-4 sm:p-8 relative ${
          isDark ? 'bg-slate-950' : 'bg-slate-100/60'
        }`}>
          
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 max-w-4xl mx-auto space-y-8"
          >
            
            {/* 1. CURVED ARCHITECTURAL STAGE (سن اصلی اجرا) */}
            <div className="text-center space-y-2">
              <div className="relative max-w-xl mx-auto">
                
                {/* Curved Stage Board */}
                <div className={`relative py-4 px-8 rounded-t-[40px] rounded-b-xl border shadow-xl overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-b from-amber-500/25 via-slate-800 to-slate-900 border-amber-500/40 text-amber-300'
                    : 'bg-gradient-to-b from-amber-100 via-amber-50 to-white border-amber-300 text-amber-900'
                }`}>
                  {/* Spotlights beam effect */}
                  <div className="absolute top-0 left-1/4 w-32 h-6 bg-amber-400/20 blur-md" />
                  <div className="absolute top-0 right-1/4 w-32 h-6 bg-amber-400/20 blur-md" />

                  <div className="relative z-10 flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>صحنه اصلی اجرا / استیج (STAGE)</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                </div>

                {/* Perspective Sightlines Arrow */}
                <div className={`text-[10px] mt-1 font-semibold flex items-center justify-center gap-1 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <span>▲ جهت دید تماشاگران به سمت صحنه ▲</span>
                </div>
              </div>
            </div>

            {/* 2. VIP SECTION (جایگاه ویژه - روبروی استیج) */}
            {(activeSection === 'all' || activeSection === 'vip') && (
              <div className={`p-4 sm:p-6 rounded-3xl border shadow-sm relative ${
                isDark ? 'bg-slate-900/80 border-amber-500/30' : 'bg-white border-amber-200'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/20">
                  <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    جایگاه ویژه (VIP) - بهترین دید به صحنه
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    بهای بلیت: {formatPrice(850000)}
                  </span>
                </div>

                {/* VIP Curved Seat Rows */}
                <div className="flex flex-col items-center gap-2.5">
                  {vipRows.map((rowNum) => {
                    const rowSeats = vipSeats.filter((s) => s.row === rowNum);
                    return (
                      <div key={rowNum} className="flex items-center gap-2">
                        <span className={`w-12 text-[10px] text-left font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ردیف {toPersianDigits(rowNum)}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id);
                            return (
                              <button
                                key={seat.id}
                                disabled={seat.status === 'sold' || seat.status === 'reserved'}
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                className="focus:outline-none"
                              >
                                <ChairIcon
                                  status={isSelected ? 'selected' : seat.status}
                                  seatNumber={seat.number}
                                  isDark={isDark}
                                />
                              </button>
                            );
                          })}
                        </div>

                        <span className={`w-12 text-[10px] text-right font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ردیف {toPersianDigits(rowNum)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MAIN CROSS AISLE (راهروی اصلی بین VIP و همکف) */}
            {(activeSection === 'all' || activeSection === 'ground') && (
              <div className={`py-1.5 px-4 rounded-xl border border-dashed text-center text-[10px] font-semibold tracking-wider ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-500' : 'bg-slate-200/50 border-slate-300 text-slate-500'
              }`}>
                ◄ راهروی اصلی عبور تماشاگران سالن ►
              </div>
            )}

            {/* 3. GROUND FLOOR (همکف با سه بلوک: راست، وسط، چپ) */}
            {(activeSection === 'all' || activeSection === 'ground') && (
              <div className={`p-4 sm:p-6 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    همکف سالن (تفکیک به ۳ بلوک راست، وسط و چپ با راهروهای عبور)
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    بهای بلیت: {formatPrice(550000)} تا {formatPrice(650000)}
                  </span>
                </div>

                {/* Column Headers for Blocks */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-center pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <div className="col-span-3">بلوک راست</div>
                  <div className="col-span-1 text-slate-500">راهرو ۱</div>
                  <div className="col-span-4 text-emerald-500">بلوک وسط (دید مستقیم)</div>
                  <div className="col-span-1 text-slate-500">راهرو ۲</div>
                  <div className="col-span-3">بلوک چپ</div>
                </div>

                {/* Ground Rows */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  {groundRows.map((rowNum) => {
                    const rightWing = groundSeats.filter((s) => s.row === rowNum && s.partId === 'part-ground-right');
                    const centerWing = groundSeats.filter((s) => s.row === rowNum && s.partId === 'part-ground-center');
                    const leftWing = groundSeats.filter((s) => s.row === rowNum && s.partId === 'part-ground-left');

                    return (
                      <div key={rowNum} className="flex items-center gap-1 sm:gap-2">
                        
                        <span className={`w-10 text-[10px] text-left font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ر {toPersianDigits(rowNum)}
                        </span>

                        {/* Right Wing */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {rightWing.map((seat) => (
                            <button
                              key={seat.id}
                              disabled={seat.status === 'sold' || seat.status === 'reserved'}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              <ChairIcon
                                status={selectedSeatIds.includes(seat.id) ? 'selected' : seat.status}
                                seatNumber={seat.number}
                                isDark={isDark}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Aisle 1 */}
                        <div className="w-3 sm:w-5 flex items-center justify-center">
                          <span className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
                        </div>

                        {/* Center Wing */}
                        <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                          {centerWing.map((seat) => (
                            <button
                              key={seat.id}
                              disabled={seat.status === 'sold' || seat.status === 'reserved'}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              <ChairIcon
                                status={selectedSeatIds.includes(seat.id) ? 'selected' : seat.status}
                                seatNumber={seat.number}
                                isDark={isDark}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Aisle 2 */}
                        <div className="w-3 sm:w-5 flex items-center justify-center">
                          <span className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
                        </div>

                        {/* Left Wing */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {leftWing.map((seat) => (
                            <button
                              key={seat.id}
                              disabled={seat.status === 'sold' || seat.status === 'reserved'}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              <ChairIcon
                                status={selectedSeatIds.includes(seat.id) ? 'selected' : seat.status}
                                seatNumber={seat.number}
                                isDark={isDark}
                              />
                            </button>
                          ))}
                        </div>

                        <span className={`w-10 text-[10px] text-right font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ر {toPersianDigits(rowNum)}
                        </span>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. BALCONY TIER (بالکن طبقه اول) */}
            {(activeSection === 'all' || activeSection === 'balcony') && (
              <div className={`p-4 sm:p-6 rounded-3xl border shadow-sm relative ${
                isDark ? 'bg-slate-900/80 border-cyan-500/30' : 'bg-white border-cyan-200'
              }`}>
                {/* Balcony Railing visual */}
                <div className="w-full h-1 bg-cyan-500/30 rounded-full mb-3" />

                <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
                  <span className="text-xs font-black text-cyan-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    بالکن طبقه اول (نمای پانوراما از بالا به کل سالن)
                  </span>
                  <span className="text-xs font-bold text-cyan-600">
                    بهای بلیت: {formatPrice(380000)}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {balconyRows.map((rowNum) => {
                    const rowSeats = balconySeats.filter((s) => s.row === rowNum);
                    return (
                      <div key={rowNum} className="flex items-center gap-2">
                        <span className={`w-12 text-[10px] text-left font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ردیف {toPersianDigits(rowNum)}
                        </span>

                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {rowSeats.map((seat) => (
                            <button
                              key={seat.id}
                              disabled={seat.status === 'sold' || seat.status === 'reserved'}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              <ChairIcon
                                status={selectedSeatIds.includes(seat.id) ? 'selected' : seat.status}
                                seatNumber={seat.number}
                                isDark={isDark}
                              />
                            </button>
                          ))}
                        </div>

                        <span className={`w-12 text-[10px] text-right font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ردیف {toPersianDigits(rowNum)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Hovered Seat Tooltip */}
          {hoveredSeat && (
            <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl border text-xs shadow-2xl backdrop-blur-md pointer-events-none flex items-center gap-3 z-30 ${
              isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300'
            }`}>
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-500">{hoveredSeat.partName}</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>ردیف {toPersianDigits(hoveredSeat.row)}</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>صندلی {toPersianDigits(hoveredSeat.number)}</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-emerald-500 font-extrabold">{formatPrice(hoveredSeat.price)}</span>
            </div>
          )}

        </div>

        {/* Bottom Checkout Action Bar */}
        <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
        }`}>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                صندلی‌های انتخابی:
              </span>
              {selectedSeats.length === 0 ? (
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  هنوز صندلی انتخاب نکرده‌اید
                </span>
              ) : (
                <span className="text-xs font-black text-amber-500">
                  {toPersianDigits(selectedSeats.length)} صندلی ({selectedSeats.map((s) => `${s.partName} ر${s.row} ش${s.number}`).join('، ')})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                مبلغ کل سفارش:
              </span>
              <span className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              انصراف
            </button>

            <button
              disabled={selectedSeats.length === 0}
              onClick={() => onProceedToCheckout(selectedSeats)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>تأیید و صدور فاکتور</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
