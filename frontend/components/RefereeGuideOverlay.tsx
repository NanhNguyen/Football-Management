'use client';

import React from 'react';
import styles from './RefereeGuideOverlay.module.css';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './AppIcons';

interface RefereeGuideOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RefereeGuideOverlay({ isVisible, onClose }: RefereeGuideOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={styles.overlayBackdrop}>
      
      {/* Vùng đại diện cho nội dung thật (trừ đi 280px của Sidebar) */}
      <div className={styles.contentWrapper}>
        
        {/* 1. Hướng dẫn bấm Bắt đầu */}
        <div className={styles.pointerCenter}>
          <div className={`${styles.emojiArrow} ${styles.arrowDown}`} style={{ display: 'flex', justifyContent: 'center' }}>
            <ChevronDownIcon size={32} />
          </div>
          <div className={`${styles.titleText} ${styles.titleYellow}`}>
            1. Bấm nút Bắt Đầu ở đây
          </div>
          <div className={styles.subtitleText}>để đồng hồ đếm ngược chạy</div>
        </div>

        {/* 2. Hướng dẫn chọn cầu thủ bên trái */}
        <div className={styles.pointerLeft}>
          <div className={`${styles.titleText} ${styles.titleCyan}`}>
            2. Chọn Cầu thủ
          </div>
          <div className={styles.subtitleText}>để ghi Bàn Thắng, Thẻ Phạt hoặc Thay Người</div>
          <div className={`${styles.emojiArrow} ${styles.arrowLeft}`} style={{ display: 'flex', justifyContent: 'center' }}>
            <ChevronLeftIcon size={32} />
          </div>
        </div>

        {/* 3. Hướng dẫn chọn cầu thủ bên phải */}
        <div className={styles.pointerRight}>
          <div className={`${styles.titleText} ${styles.titleCyan}`}>
            2. Chọn Cầu thủ
          </div>
          <div className={styles.subtitleText}>để thao tác sự kiện cho Đội Khách</div>
          <div className={`${styles.emojiArrow} ${styles.arrowRight}`} style={{ display: 'flex', justifyContent: 'center' }}>
            <ChevronRightIcon size={32} />
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className={styles.footerActions}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Bạn đã nắm rõ cách điều khiển chưa?</div>
        <button className={styles.continueBtn} onClick={onClose}>
          ĐÃ HIỂU - TIẾP TỤC
        </button>
      </div>

    </div>
  );
}
