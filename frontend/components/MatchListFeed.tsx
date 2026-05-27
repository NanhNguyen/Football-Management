import React from 'react';
import styles from './MatchListFeed.module.css';
import { calculateMatchMinute } from '@/lib/api';

interface MatchListFeedProps {
  data: any;
  onMatchClick: (match: any) => void;
}

export default function MatchListFeed({ data, onMatchClick }: MatchListFeedProps) {
  if (!data) return null;

  // Combine all matches to display in the feed
  // You might want to filter based on DateStrip selection later
  const allMatches = [
    ...(data.tranLive || []),
    ...(data.tranSapDienRa || []),
    ...(data.tranKetThuc || [])
  ];

  // Group matches by 'vong' (or giaiDau if available)
  const groupedMatches = allMatches.reduce((acc: any, match: any) => {
    const groupName = match.vong || 'Vòng đấu chưa xác định';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {});

  return (
    <div className={styles.feedContainer}>
      {Object.keys(groupedMatches).map((groupName) => (
        <div key={groupName} className={styles.matchGroup}>
          <div className={styles.groupHeader}>
            <span>🏆 {groupName}</span>
          </div>
          
          <div className={styles.groupContent}>
            {groupedMatches[groupName].map((match: any) => {
              const isLive = match.trangThai === 'DANG_DIEN_RA';
              const isUpcoming = match.trangThai === 'SAP_DIEN_RA';
              const isFinished = match.trangThai === 'KET_THUC';

              return (
                <div 
                  key={match.id} 
                  className={styles.matchRow}
                  onClick={() => onMatchClick(match)}
                >
                  {/* Cột trái (Tầm 15%): Trạng thái thời gian */}
                  <div className={styles.colTime}>
                    {isLive && (
                      <span className={styles.timeLive}>
                        {calculateMatchMinute(match)}&apos;
                      </span>
                    )}
                    {isFinished && <span className={styles.timeFinished}>FT</span>}
                    {isUpcoming && <span className={styles.timeUpcoming}>{match.time || '--:--'}</span>}
                  </div>

                  {/* Cột giữa (Tầm 70%): 2 dòng (Đội nhà & Đội khách) */}
                  <div className={styles.colMain}>
                    {/* Dòng Đội Nhà */}
                    <div className={styles.teamRow}>
                      <div className={styles.teamInfo}>
                        <span className={styles.teamLogo}>{match.doiNha?.logo || '🛡️'}</span>
                        <span className={styles.teamName}>{match.doiNha?.ten || 'Đang cập nhật'}</span>
                      </div>
                      <div className={styles.scoreBox}>
                        {isUpcoming ? (
                          <span className={styles.scoreDash}>-</span>
                        ) : (
                          <span className={`${styles.scoreText} ${isLive ? styles.scoreLive : ''}`}>
                            {match.tyNha ?? 0}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dòng Đội Khách */}
                    <div className={styles.teamRow}>
                      <div className={styles.teamInfo}>
                        <span className={styles.teamLogo}>{match.doiKhach?.logo || '🛡️'}</span>
                        <span className={styles.teamName}>{match.doiKhach?.ten || 'Đang cập nhật'}</span>
                      </div>
                      <div className={styles.scoreBox}>
                        {isUpcoming ? (
                          <span className={styles.scoreDash}>-</span>
                        ) : (
                          <span className={`${styles.scoreText} ${isLive ? styles.scoreLive : ''}`}>
                            {match.tyKhach ?? 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải (Tầm 15%): Icon Ngôi Sao */}
                  <div className={styles.colAction}>
                    <button className={styles.starBtn} onClick={(e) => {
                      e.stopPropagation();
                      // Toggle favorite logic here
                    }}>
                      ☆
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {Object.keys(groupedMatches).length === 0 && (
        <div className={styles.emptyState}>
          Chưa có trận đấu nào.
        </div>
      )}
    </div>
  );
}
