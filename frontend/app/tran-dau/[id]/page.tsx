import styles from './page.module.css';
import { layChiTietTranDau, calculateMatchMinute } from '@/lib/api';
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
  if (!tran) {
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
    'GOAL_NORMAL': '⚽',
    'GOAL_PEN': '⚽',
    'GOAL_OG': '⚽',
    'THE_VANG': '🟨',
    'THE_DO': '🟥',
    'THAY_NGUOI': '🔄',
    'CHOT': '⚡',
    'MOTM': '🏅',
    'CARD': '🟨',
  };

  const eventLabels: Record<string, string> = {
    'BAN_THANG': 'Bàn thắng',
    'GOAL_NORMAL': 'Bàn thắng',
    'GOAL_PEN': 'Penalty',
    'GOAL_OG': 'Phản lưới nhà',
    'THE_VANG': 'Thẻ vàng',
    'THE_DO': 'Thẻ đỏ',
    'THAY_NGUOI': 'Thay người',
    'CHOT': 'Siêu Chốt (+2)',
    'MOTM': 'Xuất sắc nhất',
    'CARD': 'Án phạt',
  };

  const tyDoiNha = tran.tyDoiNha ?? tran.tyNha ?? 0;
  const tyDoiKhach = tran.tyDoiKhach ?? tran.tyKhach ?? 0;

  return (
    <div className={`${styles.page} animate-fade-in`}>
      <Link href="/lich-dau" className={styles.backLink}>← Quay lại Lịch thi đấu</Link>

      {/* Match Header */}
      <div className={`${styles.matchHeader} animate-fade-up`}>
        <div className={styles.matchInfo}>
          <span className={styles.vong}>{tran.vong}</span>
          {tran.trangThai === 'DANG_DIEN_RA' && (
            <span className={styles.liveBadge}>
              <span className={styles.livePulse} />
              {tran.dangTamDung ? 'TẠM DỪNG' : 'LIVE'} · {calculateMatchMinute(tran)}&apos;
            </span>
          )}
          {tran.trangThai === 'KET_THUC' && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
              Đã kết thúc
            </span>
          )}
          {tran.date && <span style={{ fontSize: '13px', color: '#94a3b8' }}>{tran.date} {tran.time}</span>}
          {tran.san && <span style={{ fontSize: '13px', color: '#94a3b8' }}>📍 {tran.san}</span>}
        </div>

        <div className={styles.scoreboard}>
          <div className={styles.team}>
            <span className={styles.teamLogo}>{tran.doiNha?.logo}</span>
            <h3 className={styles.teamName}>{tran.doiNha?.ten}</h3>
          </div>

          <div className={styles.scoreCenter}>
            <div className={styles.score}>
              <span className={styles.scoreNum}>{tyDoiNha}</span>
              <span className={styles.scoreSep}>—</span>
              <span className={styles.scoreNum}>{tyDoiKhach}</span>
            </div>
          </div>

          <div className={styles.team}>
            <span className={styles.teamLogo}>{tran.doiKhach?.logo}</span>
            <h3 className={styles.teamName}>{tran.doiKhach?.ten}</h3>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={`${styles.timelineSection} animate-fade-up stagger-2`}>
        <h3 className={styles.sectionTitle}>Diễn biến trận đấu</h3>
        {tran.suKien.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
            Chưa có sự kiện nào được ghi nhận
          </p>
        ) : (
          <div className={styles.timeline}>
            {tran.suKien.map((sk: any) => (
              <div key={sk.id} className={styles.timelineItem}>
                <div className={styles.timelineDot}>
                  <span className={styles.timelineIcon}>{eventIcons[sk.loai] ?? '📌'}</span>
                  <span className={styles.timelineMinute}>{sk.phut}&apos;</span>
                </div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>{eventLabels[sk.loai] ?? sk.loai}</span>
                  <p className={styles.timelineDesc}>
                    <strong>{sk.cauThu?.ten ?? 'Không rõ'}</strong>
                    {sk.doi?.ten && ` (${sk.doi.ten})`}
                    {sk.moTa && ` — ${sk.moTa}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={`${styles.statsSection} animate-fade-up stagger-3`}>
        <h3 className={styles.sectionTitle}>Thống kê trận đấu</h3>
        <div className={styles.statsGrid}>
          {[
            { label: 'Bàn thắng', home: tyDoiNha, away: tyDoiKhach },
            { label: 'Sự kiện', home: tran.suKien.filter((e: any) => e.doi?.ten === tran.doiNha?.ten).length, away: tran.suKien.filter((e: any) => e.doi?.ten === tran.doiKhach?.ten).length },
            { label: 'Thẻ phạt', home: tran.suKien.filter((e: any) => (e.loai === 'THE_VANG' || e.loai === 'CARD') && e.doi?.ten === tran.doiNha?.ten).length, away: tran.suKien.filter((e: any) => (e.loai === 'THE_VANG' || e.loai === 'CARD') && e.doi?.ten === tran.doiKhach?.ten).length },
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
