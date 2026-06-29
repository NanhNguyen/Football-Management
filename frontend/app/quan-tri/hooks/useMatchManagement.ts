'use client';

import { useState } from 'react';
import { createMatch, updateMatch, deleteMatch } from '@/lib/api';

export function useMatchManagement(
  liveMatches: any[],
  setLiveMatches: (fn: (prev: any[]) => any[]) => void,
  selectedTournament: any,
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void
) {
  const [selectedMatchId, setSelectedMatchIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminSelectedMatchId') || null;
    }
    return null;
  });
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK'
  });
  const [searchTermList, setSearchTermList] = useState('');

  const setSelectedMatchId = (id: string | null) => {
    setSelectedMatchIdState(id);
  };

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);
  const filteredMatches = liveMatches.filter(m =>
    m.doiNha?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) ||
    m.doiKhach?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) ||
    m.vong?.toLowerCase().includes(searchTermList.toLowerCase())
  );

  const handleEditMatch = (match: any) => setEditingMatch({ ...match });

  const handleSaveMatch = async () => {
    const { error } = await updateMatch(editingMatch);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setEditingMatch(null);
      showToast('Đã cập nhật lịch thi đấu!');
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatchData.doiNhaId || !newMatchData.doiKhachId) {
      showToast('Vui lòng chọn hai đội thi đấu!');
      return;
    }
    if (newMatchData.doiNhaId === newMatchData.doiKhachId) {
      showToast('Hai đội không được trùng nhau!');
      return;
    }
    const { error } = await createMatch({ ...newMatchData, giaiDauId: selectedTournament?.id });
    if (!error) {
      await fetchData(selectedTournament?.id);
      setIsAddingMatch(false);
      setNewMatchData({ doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK' });
      showToast('Đã tạo trận đấu mới thành công!');
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    showConfirm('XÓA TRẬN ĐẤU', 'Bạn có chắc chắn muốn xóa trận đấu này?', async () => {
      const { error } = await deleteMatch(matchId);
      if (!error) {
        await fetchData(selectedTournament?.id);
        showToast('Đã xóa trận đấu!');
      }
    });
  };

  const handleInlineUpdateMatch = async (id: string, field: string, value: string) => {
    try {
      const matchToUpdate = liveMatches.find(m => m.id === id);
      if (!matchToUpdate) return;

      let updatePayload: any = {};
      if (field === 'ngay') updatePayload.date = value;
      else if (field === 'gio') updatePayload.time = value;
      else if (field === 'san') updatePayload.san = value;
      else if (field === 'tyNha') updatePayload.tyNha = parseInt(value, 10) || 0;
      else if (field === 'tyKhach') updatePayload.tyKhach = parseInt(value, 10) || 0;

      const updatedMatch = { ...matchToUpdate, ...updatePayload };
      const { error } = await updateMatch(updatedMatch);
      if (!error) {
        setLiveMatches(prev => prev.map(m => m.id === id ? { ...m, ...updatePayload } : m));
        showToast('⚡ Đã cập nhật trực tiếp trận đấu!');
      } else {
        showToast(`❌ Lỗi cập nhật: ${error.message}`);
      }
    } catch (err: any) {
      showToast(`❌ Lỗi: ${err.message}`);
    }
  };

  return {
    selectedMatchId, setSelectedMatchId,
    selectedMatch,
    filteredMatches,
    searchTermList, setSearchTermList,
    editingMatch, setEditingMatch,
    isAddingMatch, setIsAddingMatch,
    newMatchData, setNewMatchData,
    handleEditMatch,
    handleSaveMatch,
    handleCreateMatch,
    handleDeleteMatch,
    handleInlineUpdateMatch,
  };
}
