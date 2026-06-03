import React, { useState, useRef, useEffect } from 'react';
import styles from './DateStrip.module.css';

interface DateStripProps {
  selectedDate: Date | 'LIVE' | 'ALL';
  onSelectDate: (date: Date | 'LIVE' | 'ALL') => void;
}

export default function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
  // Drag to scroll logic for premium desktop UX
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // The central date of the strip, defaults to today
  const [stripCenterDate, setStripCenterDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Automatically center the selected date on load or center date change
  useEffect(() => {
    const timer = setTimeout(() => {
      centerDate(stripCenterDate, true);
    }, 100);
    return () => clearTimeout(timer);
  }, [stripCenterDate]);

  const centerDate = (date: Date, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const targetBtn = el.querySelector(`[data-date="${dateStr}"]`) as HTMLElement;
    if (targetBtn) {
      const parentRect = el.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      const targetScrollLeft = el.scrollLeft + (btnRect.left - parentRect.left) - (parentRect.width / 2) + (btnRect.width / 2);
      
      el.scrollTo({
        left: targetScrollLeft,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else {
      el.scrollTo({
        left: (el.scrollWidth - el.clientWidth) / 2,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    el.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft += e.deltaY;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getDayOfWeek = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const dates = [];
  // Generating a wider range of dates so the user has plenty to scroll horizontally
  for (let i = -10; i <= 10; i++) {
    const d = new Date(stripCenterDate);
    d.setDate(stripCenterDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    
    const dayStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const dateLabel = `${dayStr}/${monthStr}`;
    
    const displayLabel = `${getDayOfWeek(d)} ${dateLabel}`;
    
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
  
    dates.push({
      id: `DATE_${d.getTime()}`,
      displayLabel,
      date: d,
      dateStr,
    });
  }

  const isSameDay = (d1: Date, d2: any) => {
    if (!(d2 instanceof Date)) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parts = e.target.value.split('-');
      if (parts.length === 3) {
        // Parse local date
        const newDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        newDate.setHours(0, 0, 0, 0);
        setStripCenterDate(newDate);
        onSelectDate(newDate);
      }
    }
  };

  return (
    <div className={styles.dateStripWrapper}>
      <div className={styles.container}>
        
        {/* Khối Bộ lọc (Góc trái): Switch/Toggle liền nhau */}
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${selectedDate === 'ALL' ? styles.toggleBtnActiveAll : ''}`}
            onClick={() => onSelectDate('ALL')}
          >
            Tất cả
          </button>
          <button 
            className={`${styles.toggleBtn} ${styles.liveToggleBtn} ${selectedDate === 'LIVE' ? styles.toggleBtnActiveLive : ''}`}
            onClick={() => onSelectDate('LIVE')}
          >
            <span className={styles.liveDot}></span>
            LIVE
          </button>
        </div>

        {/* Vạch chia ngăn dọc */}
        <div className={styles.verticalDivider}></div>

        {/* Khối Ngày tháng (Giữa/Phải) */}
        <div 
          ref={scrollRef}
          className={`${styles.dateStripScroll} ${isDown ? styles.dateStripScrollActive : ''}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
        >
          {dates.map((d) => {
            const isActive = isSameDay(d.date, selectedDate);
            return (
              <button
                key={d.id}
                data-date={d.dateStr}
                className={`${styles.dateBtn} ${isActive ? styles.dateBtnActive : ''}`}
                onClick={() => onSelectDate(d.date)}
              >
                {d.displayLabel}
              </button>
            );
          })}
        </div>

        {/* Today & Calendar controls Wrapper */}
        <div className={styles.controlsWrapper}>
          <button 
            className={styles.todayBtn}
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setStripCenterDate(d);
              onSelectDate(d);
              
              // Force center today's date element
              centerDate(d, true);
              // Set multiple timeouts to combat browser rendering lag/momentum-scroll cancellation
              setTimeout(() => centerDate(d, true), 30);
              setTimeout(() => centerDate(d, true), 100);
              setTimeout(() => centerDate(d, true), 250);
            }}
            title="Auto về ngày hôm nay"
          >
            Hôm nay
          </button>
          
          <div className={styles.calendarWrapper}>
            <input 
              type="date" 
              className={styles.calendarInput}
              onChange={handleCalendarChange}
              title="Chọn ngày"
            />
            <button className={styles.calendarBtn} aria-label="Select date from calendar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.calendarIcon}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
