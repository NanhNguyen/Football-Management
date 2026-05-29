import React, { useState, useRef } from 'react';
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getDayOfWeek = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(stripCenterDate);
    d.setDate(stripCenterDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const dateLabel = `${dayStr}/${monthStr}`;
    
    let displayLabel = '';
    if (diffDays === 0) displayLabel = `HÔM NAY ${dateLabel}`;
    else if (diffDays === -1) displayLabel = `HÔM QUA ${dateLabel}`;
    else if (diffDays === 1) displayLabel = `NGÀY MAI ${dateLabel}`;
    else displayLabel = `${getDayOfWeek(d)} ${dateLabel}`;
  
    dates.push({
      id: `DATE_${d.getTime()}`,
      displayLabel,
      date: d,
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
        >
          {dates.map((d) => {
            const isActive = isSameDay(d.date, selectedDate);
            return (
              <button
                key={d.id}
                className={`${styles.dateBtn} ${isActive ? styles.dateBtnActive : ''}`}
                onClick={() => onSelectDate(d.date)}
              >
                {d.displayLabel}
              </button>
            );
          })}
        </div>

        {/* Calendar Picker button with native date input */}
        <div className={styles.calendarWrapper}>
          <input 
            type="date" 
            className={styles.calendarInput}
            onChange={handleCalendarChange}
            title="Chọn ngày"
          />
          <button className={styles.calendarBtn} aria-label="Select date from calendar">
            📅
          </button>
        </div>

      </div>
    </div>
  );
}
