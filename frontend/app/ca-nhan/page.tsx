'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalSkeletonLoader from '@/components/GlobalSkeletonLoader';
import { SettingsIcon, LogoutIcon, LockIcon } from '@/components/AppIcons';
import styles from './ca-nhan.module.css';

export default function CaNhanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  const roleDisplayNames: Record<string, string> = {
    'admin': 'Ban Tổ Chức Giải Đấu',
    'ref': 'Trọng tài',
    'user': 'Người xem'
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', session.user.id)
            .single();
          const roleId = roleData?.role_id || 3;
          const roleMap: Record<number, string> = { 1: 'admin', 2: 'ref', 3: 'user' };
          setUserRole(roleMap[roleId] || 'user');
        } catch (err) {
          setUserRole('user');
        }
      } else {
        setUser(null);
        setUserRole('user');
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', session.user.id)
            .single();
          const roleId = roleData?.role_id || 3;
          const roleMap: Record<number, string> = { 1: 'admin', 2: 'ref', 3: 'user' };
          setUserRole(roleMap[roleId] || 'user');
        } catch (err) {
          setUserRole('user');
        }
      } else {
        setUser(null);
        setUserRole('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      return;
    }
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
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="User Avatar" 
                    className={styles.avatarImg}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user.user_metadata?.full_name 
                    ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
                    : (user.email ? user.email.substring(0, 2).toUpperCase() : 'US')
                )}
                <span className={styles.onlineBadge}></span>
              </div>
              <h2 className={styles.userName}>
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
              </h2>
              <p className={styles.userRole}>
                {roleDisplayNames[userRole] || 'Người xem'}
              </p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>

            {/* Actions list */}
            <div className={styles.actionsList}>
              {(userRole === 'admin' || userRole === 'ref') && (
                <Link href="/quan-tri" className={styles.actionBtn}>
                  <span className={styles.actionIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <SettingsIcon size={18} />
                  </span>
                  <div className={styles.actionText}>
                    <span className={styles.actionTitle}>Trang Quản trị</span>
                    <span className={styles.actionDesc}>Quản lý giải đấu, đội bóng, lịch thi đấu</span>
                  </div>
                  <span className={styles.actionArrow}>→</span>
                </Link>
              )}


              <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                <span className={styles.actionIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <LogoutIcon size={18} />
                </span>
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
            <div className={styles.lockIcon} style={{ display: 'flex', justifyContent: 'center' }}>
              <LockIcon size={48} />
            </div>
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
