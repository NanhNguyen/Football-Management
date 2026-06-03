import { useRouter } from 'next/navigation';
import React from 'react';
import styles from './MatchListFeed.module.css';
import { calculateMatchMinute } from '@/lib/api';
import { usePublicTournament } from './PublicTournamentContext';
import TeamLogo from './TeamLogo';

interface MatchListFeedProps {
  data: any;
  onMatchClick: (match: any) => void;
}

export default function MatchListFeed({ data, onMatchClick }: MatchListFeedProps) {
  const router = useRouter();
  const { favoriteTeams } = usePublicTournament();

  if (!data) return null;

  // Combine all matches to display in the feed
  const allMatches = [
    ...(data.tranLive || []),
    ...(data.tranSapDienRa || []),
    ...(data.tranKetThuc || [])
  ];

  // Group matches by 'giaiDauTen' and 'vong'
  const groupedMatches = allMatches.reduce((acc: any, match: any) => {
    const tourneyName = match.giaiDauTen || 'Giải đấu';
    const roundName = match.vong || 'Vòng đấu';
    const groupName = `${tourneyName} - ${roundName}`;
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {});

  // Sort matches within each group chronologically, prioritizing live matches
  Object.keys(groupedMatches).forEach((groupName) => {
    groupedMatches[groupName].sort((a: any, b: any) => {
      const isLiveA = a.trangThai === 'DANG_DIEN_RA' ? 1 : 0;
      const isLiveB = b.trangThai === 'DANG_DIEN_RA' ? 1 : 0;
      if (isLiveA !== isLiveB) return isLiveB - isLiveA;

      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });
  });

  // Sort the groups chronologically / numerically by tournament and round
  const sortedGroupNames = Object.keys(groupedMatches).sort((groupA, groupB) => {
    const matchesA = groupedMatches[groupA];
    const matchesB = groupedMatches[groupB];
    const firstA = matchesA[0];
    const firstB = matchesB[0];
    
    // 1. Sort by tournament name
    const tourneyA = firstA.giaiDauTen || '';
    const tourneyB = firstB.giaiDauTen || '';
    if (tourneyA !== tourneyB) {
      return tourneyA.localeCompare(tourneyB);
    }
    
    // 2. Sort by Round number (extract digit from 'vong')
    const roundStrA = String(firstA.vong || '');
    const roundStrB = String(firstB.vong || '');
    
    const numA = roundStrA.match(/\d+/);
    const numB = roundStrB.match(/\d+/);
    
    if (numA && numB) {
      const valA = parseInt(numA[0], 10);
      const valB = parseInt(numB[0], 10);
      if (valA !== valB) return valA - valB;
    } else if (numA) {
      return -1;
    } else if (numB) {
      return 1;
    }
    
    // Fallback: sort alphabetically by round name
    if (roundStrA !== roundStrB) {
      return roundStrA.localeCompare(roundStrB);
    }
    
    // 3. Fallback: sort by date/time of the earliest match in the group
    const minDateA = Math.min(...matchesA.map((m: any) => new Date(m.date || 0).getTime()));
    const minDateB = Math.min(...matchesB.map((m: any) => new Date(m.date || 0).getTime()));
    return minDateA - minDateB;
  });

  return (
    <div className={styles.feedContainer}>
      {sortedGroupNames.map((groupName) => (
        <div key={groupName} className={styles.matchGroup}>
          <div className={styles.groupHeader}>
            <span>🏆 {groupName}</span>
          </div>
          
          <div className={styles.groupContent}>
            {groupedMatches[groupName].map((match: any) => {
              const isLive = match.trangThai === 'DANG_DIEN_RA';
              const isUpcoming = match.trangThai === 'SAP_DIEN_RA';
              const isFinished = match.trangThai === 'KET_THUC';
              
              const isFavorite = (match.doiNha?.id && favoriteTeams.includes(match.doiNha.id)) || 
                                 (match.doiKhach?.id && favoriteTeams.includes(match.doiKhach.id));

              return (
                <div 
                  key={match.id} 
                  className={styles.matchRow}
                  onClick={() => onMatchClick(match)}
                >
                  {/* Cột trái (Tầm 15%): Trạng thái thời gian */}
                  <div className={styles.colTime}>
                    {isLive && (
                      <span className={`${styles.timeLive} ${match.dangTamDung ? styles.timeHalftime : ''}`}>
                        {match.dangTamDung ? 'Nghỉ giữa hiệp' : `${calculateMatchMinute(match)}'`}
                      </span>
                    )}
                    {isFinished && <span className={styles.timeFinished}>FT</span>}
                    {isUpcoming && <span className={styles.timeUpcoming}>{match.time || '--:--'}</span>}
                  </div>

                  {/* Cột giữa (Tầm 70%): Đội nhà & Đội khách với Ngăn chặn Event Bubbling */}
                  <div className={styles.colMain}>
                    {/* Dòng Đội Nhà */}
                    <div className={styles.teamRow}>
                      <div 
                        className={styles.teamInfoClickable}
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn Event Bubbling kích hoạt row click
                          if (match.doiNha?.id) {
                            router.push(`/doi-bong/${match.doiNha.id}`);
                          }
                        }}
                      >
                        <span className={styles.teamLogo} style={{ display: 'flex' }}><TeamLogo logo={match.doiNha?.logo} fallback="🛡️" /></span>
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
                      <div 
                        className={styles.teamInfoClickable}
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn Event Bubbling kích hoạt row click
                          if (match.doiKhach?.id) {
                            router.push(`/doi-bong/${match.doiKhach.id}`);
                          }
                        }}
                      >
                        <span className={styles.teamLogo} style={{ display: 'flex' }}><TeamLogo logo={match.doiKhach?.logo} fallback="🛡️" /></span>
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
                    }} style={isFavorite ? { color: '#d71920' } : {}}>
                      {isFavorite ? '★' : '☆'}
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
