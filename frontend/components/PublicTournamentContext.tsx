'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { layDanhSachGiaiDau, layDanhSachTranDau } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface Tournament {
  id: string;
  ten: string;
  mua_giai: string;
  ngay_bat_dau: string;
}

interface PublicTournamentContextType {
  selectedTournamentId: string | null;
  selectedTournament: Tournament | null;
  tournaments: Tournament[];
  setSelectedTournamentId: (id: string) => void;
  loading: boolean;
  
  // Global Favorite / Followed Teams State
  favoriteTeams: string[];
  toggleFollowTeam: (teamId: string) => Promise<void>;

  // Global Followed Tournaments State
  followedTournaments: string[];
  toggleFollowTournament: (id: string) => void;

  // Mobile Bottom Sheet state for tournaments list
  tournamentsSheetOpen: boolean;
  setTournamentsSheetOpen: (open: boolean) => void;
}

const PublicTournamentContext = createContext<PublicTournamentContextType | undefined>(undefined);

export function PublicTournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tournamentsSheetOpen, setTournamentsSheetOpen] = useState(false);
  
  // Follow State
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [followedTournaments, setFollowedTournaments] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);

  // Sync Supabase Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync favorites and followed tournaments on load
  useEffect(() => {
    const syncFollowed = () => {
      const savedTeamsStr = localStorage.getItem('followedTeams');
      const teamsList = savedTeamsStr ? JSON.parse(savedTeamsStr) : [];
      setFavoriteTeams(teamsList);

      const savedTourneysStr = localStorage.getItem('followedTournaments');
      const tourneysList = savedTourneysStr ? JSON.parse(savedTourneysStr) : [];
      setFollowedTournaments(tourneysList);
    };

    syncFollowed();

    // Listen to follow updates across tabs or custom actions
    window.addEventListener('storage', syncFollowed);
    window.addEventListener('follow-update', syncFollowed);
    return () => {
      window.removeEventListener('storage', syncFollowed);
      window.removeEventListener('follow-update', syncFollowed);
    };
  }, []);

  // Fetch initial list of tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const list = await layDanhSachGiaiDau();
        setTournaments(list);
        
        // Fetch all matches to find the closest one to today
        const allMatches = await layDanhSachTranDau();
        let defaultId = null;

        if (allMatches && allMatches.length > 0) {
          const now = new Date().getTime();
          
          // Filter upcoming matches (DANG_DIEN_RA or SAP_DIEN_RA)
          const upcoming = allMatches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
          if (upcoming.length > 0) {
            // Sort by time difference to now ascending
            upcoming.sort((a: any, b: any) => {
              const tA = new Date(a.date || a.batDauLuc).getTime();
              const tB = new Date(b.date || b.batDauLuc).getTime();
              return Math.abs(tA - now) - Math.abs(tB - now);
            });
            // Get the tournament of the closest upcoming match
            const matchTourneyId = upcoming[0].giaiDauId || list.find((t: any) => t.ten === upcoming[0].giaiDauTen)?.id;
            if (matchTourneyId && list.some((t: Tournament) => t.id === matchTourneyId)) {
              defaultId = matchTourneyId;
            }
          }

          if (!defaultId) {
            // Fallback to finished matches
            const finished = allMatches.filter((m: any) => m.trangThai === 'KET_THUC');
            if (finished.length > 0) {
              finished.sort((a: any, b: any) => {
                const tA = new Date(a.date || a.batDauLuc).getTime();
                const tB = new Date(b.date || b.batDauLuc).getTime();
                return Math.abs(tA - now) - Math.abs(tB - now);
              });
              const matchTourneyId = finished[0].giaiDauId || list.find((t: any) => t.ten === finished[0].giaiDauTen)?.id;
              if (matchTourneyId && list.some((t: Tournament) => t.id === matchTourneyId)) {
                defaultId = matchTourneyId;
              }
            }
          }
        }

        // Find default selection
        const savedId = localStorage.getItem('public_selected_tournament_id');
        if (savedId && list.some((t: Tournament) => t.id === savedId)) {
          // If we have a saved ID, we can use it, but if that tournament has no matches, we override it
          const tournamentMatches = allMatches.filter((m: any) => m.giaiDauId === savedId);
          if (tournamentMatches.length > 0) {
            setSelectedTournamentIdState(savedId);
          } else if (defaultId) {
            setSelectedTournamentIdState(defaultId);
            localStorage.setItem('public_selected_tournament_id', defaultId);
          } else {
            setSelectedTournamentIdState(savedId);
          }
        } else {
          const finalId = defaultId || (list.find((t: Tournament) => t.ten.includes('Thiên Khôi'))?.id) || list[0]?.id;
          if (finalId) {
            setSelectedTournamentIdState(finalId);
            localStorage.setItem('public_selected_tournament_id', finalId);
          }
        }
      } catch (error) {
        console.error('Lỗi lấy danh sách giải đấu cho Public View:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const setSelectedTournamentId = (id: string) => {
    setSelectedTournamentIdState(id);
    localStorage.setItem('public_selected_tournament_id', id);
  };

  // Toggle favorite team with localStorage sync and optional backend sync if authenticated
  const toggleFollowTeam = async (teamId: string) => {
    let nextFavorites: string[] = [];
    
    setFavoriteTeams((prev) => {
      const updated = prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId];
      nextFavorites = updated;
      localStorage.setItem('followedTeams', JSON.stringify(updated));
      return updated;
    });

    // Notify other components of updates instantly
    window.dispatchEvent(new Event('follow-update'));

    // Sync to DB if logged in
    if (session?.user) {
      try {
        await fetch('http://localhost:3001/api/public/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ favorite_teams: nextFavorites })
        });
      } catch (err) {
        console.error('Lỗi đồng bộ danh sách đội bóng quan tâm lên server:', err);
      }
    }
  };

  const toggleFollowTournament = (id: string) => {
    setFollowedTournaments((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem('followedTournaments', JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('follow-update'));
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  return (
    <PublicTournamentContext.Provider
      value={{
        selectedTournamentId,
        selectedTournament,
        tournaments,
        setSelectedTournamentId,
        loading,
        favoriteTeams,
        toggleFollowTeam,
        followedTournaments,
        toggleFollowTournament,
        tournamentsSheetOpen,
        setTournamentsSheetOpen
      }}
    >
      {children}
    </PublicTournamentContext.Provider>
  );
}

export function usePublicTournament() {
  const context = useContext(PublicTournamentContext);
  if (!context) {
    throw new Error('usePublicTournament must be used within a PublicTournamentProvider');
  }
  return context;
}
