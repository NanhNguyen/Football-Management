'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, StarIcon } from './AppIcons';
import styles from './LoginRequiredModal.module.css';

interface LoginRequiredModalProps {
  onClose: () => void;
}

export default function LoginRequiredModal({ onClose }: LoginRequiredModalProps) {
  const router = useRouter();

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modalCard} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.starIconWrapper}>
            <StarIcon size={32} filled color="#E2E8F0" />
            <div className={styles.lockBadge}>
              <LockIcon size={14} color="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Modal Text Content */}
        <h3 className={styles.title}>Yêu cầu đăng nhập</h3>
        <p className={styles.description}>
          Bạn cần đăng nhập tài khoản để sử dụng tính năng theo dõi/yêu thích giải đấu &amp; đội bóng và cá nhân hóa trải nghiệm của mình.
        </p>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={onClose}
          >
            Hủy bỏ
          </button>
          <button 
            type="button" 
            className={styles.loginBtn} 
            onClick={handleLogin}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}
