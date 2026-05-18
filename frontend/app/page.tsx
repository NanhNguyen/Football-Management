import styles from './page.module.css';
import { layTongQuan, layTopGhiBan } from '@/lib/api';
import Link from 'next/link';
import MatchCenterTabs from '@/components/MatchCenterTabs';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function TongQuanPage() {
  let data: any;
  let topScorers: any[] = [];

  try {
    const [tqData, tbData] = await Promise.all([layTongQuan(), layTopGhiBan()]);
    data = tqData;
    topScorers = tbData.slice(0, 3);
  } catch {
    data = null;
  }

  const spotlightMatch = data?.tranLive?.[0] || data?.tranSapDienRa?.[0];

  // Mocking Top 3 Siêu Chốt
  const topChot = [
    { ten: 'Phạm Minh Toàn', donVi: 'Khối Hội Sở', chot: 8, logo: '🏢' },
    { ten: 'Nguyễn Văn Đạt', donVi: 'Chi nhánh Cầu Giấy', chot: 6, logo: '🏙️' },
    { ten: 'Trần Quyết Thắng', donVi: 'Chi nhánh Nam Từ Liêm', chot: 5, logo: '🏘️' },
  ];

  return (
    <div className={styles.page}>
      {/* 1. Ticker / Alert Box */}
      <div className={styles.tickerWrapper}>
        <div className={styles.tickerContainer}>
          <span className={styles.tickerBadge}>TIN NÓNG</span>
          <div className={styles.marquee}>
            <p>🔥 Khối Hội Sở vừa có pha Siêu Chốt +2 điểm! 🔴 Đội Quản lý dự án đang bứt phá mạnh mẽ trên BXH! ⭐ Giải đấu bước vào giai đoạn nước rút!</p>
          </div>
        </div>
      </div>

      {/* 2. Hero Section: Spotlight Banner */}
      <section className={`${styles.hero} animate-fade-up`}>
        {spotlightMatch ? (
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightBg}></div>
            <div className={styles.spotlightHeader}>
              <span className={styles.spotlightBadge}>🏆 TRẬN CẦU TÂM ĐIỂM</span>
              {spotlightMatch.trangThai === 'DANG_DIEN_RA' && (
                <span className={styles.spotlightLive}>🔴 TRỰC TIẾP</span>
              )}
            </div>
            
            <div className={styles.spotlightContent}>
              <div className={styles.spotTeam}>
                <span className={styles.spotLogo}>{spotlightMatch.doiNha?.logo}</span>
                <span className={styles.spotName}>{spotlightMatch.doiNha?.ten}</span>
              </div>

              <div className={styles.spotScore}>
                {spotlightMatch.trangThai === 'SAP_DIEN_RA' ? (
                  <div className={styles.spotTimeBox}>
                    <div className={styles.spotTime}>{spotlightMatch.time || 'VS'}</div>
                    <div className={styles.spotDate}>{spotlightMatch.date || spotlightMatch.vong}</div>
                  </div>
                ) : (
                  <div className={styles.spotScoreBox}>
                    <span className={styles.spotNum}>{spotlightMatch.tyNha ?? 0}</span>
                    <span className={styles.spotDash}>-</span>
                    <span className={styles.spotNum}>{spotlightMatch.tyKhach ?? 0}</span>
                  </div>
                )}
                {spotlightMatch.trangThai === 'DANG_DIEN_RA' && <div className={styles.spotMinute}>{spotlightMatch.phut}&apos;</div>}
              </div>

              <div className={styles.spotTeam}>
                <span className={styles.spotLogo}>{spotlightMatch.doiKhach?.logo}</span>
                <span className={styles.spotName}>{spotlightMatch.doiKhach?.ten}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Tournament Command Center</h2>
            <p className={styles.heroSubtitle}>Chưa có trận đấu tâm điểm nào.</p>
          </div>
        )}
      </section>

      {/* 3. Khu Vực Trận Đấu (Match Center) */}
      <section className={`${styles.section} animate-fade-up stagger-2`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Trung Tâm Trận Đấu</h3>
          <Link href="/lich-dau" className={styles.viewAll}>Xem lịch đầy đủ →</Link>
        </div>
        <MatchCenterTabs 
          liveMatches={data?.tranLive || []} 
          upcomingMatches={data?.tranSapDienRa || []} 
          completedMatches={data?.tranKetThuc || []} 
        />
      </section>

      {/* 4. Khu Vực Bảng Vàng & Xếp Hạng */}
      <section className={`${styles.section} animate-fade-up stagger-3`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Bảng Vàng Danh Dự</h3>
        </div>
        
        <div className={styles.leaderboardGrid}>
          {/* Block 1: BXH Đội Bóng */}
          <div className={styles.lbCard}>
            <div className={styles.lbHeader}>
              <h4>Bảng Xếp Hạng Đội</h4>
              <Link href="/bang-xep-hang" className={styles.lbLink}>Chi tiết</Link>
            </div>
            <div className={styles.lbList}>
              {(data?.top3Doi || []).map((t: any, i: number) => (
                <div key={i} className={styles.lbTeamRow}>
                  <div className={styles.lbTeamRankBg}>{i + 1}</div>
                  <div className={styles.lbTeamInfo}>
                    <span className={styles.lbTeamRank}>{i === 0 ? '👑' : `#${i + 1}`}</span>
                    <span className={styles.lbTeamLogo}>{t.doi?.logo}</span>
                    <span className={styles.lbTeamName}>{t.doi?.ten}</span>
                  </div>
                  <div className={styles.lbTeamPts}>{t.diem}đ</div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Vua Phá Lưới */}
          <div className={styles.lbCard}>
            <div className={styles.lbHeader}>
              <h4>Vua Phá Lưới</h4>
              <Link href="/thong-ke" className={styles.lbLink}>Chi tiết</Link>
            </div>
            <div className={styles.lbList}>
              {topScorers.map((p, i) => (
                <div key={i} className={styles.lbPlayerRow}>
                  <div className={styles.lbPlayerAvatar}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.ten)}&background=random&color=fff`} alt={p.ten} />
                    <span className={styles.lbPlayerTeam}>{p.doi?.logo}</span>
                  </div>
                  <div className={styles.lbPlayerNameBox}>
                    <p className={styles.lbPlayerName}>{p.ten}</p>
                  </div>
                  <div className={styles.lbPlayerGoals}>
                    <span>{p.ban_thang}</span> 🥾
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 3: Vua Siêu Chốt */}
          <div className={`${styles.lbCard} ${styles.lbCardVip}`}>
            <div className={styles.lbVipGlow}></div>
            <div className={styles.lbHeaderVip}>
              <h4>VUA SIÊU CHỐT 🔥</h4>
            </div>
            <div className={styles.lbList}>
              {topChot.map((c, i) => (
                <div key={i} className={styles.lbChotRow}>
                  <div className={styles.lbChotAvatar}>
                    <span className={styles.lbChotRank}>{i + 1}</span>
                  </div>
                  <div className={styles.lbChotInfo}>
                    <p className={styles.lbChotName}>{c.ten}</p>
                    <p className={styles.lbChotDonVi}>{c.logo} {c.donVi}</p>
                  </div>
                  <div className={styles.lbChotScore}>
                    <span className={styles.lbChotNum}>{c.chot}</span> 🏠
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
