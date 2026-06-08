'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './SearchOverlay.module.css';
import { layDanhSachDoi, layDanhSachGiaiDau, layDanhSachTranDau } from '@/lib/api';
import { 
  TrophyIcon, 
  SoccerBallIcon, 
  FlameIcon, 
  LiveDotIcon, 
  BlueDotIcon 
} from './AppIcons';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
}

export default function SearchOverlay({ isOpen, onClose, searchQuery }: SearchOverlayProps) {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [tData, trData, mData] = await Promise.all([
            layDanhSachDoi(),
            layDanhSachGiaiDau(),
            layDanhSachTranDau()
          ]);
          setTeams(tData || []);
          setTournaments(trData || []);
          setMatches(mData || []);
        } catch (error) {
          console.error("Error fetching search data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const query = searchQuery.trim().toLowerCase();
  
  // Filter Data
  const filteredTeams = query ? teams.filter(t => t.ten?.toLowerCase().includes(query) || t.vietTat?.toLowerCase().includes(query)) : [];
  const filteredTournaments = query ? tournaments.filter(t => t.ten?.toLowerCase().includes(query)) : [];
  const filteredMatches = query ? matches.filter(m => {
    const nha = m.doi_nha?.ten?.toLowerCase() || '';
    const khach = m.doi_khach?.ten?.toLowerCase() || '';
    return nha.includes(query) || khach.includes(query);
  }) : [];

  const handleResultClick = () => {
    onClose();
  };

  return (
    <>
      <div className={styles.overlayBackdrop} onClick={onClose} />
      
      <div className={styles.searchPanel}>
        {query === '' ? (
          // EMPTY STATE
          <>
            <div className={styles.panelHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FlameIcon size={16} />
              <span>GỢI Ý TÌM KIẾM</span>
            </div>
            <div className={styles.panelContent}>
              <Link href="/doi-bong/arsenal-id" className={styles.resultItem} onClick={handleResultClick}>
                <div className={styles.itemLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LiveDotIcon size={12} />
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>Arsenal</div>
                </div>
              </Link>
              <Link href="/doi-bong/mc-id" className={styles.resultItem} onClick={handleResultClick}>
                <div className={styles.itemLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BlueDotIcon size={12} />
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>Manchester City</div>
                </div>
              </Link>
              <div className={styles.resultItem} onClick={handleResultClick} style={{ cursor: 'pointer' }}>
                <div className={styles.itemLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrophyIcon size={16} />
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>English Premier League</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // TYPING STATE
          <div className={styles.panelContent}>
            {isLoading ? (
              <div className={styles.emptyState}>Đang tìm kiếm...</div>
            ) : (
              <>
                {filteredTournaments.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Giải Đấu</div>
                    {filteredTournaments.slice(0, 3).map(t => (
                      <div key={t.id} className={styles.resultItem} onClick={handleResultClick} style={{ cursor: 'pointer' }}>
                        <div className={styles.itemLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrophyIcon size={16} />
                        </div>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitle}>{t.ten}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredTeams.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Đội Bóng</div>
                    {filteredTeams.slice(0, 5).map(t => (
                      <Link key={t.id} href={`/doi-bong/${t.id}`} className={styles.resultItem} onClick={handleResultClick}>
                        <div className={styles.itemLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {t.logo && (t.logo.startsWith('http') || t.logo.startsWith('/')) ? (
                            <img src={t.logo} alt={t.ten} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                          ) : (
                            <SoccerBallIcon size={16} />
                          )}
                        </div>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitle}>{t.ten}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {filteredMatches.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Trận Đấu</div>
                    {filteredMatches.slice(0, 5).map(m => (
                      <div key={m.id} className={styles.resultItem} onClick={handleResultClick} style={{ cursor: 'pointer' }}>
                        <div className={styles.itemInfo}>
                          <div className={styles.matchTournamentContext} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrophyIcon size={12} />
                            <span>{m.giai_dau?.ten || 'Giao Hữu'}</span>
                          </div>
                          <div className={styles.matchTitle}>
                            {m.doi_nha?.ten || 'Đội nhà'} vs {m.doi_khach?.ten || 'Đội khách'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredTournaments.length === 0 && filteredTeams.length === 0 && filteredMatches.length === 0 && (
                  <div className={styles.emptyState}>
                    Không tìm thấy kết quả nào cho &quot;{query}&quot;
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
