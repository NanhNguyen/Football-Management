'use client';

import { useState, useEffect, useRef } from 'react';
import { layDanhSachDoi, layDanhSachGiaiDau } from '@/lib/api';

export interface TeamSearchResult {
  id: string;
  ten: string;
  logo?: string;
  vietTat?: string;
  giai_dau_id?: string;
  giaiDauTen?: string;
}

interface UseTeamSearchReturn {
  results: TeamSearchResult[];
  isLoading: boolean;
  error: string | null;
}

// Cache all teams globally to avoid re-fetching
let allTeamsCache: TeamSearchResult[] | null = null;
let cacheFetchPromise: Promise<TeamSearchResult[]> | null = null;

async function getAllTeams(): Promise<TeamSearchResult[]> {
  if (allTeamsCache) return allTeamsCache;
  if (cacheFetchPromise) return cacheFetchPromise;

  cacheFetchPromise = Promise.all([
    layDanhSachDoi(),
    layDanhSachGiaiDau()
  ]).then(([teams, tournaments]) => {
    const tournamentMap = new Map(tournaments.map((t: any) => [t.id, t.ten]));
    
    const result = teams.map((t: any) => ({
      id: t.id,
      ten: t.ten,
      logo: t.logo,
      vietTat: t.vietTat,
      giai_dau_id: t.giai_dau_id,
      giaiDauTen: t.giai_dau_id ? tournamentMap.get(t.giai_dau_id) || 'Khác' : 'Khác',
    }));
    
    // Sort by tournament name then team name
    result.sort((a: any, b: any) => {
      const tA = a.giaiDauTen || '';
      const tB = b.giaiDauTen || '';
      if (tA !== tB) return tA.localeCompare(tB);
      return a.ten.localeCompare(b.ten);
    });

    allTeamsCache = result;
    cacheFetchPromise = null;
    return result;
  });

  return cacheFetchPromise;
}

export function useTeamSearch(query: string): UseTeamSearchReturn {
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If query is empty, show all teams (popular)
    if (query.trim().length === 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setIsLoading(true);
      setError(null);
      
      getAllTeams().then(teams => {
        setResults(teams);
        setIsLoading(false);
      }).catch(err => {
        console.error('useTeamSearch error:', err);
        setError('Không thể lấy danh sách đội.');
        setResults([]);
        setIsLoading(false);
      });
      return;
    }

    // Only search if length >= 2
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const teams = await getAllTeams();
        const q = query.trim().toLowerCase();
        const filtered = teams.filter(
          (t) =>
            t.ten.toLowerCase().includes(q) ||
            (t.vietTat && t.vietTat.toLowerCase().includes(q))
        );
        setResults(filtered);
      } catch (err) {
        console.error('useTeamSearch error:', err);
        setError('Không thể tìm kiếm. Thử lại sau.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  return { results, isLoading, error };
}

/** Call this to invalidate the team cache (e.g. after adding a team) */
export function invalidateTeamCache() {
  allTeamsCache = null;
  cacheFetchPromise = null;
}
