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

  // Generate dates around today
  const today = new Date();
  
  const formatDateLabel = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    let label = formatDateLabel(d);
    let displayLabel = label;

    if (i === -1) { displayLabel = 'Hôm qua'; }
    else if (i === 0) { displayLabel = `Hôm nay ${label}`; }
    else if (i === 1) { displayLabel = `Ngày mai ${label}`; }

    dates.push({
      id: `DATE_${i}`,
      displayLabel,
      date: d,
      isToday: i === 0,
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

        {/* Calendar Picker button */}
        <button className={styles.calendarBtn} aria-label="Select date from calendar">
          📅
        </button>

      </div>
    </div>
  );
}
