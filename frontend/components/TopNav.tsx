'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './TopNav.module.css';

const menuItems = [
  { label: 'Tổng quan', href: '/' },
  { label: 'Lịch đấu', href: '/lich-dau' },
  { label: 'BXH', href: '/bang-xep-hang' },
  { label: 'Knock-out', href: '/knock-out' },
  { label: 'Thống kê', href: '/thong-ke' },
];

export default function TopNav() {
  const pathname = usePathname();

  // Admin pages use their own layout
  if (pathname.startsWith('/quan-tri')) return null;

  return (
    <header className={styles.header}>
      {/* LEFT — Logo & Season */}
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚽</span>
          <div>
            <h1 className={styles.brandName}>THIÊN KHÔI</h1>
            <p className={styles.seasonName}>Championship 2024</p>
          </div>
        </div>
      </div>

      {/* CENTER — Menu */}
      <nav className={styles.centerNav}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* RIGHT — Profile & Actions */}
      <div className={styles.right}>
        <Link href="/quan-tri" className={styles.adminBtn}>
          Quản trị
        </Link>
        <button className={styles.iconBtn} title="Thông báo">
          <span className={styles.notifDot} />
          🔔
        </button>
        <div className={styles.avatar}>TK</div>
      </div>
    </header>
  );
}
