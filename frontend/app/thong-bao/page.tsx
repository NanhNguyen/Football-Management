'use client';

import React from 'react';
import styles from './page.module.css';

export default function ThongBaoPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.bellIcon}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <h1 className={styles.title}>Thông báo</h1>
        <p className={styles.subtitle}>Tính năng thông báo sắp ra mắt</p>
        <p className={styles.description}>
          Chúng tôi đang phát triển hệ thống thông báo để bạn không bỏ lỡ
          bất kỳ trận đấu nào của đội bóng yêu thích.
        </p>
      </div>
    </div>
  );
}
