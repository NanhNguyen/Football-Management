'use client';

import { useCallback } from 'react';
import { usePublicTournament } from '@/components/PublicTournamentContext';
import { layDanhSachDoi } from '@/lib/api';
import { useState, useEffect } from 'react';

export interface FollowedTeamObject {
  id: string;
  ten: string;
  logo?: string;
  vietTat?: string;
  giai_dau_id?: string;
}

interface UseFollowedTeamsReturn {
  followedTeamIds: string[];
  followedTeams: FollowedTeamObject[];
  isFollowed: (teamId: string) => boolean;
  follow: (teamId: string) => Promise<void>;
  unfollow: (teamId: string) => Promise<void>;
  toggleFollow: (teamId: string) => Promise<void>;
}

export function useFollowedTeams(): UseFollowedTeamsReturn {
  const { favoriteTeams, toggleFollowTeam } = usePublicTournament();
  const [allTeams, setAllTeams] = useState<FollowedTeamObject[]>([]);

  useEffect(() => {
    // Fetch team details only once and cache
    layDanhSachDoi().then((teams: any[]) => {
      setAllTeams(
        teams.map((t) => ({
          id: t.id,
          ten: t.ten,
          logo: t.logo,
          vietTat: t.vietTat,
          giai_dau_id: t.giai_dau_id,
        }))
      );
    });
  }, []);

  const isFollowed = useCallback(
    (teamId: string) => favoriteTeams.includes(teamId),
    [favoriteTeams]
  );

  const follow = useCallback(
    async (teamId: string) => {
      if (!favoriteTeams.includes(teamId)) {
        await toggleFollowTeam(teamId);
      }
    },
    [favoriteTeams, toggleFollowTeam]
  );

  const unfollow = useCallback(
    async (teamId: string) => {
      if (favoriteTeams.includes(teamId)) {
        await toggleFollowTeam(teamId);
      }
    },
    [favoriteTeams, toggleFollowTeam]
  );

  const toggleFollow = useCallback(
    async (teamId: string) => {
      await toggleFollowTeam(teamId);
    },
    [toggleFollowTeam]
  );

  const followedTeams = allTeams.filter((t) => favoriteTeams.includes(t.id));

  return {
    followedTeamIds: favoriteTeams,
    followedTeams,
    isFollowed,
    follow,
    unfollow,
    toggleFollow,
  };
}
