'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowedTeams, FollowedTeamObject } from '@/hooks/useFollowedTeams';
import { supabase } from '@/lib/supabase';
import styles from './FollowedTeamsList.module.css';

interface MatchStatus {
  teamId: string;
  type: 'live' | 'finished' | 'upcoming';
  /** For finished: score string like "2-1" */
  score?: string;
  /** For upcoming: formatted date string */
  dateLabel?: string;
}

function useTeamMatchStatuses(teamIds: string[]): Map<string, MatchStatus> {
  const [statuses, setStatuses] = useState<Map<string, MatchStatus>>(new Map());

  useEffect(() => {
    if (teamIds.length === 0) return;

    const fetchStatuses = async () => {
      try {
        const { data } = await supabase
          .from('tran_dau')
          .select('doi_nha_id, doi_khach_id, trang_thai, ban_thang_doi_nha, ban_thang_doi_khach, ngay, bat_dau_luc')
          .or(
            teamIds
              .map((id) => `doi_nha_id.eq.${id},doi_khach_id.eq.${id}`)
              .join(',')
          )
          .order('ngay', { ascending: false })
          .limit(200);

        if (!data) return;

        const now = new Date();
        const newMap = new Map<string, MatchStatus>();

        for (const teamId of teamIds) {
          const teamMatches = data.filter(
            (m: any) => m.doi_nha_id === teamId || m.doi_khach_id === teamId
          );

          // Priority: live > recently finished (24h) > upcoming
          const liveMatch = teamMatches.find((m: any) => m.trang_thai === 'DANG_DIEN_RA');
          if (liveMatch) {
            newMap.set(teamId, { teamId, type: 'live' });
            continue;
          }

          const recentlyFinished = teamMatches.find((m: any) => {
            if (m.trang_thai !== 'KET_THUC') return false;
            const matchDate = new Date(m.ngay || m.bat_dau_luc);
            return now.getTime() - matchDate.getTime() < 24 * 60 * 60 * 1000;
          });
          if (recentlyFinished) {
            const score = `${recentlyFinished.ban_thang_doi_nha ?? 0}-${recentlyFinished.ban_thang_doi_khach ?? 0}`;
            newMap.set(teamId, { teamId, type: 'finished', score });
            continue;
          }

          // Find next upcoming match
          const upcoming = teamMatches
            .filter((m: any) => m.trang_thai === 'SAP_DIEN_RA')
            .sort((a: any, b: any) => {
              const tA = new Date(a.ngay || a.bat_dau_luc).getTime();
              const tB = new Date(b.ngay || b.bat_dau_luc).getTime();
              return Math.abs(tA - now.getTime()) - Math.abs(tB - now.getTime());
            });

          if (upcoming.length > 0) {
            const matchDate = new Date(upcoming[0].ngay || upcoming[0].bat_dau_luc);
            const day = matchDate.toLocaleDateString('vi-VN', { weekday: 'short' });
            const date = matchDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
            newMap.set(teamId, { teamId, type: 'upcoming', dateLabel: `${day} ${date}` });
          }
        }

        setStatuses(newMap);
      } catch (err) {
        console.error('useTeamMatchStatuses error:', err);
      }
    };

    fetchStatuses();
  }, [JSON.stringify(teamIds)]);

  return statuses;
}

interface FollowedTeamsListProps {
  /** Mobile layout mode (wider padding, no sidebar constraints) */
  mobileMode?: boolean;
  onTeamClick?: (team: FollowedTeamObject) => void;
}

export default function FollowedTeamsList({ mobileMode = false, onTeamClick }: FollowedTeamsListProps) {
  const router = useRouter();
  const { followedTeams, unfollow } = useFollowedTeams();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const teamIds = followedTeams.map((t) => t.id);
  const statuses = useTeamMatchStatuses(teamIds);

  if (followedTeams.length === 0) return null;

  const handleTeamClick = (team: FollowedTeamObject) => {
    if (onTeamClick) {
      onTeamClick(team);
    } else {
      router.push(`/doi-bong/${team.id}`);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    await unfollow(teamId);
  };

  return (
    <div className={`${styles.list} ${mobileMode ? styles.listMobile : ''}`}>
      {followedTeams.map((team) => {
        const status = statuses.get(team.id);
        const isHovered = hoveredId === team.id;

        return (
          <div
            key={team.id}
            className={`${styles.item} ${mobileMode ? styles.itemMobile : ''}`}
            onClick={() => handleTeamClick(team)}
            onMouseEnter={() => setHoveredId(team.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Logo */}
            <div className={styles.logoWrap}>
              {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
                <img src={team.logo} alt={team.ten} className={styles.logo} />
              ) : (
                <span className={styles.logoPlaceholder}>⚽</span>
              )}
            </div>

            {/* Name */}
            <span className={styles.name}>{team.ten}</span>

            {/* Status indicator */}
            {!isHovered && status && (
              <div className={styles.status}>
                {status.type === 'live' && (
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    Live
                  </span>
                )}
                {status.type === 'finished' && (
                  <span className={styles.scoreBadge}>{status.score}</span>
                )}
                {status.type === 'upcoming' && (
                  <span className={styles.dateBadge}>{status.dateLabel}</span>
                )}
              </div>
            )}

            {/* Unfollow button (visible on hover) */}
            {isHovered && (
              <button
                className={styles.unfollowBtn}
                onClick={(e) => handleUnfollow(e, team.id)}
                title="Bỏ theo dõi"
                aria-label="Bỏ theo dõi"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
