'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import styles from './ca-nhan.module.css';

export default function CaNhanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <GlobalSkeletonLoader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {user ? (
          <>
            {/* User Profile Info */}
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
                <span className={styles.onlineBadge}></span>
              </div>
              <h2 className={styles.userName}>Nguyễn Nam Anh</h2>
              <p className={styles.userRole}>Ban Tổ Chức Giải Đấu</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>

            {/* Actions list */}
            <div className={styles.actionsList}>
              <Link href="/quan-tri" className={styles.actionBtn}>
                <span className={styles.actionIcon}>⚙️</span>
                <div className={styles.actionText}>
                  <span className={styles.actionTitle}>Trang Quản trị</span>
                  <span className={styles.actionDesc}>Quản lý giải đấu, đội bóng, lịch thi đấu</span>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>

              <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                <span className={styles.actionIcon}>🚪</span>
                <div className={styles.actionText}>
                  <span className={styles.actionTitle}>Đăng xuất</span>
                  <span className={styles.actionDesc}>Thoát khỏi phiên làm việc hiện tại</span>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.loginRequired}>
            <div className={styles.lockIcon}>🔒</div>
            <h2 className={styles.loginTitle}>Yêu cầu đăng nhập</h2>
            <p className={styles.loginDesc}>Vui lòng đăng nhập với tài khoản Ban tổ chức để truy cập chức năng này.</p>
            <Link href="/login" className={styles.loginBtn}>
              Đăng nhập BTC
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
