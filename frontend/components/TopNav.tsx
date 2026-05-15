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
          <img src="/logo.svg" alt="TKSCORE Logo" style={{ width: '40px', height: '40px' }} />
          <div>
            <h1 className={styles.brandName}>TKSCORE</h1>
            <p className={styles.seasonName}>Cúp Siêu Chốt</p>
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
