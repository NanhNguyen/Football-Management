'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { layDanhSachGiaiDau } from '@/lib/api';

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
}

const PublicTournamentContext = createContext<PublicTournamentContextType | undefined>(undefined);

export function PublicTournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync with localStorage as soon as possible on client side
  useEffect(() => {
    const savedId = localStorage.getItem('public_selected_tournament_id');
    if (savedId) {
      setSelectedTournamentIdState(savedId);
    }
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

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  return (
    <PublicTournamentContext.Provider
      value={{
        selectedTournamentId,
        selectedTournament,
        tournaments,
        setSelectedTournamentId,
        loading
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
