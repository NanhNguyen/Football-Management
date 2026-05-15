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
      id, vong: 'Tứ kết', phut: 72, trangThai: 'DANG_DIEN_RA',
      doiNha: { ten: 'TK Warriors', logo: '⚔️' },
      doiKhach: { ten: 'Sale FC', logo: '🦅' },
      tyDoiNha: 3, tyDoiKhach: 1,
      suKien: [
        { id: 'sk-1', loai: 'BAN_THANG', phut: 12, moTa: 'Sút xa góc hẹp', cauThu: { ten: 'Nguyễn Văn A' }, doi: { ten: 'TK Warriors' } },
        { id: 'sk-3', loai: 'THE_VANG', phut: 32, moTa: 'Lỗi chiến thuật', cauThu: { ten: 'Phạm Đức D' }, doi: { ten: 'Sale FC' } },
        { id: 'sk-4', loai: 'BAN_THANG', phut: 41, moTa: 'Đánh đầu từ quả phạt góc', cauThu: { ten: 'Phạm Đức D' }, doi: { ten: 'Sale FC' } },
        { id: 'sk-6', loai: 'BAN_THANG', phut: 68, moTa: 'Phá bẫy việt vị ghi bàn', cauThu: { ten: 'Hồ Thiên Khôi' }, doi: { ten: 'TK Warriors' } },
      ],
    };
  }

  const eventIcons: Record<string, string> = {
    'BAN_THANG': '⚽',
    'THE_VANG': '🟨',
    'THE_DO': '🟥',
    'THAY_NGUOI': '🔄',
  };

  const eventLabels: Record<string, string> = {
    'BAN_THANG': 'Bàn thắng',
    'THE_VANG': 'Thẻ vàng',
    'THE_DO': 'Thẻ đỏ',
    'THAY_NGUOI': 'Thay người',
  };

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>← Quay lại Tổng quan</Link>

      {/* Match Header */}
      <div className={styles.matchHeader}>
        <div className={styles.matchInfo}>
          <span className={styles.vong}>{tran.vong}</span>
          {tran.trangThai === 'DANG_DIEN_RA' && (
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
              className={styles.timelineItem}
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
            { label: 'Sút trúng đích', home: '7', away: '3' },
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
