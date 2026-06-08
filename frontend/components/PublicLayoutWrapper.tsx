'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import PublicSidebar from './PublicSidebar';
import PublicTopbar from './PublicTopbar';
import PublicBottomNav from './PublicBottomNav';
import { PublicTournamentProvider } from './PublicTournamentContext';
import styles from './PublicLayoutWrapper.module.css';

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Exclude Admin dashboard and Login views from public sidebar layout
  const isExcluded = pathname.startsWith('/quan-tri') || pathname.startsWith('/login');

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <PublicTournamentProvider>
      <div className={styles.layoutContainer}>
        {/* Left Sidebar (Desktop) / Sidebar Drawer (Mobile) */}
        <PublicSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Main Content Area */}
        <div className={styles.mainArea}>
          {/* Streamlined Topbar */}
          <PublicTopbar onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Page Contents */}
          <main className={styles.contentBody}>
            {children}
          </main>
        </div>

        {/* Bottom Nav Bar for Mobile devices */}
        <PublicBottomNav />
      </div>
    </PublicTournamentProvider>
  );
}
