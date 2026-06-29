'use client';

import { useState } from 'react';
import { createTeam, updateTeam, deleteTeam, deleteAllTeams } from '@/lib/api';

export function useTeamManagement(
  teams: any[],
  maxTeams: number,
  setMaxTeams: (n: number) => void,
  selectedTournament: any,
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void,
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void
) {
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [teamSuggestion, setTeamSuggestion] = useState<{ name: string; logo: string; id: number } | null>(null);
  const [isSyncingLogos, setIsSyncingLogos] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentTeamName: string } | null>(null);
  const [newTeamData, setNewTeamData] = useState({
    ten: '', logo: '⚽', bang: 'A',
    externalApiId: null as number | null,
    logoSource: 'DEFAULT'
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Thủ môn');

  const handleAutoFetchLogo = async (teamName: string, isEditing = false) => {
    if (!teamName) return showToast('Vui lòng nhập tên đội bóng trước!');
    setFetchingLogo(true);
    try {
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&size=200&bold=true&format=svg`;
      if (isEditing) {
        setEditingTeam((prev: any) => ({ ...prev, logo: fallbackUrl }));
      } else {
        setNewTeamData((prev: any) => ({ ...prev, logo: fallbackUrl }));
      }
      showToast('✅ Đã tạo Logo Avatar cực chất!');
    } catch (error) {
      showToast('❌ Có lỗi khi tạo logo');
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleTeamNameBlur = async (name: string) => {
    if (!name || name.trim().length < 3) return;
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.teams && data.teams.length > 0) {
        const apiTeam = data.teams[0];
        setTeamSuggestion({ name: apiTeam.strTeam, logo: apiTeam.strBadge, id: parseInt(apiTeam.idTeam) });
      } else {
        setTeamSuggestion(null);
      }
    } catch (err) {
      console.error('Error fetching suggestion:', err);
    }
  };

  const handleBulkSyncLogos = async () => {
    if (!selectedTournament?.id) return;
    try {
      setIsSyncingLogos(true);
      setSyncProgress({ current: 0, total: teams.length, currentTeamName: '' });
      let count = 0;
      let idx = 0;
      for (const team of teams) {
        idx++;
        setSyncProgress({ current: idx, total: teams.length, currentTeamName: team.ten });
        try {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.ten)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && data.teams && data.teams.length > 0) {
            const apiTeam = data.teams[0];
            const updatedTeam = { ...team, logo: apiTeam.strBadge, externalApiId: apiTeam.idTeam, logoSource: 'SPORTSDB' };
            const { error } = await updateTeam(updatedTeam);
            if (!error) count++;
          }
        } catch (err) {
          console.error(`Error syncing logo for team ${team.ten}:`, err);
        }
      }
      showToast(`⚡ Đã đồng bộ thành công ${count} đội bóng!`);
      await fetchData(selectedTournament.id);
    } catch (err) {
      console.error('Bulk sync error:', err);
      showToast('❌ Lỗi khi đồng bộ logo');
    } finally {
      setIsSyncingLogos(false);
      setSyncProgress(null);
    }
  };

  const handleAddTeam = () => {
    setTeamSuggestion(null);
    setIsAddingTeam(true);
  };

  const confirmAddTeam = async () => {
    if (!newTeamData.ten) { showToast('⚠️ Vui lòng nhập tên đội bóng!'); return; }
    if (teams.length >= maxTeams) {
      showToast(`⚠️ [Lỗi] Vượt quá số lượng đội quy định! Giải đấu này chỉ cho phép tối đa ${maxTeams} đội.`);
      return;
    }
    const newTeam = {
      id: `doi-${Date.now()}`,
      ten: newTeamData.ten,
      vietTat: newTeamData.ten.substring(0, 3).toUpperCase(),
      logo: newTeamData.logo,
      bang: newTeamData.bang,
      giaiDauId: selectedTournament?.id,
      externalApiId: newTeamData.externalApiId || null,
      logoSource: newTeamData.logoSource || 'DEFAULT',
      cauThu: []
    };
    const { error } = await createTeam(newTeam);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setIsAddingTeam(false);
      setNewTeamData({ ten: '', logo: '⚽', bang: 'A', externalApiId: null, logoSource: 'DEFAULT' });
      setTeamSuggestion(null);
      showToast(`Đã khởi tạo đội ${newTeam.ten} thành công!`);
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleEditTeam = (team: any) => {
    setTeamSuggestion(null);
    setEditingTeam({ ...team });
  };

  const handleSaveTeam = async () => {
    const { error } = await updateTeam(editingTeam);
    if (!error) {
      await fetchData(selectedTournament?.id);
      setEditingTeam(null);
      setTeamSuggestion(null);
      showToast('Đã cập nhật thông tin đội bóng!');
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleAddPlayer = () => {
    if (!newPlayerName) return;
    const newPlayer = {
      id: `ct-${Date.now()}`,
      ten: newPlayerName,
      soAo: newPlayerNumber ? parseInt(newPlayerNumber) : 99,
      viTri: newPlayerPosition,
      banThang: 0
    };
    setEditingTeam({ ...editingTeam, cauThu: [...(editingTeam.cauThu || []), newPlayer] });
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPosition('Thủ môn');
  };

  const handleDeletePlayer = (playerId: string) => {
    setEditingTeam({ ...editingTeam, cauThu: editingTeam.cauThu.filter((p: any) => p.id !== playerId) });
  };

  const handleDeleteTeam = async (teamId: string) => {
    showConfirm('XÓA ĐỘI BÓNG', 'Bạn có chắc chắn muốn xóa đội bóng này không?', async () => {
      const { error } = await deleteTeam(teamId);
      if (!error) {
        await fetchData(selectedTournament?.id);
        showToast('Đã xóa đội bóng thành công!');
      }
    });
  };

  const handleDeleteAllTeams = async () => {
    if (!selectedTournament?.id) return;
    showConfirm(
      'XÓA TẤT CẢ ĐỘI BÓNG',
      '⚠️ Bạn có chắc chắn muốn xóa TẤT CẢ đội bóng (và toàn bộ cầu thủ của họ) khỏi giải đấu này không? Hành động này không thể hoàn tác!',
      async () => {
        try {
          showToast('🧹 Đang xóa tất cả đội bóng...');
          const { error } = await deleteAllTeams(selectedTournament.id);
          if (error) {
            if (error.message?.includes('violates foreign key constraint') || error.details?.includes('is still referenced')) {
              showToast('❌ Không thể xóa! Một số đội đã được xếp lịch đấu. Hãy xóa lịch trước.');
            } else {
              showToast(`❌ Lỗi khi xóa: ${error.message}`);
            }
          } else {
            await fetchData(selectedTournament.id);
            showToast('Đã xóa toàn bộ đội bóng thành công!');
          }
        } catch (err: any) {
          showToast(`❌ Lỗi khi xóa: ${err.message}`);
        }
      }
    );
  };

  return {
    editingTeam, setEditingTeam,
    viewingTeam, setViewingTeam,
    isAddingTeam, setIsAddingTeam,
    fetchingLogo,
    teamSuggestion, setTeamSuggestion,
    isSyncingLogos,
    syncProgress,
    newTeamData, setNewTeamData,
    newPlayerName, setNewPlayerName,
    newPlayerNumber, setNewPlayerNumber,
    newPlayerPosition, setNewPlayerPosition,
    handleAutoFetchLogo,
    handleTeamNameBlur,
    handleBulkSyncLogos,
    handleAddTeam,
    confirmAddTeam,
    handleEditTeam,
    handleSaveTeam,
    handleAddPlayer,
    handleDeletePlayer,
    handleDeleteTeam,
    handleDeleteAllTeams,
  };
}
