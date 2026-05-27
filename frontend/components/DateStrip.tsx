import React, { useState } from 'react';
import styles from './DateStrip.module.css';

interface DateStripProps {
  onSelectDate?: (date: Date | 'LIVE') => void;
}

export default function DateStrip({ onSelectDate }: DateStripProps) {
  const [activeDate, setActiveDate] = useState<string>('TODAY');

  // Generate some dates around today
  const today = new Date();
  
  const formatDateLabel = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const getDayName = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const dates = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    let label = formatDateLabel(d);
    let topLabel = getDayName(d);

    if (i === -1) { topLabel = 'HÔM QUA'; label = formatDateLabel(d); }
    if (i === 0) { topLabel = 'HÔM NAY'; label = formatDateLabel(d); }
    if (i === 1) { topLabel = 'NGÀY MAI'; label = formatDateLabel(d); }

    dates.push({
      id: `DATE_${i}`,
      topLabel,
      label,
      date: d,
      isToday: i === 0,
    });
  }

  const handleSelect = (id: string, date: Date | 'LIVE') => {
    setActiveDate(id);
    if (onSelectDate) onSelectDate(date);
  };

  return (
    <div className={styles.dateStripWrapper}>
      <div className={styles.dateStripScroll}>
        
        <button 
          className={`${styles.liveBtn} ${activeDate === 'LIVE' ? styles.activeLive : ''}`}
          onClick={() => handleSelect('LIVE', 'LIVE')}
        >
          <span className={styles.liveDot}></span>
          LIVE
        </button>

        {dates.map((d) => (
          <button
            key={d.id}
            className={`${styles.dateBtn} ${activeDate === d.id ? styles.activeDate : ''}`}
            onClick={() => handleSelect(d.id, d.date)}
          >
            <span className={styles.topLabel}>{d.topLabel}</span>
            <span className={styles.bottomLabel}>{d.label}</span>
          </button>
        ))}

        <button className={styles.calendarBtn}>
          📅
        </button>
      </div>
    </div>
  );
}
