import styles from './page.module.css';
import { layChiTietTranDau } from '@/lib/api';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default async function ChiTietTranDauPage({ params }: Props) {
  const { id } = params;
  let tran: any;

  try {
    tran = await layChiTietTranDau(id);
  } catch {
    tran = null;
  }

  // Fallback data
  if (!tran || tran.error) {
    tran = {
      id, vong: 'Vòng 5', phut: 72, trangThai: 'LIVE',
      doiNha: { ten: 'TK Warriors', logo: '⚔️' },
      doiKhach: { ten: 'Sale FC', logo: '🦅' },
      tyDoiNha: 3, tyDoiKhach: 1,
      giaoDichDoiNha: 5, giaoDichDoiKhach: 2,
      suKien: [
        { id: 'sk-1', loai: 'BAN_THANG', phut: 12, moTa: 'Sút xa góc hẹp', cauThu: { ten: 'Nguyễn Văn A' }, doi: { ten: 'TK Warriors' } },
        { id: 'sk-2', loai: 'GIAO_DICH', phut: 25, moTa: 'Chốt căn hộ A102 thành công', cauThu: { ten: 'Hồ Thiên Khôi' }, doi: { ten: 'TK Warriors' }, giaTriGiaoDich: 2500000000 },
        { id: 'sk-3', loai: 'THE_VANG', phut: 32, moTa: 'Lỗi chiến thuật', cauThu: { ten: 'Phạm Đức D' }, doi: { ten: 'Sale FC' } },
        { id: 'sk-4', loai: 'BAN_THANG', phut: 41, moTa: 'Đánh đầu từ quả phạt góc', cauThu: { ten: 'Phạm Đức D' }, doi: { ten: 'Sale FC' } },
        { id: 'sk-5', loai: 'GIAO_DICH', phut: 55, moTa: 'Chốt giao dịch VIP căn Penthouse', cauThu: { ten: 'Trần Minh B' }, doi: { ten: 'TK Warriors' }, giaTriGiaoDich: 8000000000 },
        { id: 'sk-6', loai: 'BAN_THANG', phut: 68, moTa: 'Phá bẫy việt vị ghi bàn', cauThu: { ten: 'Hồ Thiên Khôi' }, doi: { ten: 'TK Warriors' } },
      ],
    };
  }

  const eventIcons: Record<string, string> = {
    'BAN_THANG': '⚽',
    'GIAO_DICH': '🏠',
    'THE_VANG': '🟨',
    'THE_DO': '🟥',
  };

  const eventLabels: Record<string, string> = {
    'BAN_THANG': 'Bàn thắng',
    'GIAO_DICH': 'Giao dịch chốt nhà',
    'THE_VANG': 'Thẻ vàng',
    'THE_DO': 'Thẻ đỏ',
  };

  const formatVND = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} triệu`;
    return n.toLocaleString('vi-VN');
  };

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>← Quay lại Tổng quan</Link>

      {/* Match Header */}
      <div className={styles.matchHeader}>
        <div className={styles.matchInfo}>
          <span className={styles.vong}>{tran.vong}</span>
          {tran.trangThai === 'LIVE' && (
            <span className={styles.liveBadge}>
              <span className={styles.livePulse} />
              LIVE · {tran.phut}&apos;
            </span>
          )}
        </div>

        <div className={styles.scoreboard}>
          <div className={styles.team}>
            <span className={styles.teamLogo}>{tran.doiNha?.logo}</span>
            <h3 className={styles.teamName}>{tran.doiNha?.ten}</h3>
            <p className={styles.teamDeals}>{tran.giaoDichDoiNha} giao dịch</p>
          </div>

          <div className={styles.scoreCenter}>
            <div className={styles.score}>
              <span className={styles.scoreNum}>{tran.tyDoiNha}</span>
              <span className={styles.scoreSep}>—</span>
              <span className={styles.scoreNum}>{tran.tyDoiKhach}</span>
            </div>
          </div>

          <div className={styles.team}>
            <span className={styles.teamLogo}>{tran.doiKhach?.logo}</span>
            <h3 className={styles.teamName}>{tran.doiKhach?.ten}</h3>
            <p className={styles.teamDeals}>{tran.giaoDichDoiKhach} giao dịch</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timelineSection}>
        <h3 className={styles.sectionTitle}>Diễn biến trận đấu</h3>
        <div className={styles.timeline}>
          {tran.suKien.map((sk: any) => (
            <div
              key={sk.id}
              className={`${styles.timelineItem} ${sk.loai === 'GIAO_DICH' ? styles.timelineItemDeal : ''}`}
            >
              <div className={styles.timelineDot}>
                <span className={styles.timelineIcon}>{eventIcons[sk.loai]}</span>
                <span className={styles.timelineMinute}>{sk.phut}&apos;</span>
              </div>
              <div className={styles.timelineContent}>
                <span className={styles.timelineLabel}>{eventLabels[sk.loai]}</span>
                <p className={styles.timelineDesc}>
                  <strong>{sk.cauThu?.ten}</strong> ({sk.doi?.ten}) — {sk.moTa}
                </p>
                {sk.giaTriGiaoDich && (
                  <span className={styles.dealValue}>💰 {formatVND(sk.giaTriGiaoDich)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Thống kê trận đấu</h3>
        <div className={styles.statsGrid}>
          {[
            { label: 'Kiểm soát bóng', home: '62%', away: '38%' },
            { label: 'Số cú sút', home: '12', away: '6' },
            { label: 'Hiệu suất giao dịch', home: '85%', away: '67%' },
            { label: 'Lỗi', home: '7', away: '11' },
          ].map((stat, i) => (
            <div key={i} className={styles.statRow}>
              <span className={styles.statHome}>{stat.home}</span>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statAway}>{stat.away}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
