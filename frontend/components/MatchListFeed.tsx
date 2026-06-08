import { useRouter } from 'next/navigation';
import React from 'react';
import styles from './MatchListFeed.module.css';
import { calculateMatchMinute } from '@/lib/api';
import TeamLogo from './TeamLogo';
import { ShieldIcon } from './AppIcons';

interface MatchListFeedProps {
  data: any;
  onMatchClick: (match: any) => void;
  tournamentType?: 'league' | 'tournament';
}

export default function MatchListFeed({ data, onMatchClick, tournamentType = 'league' }: MatchListFeedProps) {
  const router = useRouter();

  if (!data) return null;

  // Combine all matches to display in the feed
  const allMatches = [
    ...(data.tranLive || []),
    ...(data.tranSapDienRa || []),
    ...(data.tranKetThuc || [])
  ];

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return 'Ngày chưa xác định';
    try {
      const dateObj = new Date(dateStr);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} Thg ${dateObj.getMonth() + 1}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr);
      return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    } catch (e) {
      return '';
    }
  };

  const isTournament = tournamentType === 'tournament';

  // Helper to extract round and group details
  const parseVongDetails = (vongStr: string = '') => {
    const str = vongStr.trim();
    const matchNew = str.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (matchNew) {
      return { bang: `Bảng ${matchNew[2]}`, vong: `Vòng ${matchNew[1]}`, isKnockout: false };
    }
    const matchOld = str.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i);
    if (matchOld) {
      return { bang: `Bảng ${matchOld[1]}`, vong: `Vòng ${matchOld[2]}`, isKnockout: false };
    }
    if (str.toLowerCase().includes('1/16')) {
      return { bang: '', vong: 'Vòng 1/16', isKnockout: true };
    }
    if (str.toLowerCase().includes('1/8')) {
      return { bang: '', vong: 'Vòng 1/8', isKnockout: true };
    }
    if (str.toLowerCase().includes('tứ kết')) {
      return { bang: '', vong: 'Tứ kết', isKnockout: true };
    }
    if (str.toLowerCase().includes('bán kết')) {
      return { bang: '', vong: 'Bán kết', isKnockout: true };
    }
    if (str.toLowerCase().includes('tranh hạng ba')) {
      return { bang: '', vong: 'Tranh hạng ba', isKnockout: true };
    }
    if (str.toLowerCase().includes('chung kết')) {
      return { bang: '', vong: 'Chung kết', isKnockout: true };
    }
    return { bang: '', vong: str, isKnockout: !str.toLowerCase().startsWith('vòng') };
  };

  const getRoundOrderPriority = (roundName: string): number => {
    const name = roundName.toLowerCase();
    if (name.includes('1/16')) return 200;
    if (name.includes('1/8')) return 300;
    if (name.includes('tứ kết')) return 400;
    if (name.includes('bán kết')) return 500;
    if (name.includes('chung kết') || name.includes('tranh hạng ba') || name.includes('hạng ba')) return 600;
    
    const match = name.match(/vòng\s+(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 9999;
  };

  // Helper to extract generic round key for tournaments
  const getGenericRoundKey = (roundName: string): string => {
    if (!roundName) return 'Vòng đấu khác';
    const parsed = parseVongDetails(roundName);
    if (!parsed.isKnockout && parsed.vong) {
      return parsed.vong;
    }
    if (parsed.vong === 'Chung kết' || parsed.vong === 'Tranh hạng ba') {
      return 'Chung kết & Tranh hạng ba';
    }
    return parsed.vong;
  };

  // Group matches: by round for tournament, or by date for league
  const groupedMatches = allMatches.reduce((acc: any, match: any) => {
    let groupName = 'Vòng đấu khác';
    if (isTournament) {
      const vongStr = match.vong || '';
      const parsed = parseVongDetails(vongStr);
      if (!parsed.isKnockout && parsed.bang && parsed.vong) {
        groupName = `${parsed.vong} - ${parsed.bang}`;
      } else {
        groupName = getGenericRoundKey(vongStr);
      }
    } else {
      groupName = getFormattedDate(match.date || match.batDauLuc);
    }

    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {});

  // Sort matches within each group: alphabetically by home team name for tournament, or chronologically for league
  Object.keys(groupedMatches).forEach((groupName) => {
    groupedMatches[groupName].sort((a: any, b: any) => {
      const isLiveA = a.trangThai === 'DANG_DIEN_RA' ? 1 : 0;
      const isLiveB = b.trangThai === 'DANG_DIEN_RA' ? 1 : 0;
      if (isLiveA !== isLiveB) return isLiveB - isLiveA;

      if (isTournament) {
        const nameA = a.doiNha?.ten || '';
        const nameB = b.doiNha?.ten || '';
        if (!nameA || !nameB) {
          return (a.vong || '').localeCompare(b.vong || '');
        }
        return nameA.localeCompare(nameB);
      } else {
        const dtA = `${a.date || ''} ${a.time || ''}`;
        const dtB = `${b.date || ''} ${b.time || ''}`;
        return dtA.localeCompare(dtB);
      }
    });
  });

  // Sort the groups: by knockout order for tournament, or by date for league
  const sortedGroupNames = Object.keys(groupedMatches).sort((groupA, groupB) => {
    if (isTournament) {
      const pA = getRoundOrderPriority(groupA);
      const pB = getRoundOrderPriority(groupB);
      if (pA !== pB) return pA - pB;
      return groupA.localeCompare(groupB);
    } else {
      const matchesA = groupedMatches[groupA];
      const matchesB = groupedMatches[groupB];
      const firstA = matchesA[0];
      const firstB = matchesB[0];
      
      const minDateA = new Date(firstA.batDauLuc || firstA.date || 0).getTime();
      const minDateB = new Date(firstB.batDauLuc || firstB.date || 0).getTime();
      return minDateA - minDateB;
    }
  });

  return (
    <div className={styles.feedContainer}>
      {sortedGroupNames.map((groupName) => (
        <div key={groupName} className={styles.matchGroup}>
          <div className={styles.groupHeader}>
            {groupName}
          </div>
          
          <div className={styles.groupContent}>
            {groupedMatches[groupName].map((match: any) => {
              const isLive = match.trangThai === 'DANG_DIEN_RA';
              const isUpcoming = match.trangThai === 'SAP_DIEN_RA';
              const isFinished = match.trangThai === 'KET_THUC';
              
              // Helper to get specific label for knockout match (e.g. "Trận 1", "Chung kết")
              const getKnockoutLabel = (vongStr: string): string => {
                if (!vongStr) return '';
                if (vongStr.includes(' - ')) {
                  return vongStr.split(' - ')[1];
                }
                return vongStr;
              };

              const isKnockout = isTournament && !match.vong?.match(/Bảng/i);
              const koLabel = isKnockout ? getKnockoutLabel(match.vong) : '';

              let matchStatus = '';
              if (isFinished) {
                matchStatus = 'FT';
                if (isTournament) {
                  const shortDate = getShortDate(match.date || match.batDauLuc);
                  const datePart = shortDate ? ` • ${shortDate}` : '';
                  matchStatus = koLabel ? `${koLabel} • FT${datePart}` : `FT${datePart}`;
                }
              } else if (isLive) {
                 if (match.dangTamDung) matchStatus = 'HT';
                 else matchStatus = `${calculateMatchMinute(match)}'`;
              } else if (isUpcoming) {
                 const timeStr = match.time ? match.time.substring(0, 5) : '--:--';
                 matchStatus = timeStr;
                 if (isTournament) {
                   const shortDate = getShortDate(match.date || match.batDauLuc);
                   const datePart = shortDate ? `${shortDate} • ` : '';
                   matchStatus = koLabel ? `${koLabel} • ${datePart}${timeStr}` : `${datePart}${timeStr}`;
                 }
              }

              return (
                <div 
                  key={match.id} 
                  className={styles.matchRow}
                  onClick={() => onMatchClick(match)}
                >
                  
                  {/* Team A */}
                  <div className={styles.teamA}>
                    <span className={styles.teamName}>{match.doiNha?.ten || 'TBD'}</span>
                    <span className={styles.teamLogo}><TeamLogo logo={match.doiNha?.logo} fallback={<ShieldIcon size={16} />} /></span>
                  </div>

                  {/* Score */}
                  <div className={styles.scoreCol}>
                    <div className={styles.scoreBox}>
                      {isUpcoming ? (
                        <span className={styles.scoreDash}>-</span>
                      ) : (
                        <span className={isLive ? styles.scoreLive : ''}>
                          {match.tyNha ?? 0} - {match.tyKhach ?? 0}
                        </span>
                      )}
                    </div>
                    <span className={`${styles.matchStatus} ${isLive ? styles.statusLive : ''}`}>
                      {matchStatus}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className={styles.teamB}>
                    <span className={styles.teamLogo}><TeamLogo logo={match.doiKhach?.logo} fallback={<ShieldIcon size={16} />} /></span>
                    <span className={styles.teamName}>{match.doiKhach?.ten || 'TBD'}</span>
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
