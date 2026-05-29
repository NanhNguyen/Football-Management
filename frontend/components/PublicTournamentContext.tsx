'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { layDanhSachGiaiDau } from '@/lib/api';
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
}

const PublicTournamentContext = createContext<PublicTournamentContextType | undefined>(undefined);

export function PublicTournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Follow State
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
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

  // Sync favorites on load
  useEffect(() => {
    const syncFollowed = () => {
      const savedTeamsStr = localStorage.getItem('followedTeams');
      const teamsList = savedTeamsStr ? JSON.parse(savedTeamsStr) : [];
      setFavoriteTeams(teamsList);
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
        
        // Find default selection
        const savedId = localStorage.getItem('public_selected_tournament_id');
        if (savedId && list.some((t: Tournament) => t.id === savedId)) {
          setSelectedTournamentIdState(savedId);
        } else if (list.length > 0) {
          // Default to first tournament (or Thiên Khôi Cúp if exists)
          const thienKhoi = list.find((t: Tournament) => t.ten.includes('Thiên Khôi'));
          const defaultId = thienKhoi ? thienKhoi.id : list[0].id;
          setSelectedTournamentIdState(defaultId);
          localStorage.setItem('public_selected_tournament_id', defaultId);
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
        toggleFollowTeam
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
