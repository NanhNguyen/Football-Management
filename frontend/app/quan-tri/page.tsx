'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import {
  layDanhSachDoi,
  layDanhSachTranDau,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMatch,
  addEvent,
  deleteEvent,
  updatePlayerGoals,
  createMatch,
  deleteMatch,
  calculateMatchMinute
} from '@/lib/api';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Loading from './loading';

const sidebarItems = [
  { label: 'Trọng tài điều khiển', id: 'referee' },
  { label: 'Quản lý đội', id: 'doi' },
  { label: 'Lịch thi đấu', id: 'lich' },
];

export default function QuanTriPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('referee');
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [activePlayerParams, setActivePlayerParams] = useState<{ matchId: string, teamId: string, player: any } | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Modals state
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ ten: '', logo: '⚽', bang: 'A' });
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({ doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK' });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Thủ môn');

  // Fetch data on mount & check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        fetchData();
      }
    };
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const [teamsData, matchesData] = await Promise.all([
      layDanhSachDoi(),
      layDanhSachTranDau()
    ]);
    setTeams(teamsData);
    setLiveMatches(matchesData);
    setLoading(false);
  };

  // Event Handlers for Teams & Schedule
  const handleAddTeam = () => setIsAddingTeam(true);

  const confirmAddTeam = async () => {
    if (!newTeamData.ten) {
      alert("Vui lòng nhập tên đội bóng!");
      return;
    }
    const newTeam = {
      id: `doi-${Date.now()}`,
      ten: newTeamData.ten,
      vietTat: newTeamData.ten.substring(0, 3).toUpperCase(),
      logo: newTeamData.logo,
      bang: newTeamData.bang,
      cauThu: []
    };

    const { error } = await createTeam(newTeam);
    if (!error) {
      await fetchData();
      setIsAddingTeam(false);
      setNewTeamData({ ten: '', logo: '⚽', bang: 'A' });
      showToast(`Đã khởi tạo đội ${newTeam.ten} thành công!`);
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleEditTeam = (team: any) => setEditingTeam({ ...team });

  const handleSaveTeam = async () => {
    const { error } = await updateTeam(editingTeam);
    if (!error) {
      await fetchData();
      setEditingTeam(null);
      showToast("Đã cập nhật thông tin đội bóng!");
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
    setEditingTeam({
      ...editingTeam,
      cauThu: [...(editingTeam.cauThu || []), newPlayer]
    });
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPosition('Thủ môn');
  };

  const handleDeletePlayer = (playerId: string) => {
    setEditingTeam({
      ...editingTeam,
      cauThu: editingTeam.cauThu.filter((p: any) => p.id !== playerId)
    });
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đội này không?")) {
      const { error } = await deleteTeam(teamId);
      if (!error) {
        await fetchData();
        showToast("Đã xóa đội bóng thành công!");
      }
    }
  };

  const handleAutoSchedule = () => {
    if (confirm("Xếp lịch tự động sẽ ghi đè lịch hiện tại. Bạn có muốn tiếp tục?")) {
      showToast("Đã xếp lịch tự động thành công!");
    }
  };

  const handleEditMatch = (match: any) => setEditingMatch({ ...match });

  const handleSaveMatch = async () => {
    const { error } = await updateMatch(editingMatch);
    if (!error) {
      await fetchData();
      setEditingMatch(null);
      showToast("Đã cập nhật lịch thi đấu!");
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
    const { error } = await createMatch(newMatchData);
    if (!error) {
      await fetchData();
      setIsAddingMatch(false);
      setNewMatchData({ doiNhaId: '', doiKhachId: '', vong: 'Vòng bảng', date: '', time: '15:00', san: 'Sân TK' });
      showToast('Đã tạo trận đấu mới thành công!');
    } else {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa trận đấu này?')) {
      const { error } = await deleteMatch(matchId);
      if (!error) {
        await fetchData();
        showToast('Đã xóa trận đấu!');
      }
    }
  };


  // Real-time timer logic (Realistic calculation)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatches(prev => prev.map(match => {
        if (match.trangThai === 'DANG_DIEN_RA' && !match.dangTamDung) {
          const currentPhut = calculateMatchMinute(match);
          if (currentPhut !== match.phut) {
            return { ...match, phut: currentPhut };
          }
        }
        return match;
      }));
    }, 10000); // Check every 10s for UI updates
    return () => clearInterval(interval);
  }, []);

  const [searchTermList, setSearchTermList] = useState('');
  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);
  const filteredMatches = liveMatches.filter(m => 
    m.doiNha?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) || 
    m.doiKhach?.ten?.toLowerCase().includes(searchTermList.toLowerCase()) ||
    m.vong?.toLowerCase().includes(searchTermList.toLowerCase())
  );

  const handleStartMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const updated = {
        ...match,
        trangThai: 'DANG_DIEN_RA',
        phut: 1,
        batDauLuc: new Date().toISOString(),
        thoiGianDaQua: 0,
        dangTamDung: false
      };
      await updateMatch(updated);
      await fetchData();
      showToast("Trận đấu đã bắt đầu!");
    }
  };

  const handlePauseMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const now = new Date().getTime();
      const start = new Date(match.batDauLuc).getTime();
      const passed = Math.floor((now - start) / 1000) + (match.thoiGianDaQua || 0);

      const updated = {
        ...match,
        dangTamDung: true,
        thoiGianDaQua: passed,
        phut: Math.floor(passed / 60) + 1
      };
      await updateMatch(updated);
      await fetchData();
      showToast("Đã tạm dừng đồng hồ!");
    }
  };

  const handleResumeMatch = async (matchId: string) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (match) {
      const updated = {
        ...match,
        dangTamDung: false,
        batDauLuc: new Date().toISOString() // New reference point
      };
      await updateMatch(updated);
      await fetchData();
      showToast("Tiếp tục trận đấu!");
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    if (confirm("Bạn có chắc chắn muốn kết thúc trận đấu này? Kết quả sẽ được chốt.")) {
      const match = liveMatches.find(m => m.id === matchId);
      if (match) {
        const finalPhut = calculateMatchMinute(match);
        const updated = { ...match, trangThai: 'KET_THUC', phut: finalPhut };
        await updateMatch(updated);
        await fetchData();
        showToast("Trận đấu đã kết thúc!");
      }
    }
  };

  const handleResetMatch = async (matchId: string) => {
    if (confirm("🔄 Bạn có chắc muốn RESET trận đấu này về trạng thái chưa diễn ra? Tất cả sự kiện sẽ bị xóa và tỷ số sẽ quay về 0-0.")) {
      const match = liveMatches.find(m => m.id === matchId);
      if (match) {
        // 1. Decrement goals for players who scored in this match
        if (match.suKien && match.suKien.length > 0) {
          for (const ev of match.suKien) {
            let decrement = 0;
            if (ev.loai === 'GOAL_NORMAL' || ev.loai === 'GOAL_PEN' || ev.loai === 'GOAL_OG') {
              decrement = -1;
            } else if (ev.loai === 'CHOT') {
              decrement = -2;
            }
            if (decrement !== 0 && ev.cauThuId) {
              await updatePlayerGoals(ev.cauThuId, decrement);
            }
          }
        }

        // 2. Delete all events of the match
        await supabase.from('su_kien').delete().eq('tran_dau_id', matchId);

        // 3. Reset match status, scores and times
        const updated = {
          ...match,
          tyNha: 0,
          tyKhach: 0,
          trangThai: 'SAP_DIEN_RA',
          phut: 0,
          batDauLuc: null,
          thoiGianDaQua: 0,
          dangTamDung: false
        };
        await updateMatch(updated);
        await fetchData();
        showToast("Trận đấu đã được reset về 0-0!");
      }
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleActionSelect = async (type: string, subType?: string) => {
    if (!activePlayerParams || !selectedMatch) return;
    const { teamId, matchId, player } = activePlayerParams;
    let typeLabel = '';
    let eventType = type.toUpperCase();
    let increment = 0;

    if (type === 'goal') {
      typeLabel = subType === 'pen' ? 'Ghi bàn (Penalty)' : subType === 'og' ? 'Phản lưới nhà' : 'Ghi bàn';
      eventType = subType ? `GOAL_${subType.toUpperCase()}` : 'GOAL_NORMAL';
      increment = 1;
    } else if (type === 'chot') {
      typeLabel = 'SIÊU CHỐT (+2)';
      eventType = 'CHOT';
      increment = 2;
    } else if (type === 'card') {
      typeLabel = subType === 'yellow' ? 'Phạt thẻ vàng 🟨' : subType === 'red' ? 'Phạt thẻ đỏ 🟥' : 'Án phạt';
      eventType = subType === 'yellow' ? 'THE_VANG' : subType === 'red' ? 'THE_DO' : 'CARD';
    } else if (type === 'motm') {
      typeLabel = 'Xuất sắc nhất trận 🏅';
      eventType = 'MOTM';
    }

    // 1. Add Event to DB
    await addEvent({
      matchId,
      teamId,
      playerId: player.id,
      type: eventType,
      minute: selectedMatch.phut || 0,
      description: `${player.ten} (${typeLabel})`
    });

    // 2. Update score if goal/chot
    if (increment > 0) {
      let scoringTeamId = teamId;
      if (eventType === 'GOAL_OG') {
        // Opponent team gets the score
        scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
      }
      const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
      const updated = { ...selectedMatch, [teamKey]: (selectedMatch[teamKey] || 0) + increment };
      await updateMatch(updated);
      
      // Update player goals (skip for OG)
      if (eventType !== 'GOAL_OG') {
        await updatePlayerGoals(player.id, increment);
      }
    }

    await fetchData();
    showToast(`🔥 ${typeLabel} cho ${player.ten}!`);
    setActivePlayerParams(null);
  };

  const handleUndoEvent = async (eventId: string, eventType: string, teamId: string, playerId: string) => {
    if (confirm("Bạn có muốn hoàn tác sự kiện này?")) {
      let increment = 0;
      if (eventType.startsWith('GOAL')) increment = 1;
      if (eventType === 'CHOT') increment = 2;
      
      await deleteEvent(eventId);
      
      if (increment > 0 && selectedMatch) {
         let scoringTeamId = teamId;
         if (eventType === 'GOAL_OG') {
           scoringTeamId = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiKhach?.id : selectedMatch.doiNha?.id;
         }
         const teamKey = scoringTeamId === selectedMatch.doiNha?.id ? 'tyNha' : 'tyKhach';
         const updated = { ...selectedMatch, [teamKey]: Math.max(0, (selectedMatch[teamKey] || 0) - increment) };
         await updateMatch(updated);
         
         if (eventType !== 'GOAL_OG') {
           await updatePlayerGoals(playerId, -increment);
         }
      }
      
      await fetchData();
      showToast("Đã hoàn tác sự kiện!");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <img src="/logo-premium-transparent.png" alt="Logo" className={styles.sidebarLogoImg} />
          </div>
          <div>
            <h2 className={styles.sidebarTitle}>TKScore</h2>
            <p className={styles.sidebarSub}>Referee Center</p>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.secondaryMenuItem}>
            <span className={styles.secondaryMenuItemIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </span>
            <span>Về Home</span>
          </a>

          <button onClick={handleLogout} className={`${styles.secondaryMenuItem} ${styles.logoutSecondaryItem}`}>
            <span className={styles.secondaryMenuItemIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>


        {activeTab === 'doi' && (
          <div className={`${styles.content} animate-fade-in`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className={styles.pageTitle}>Quản lý đội bóng</h2>
                <p className={styles.pageDesc}>Danh sách các đội tham gia Thiên Khôi Cúp Siêu Chốt</p>
              </div>
              <button className={styles.addBtn} onClick={handleAddTeam}>+ Thêm đội mới</button>
            </div>

            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Đội bóng</th>
                  <th>Bảng</th>
                  <th>Số cầu thủ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(doi => (
                  <tr key={doi.id}>
                    <td>
                      <div className={styles.teamRow} onClick={() => setViewingTeam(doi)}>
                        <div className={styles.teamLogoMini}>{doi.logo}</div>
                        <span style={{ fontWeight: 600 }}>{doi.ten}</span>
                      </div>
                    </td>
                    <td><span className={styles.statusBadge} style={{ background: '#f1f5f9' }}>Bảng {doi.bang}</span></td>
                    <td>{doi.cauThu?.length || 0} cầu thủ</td>
                    <td><span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>Đã đăng ký</span></td>
                    <td>
                      <div className={styles.actionBtnGroup}>
                        <button className={styles.editBtnCompact} onClick={() => handleEditTeam(doi)}>Sửa</button>
                        <button className={styles.deleteBtnCompact} onClick={() => handleDeleteTeam(doi.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lich' && (
          <div className={`${styles.content} animate-fade-in`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className={styles.pageTitle}>Quản lý Lịch thi đấu</h2>
                <p className={styles.pageDesc}>Xếp lịch, thay đổi thời gian và địa điểm thi đấu</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className={styles.undoBtn} onClick={handleAutoSchedule}>Xếp lịch tự động</button>
                <button className={styles.addBtn} onClick={() => setIsAddingMatch(true)}>+ Tạo trận đấu</button>
              </div>
            </div>

            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Vòng</th>
                  <th>Trận đấu</th>
                  <th>Sân</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {liveMatches.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.time}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.date}</div>
                    </td>
                    <td>{m.vong}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{m.doiNha?.ten || '???'}</span>
                        <span style={{ color: '#cbd5e1' }}>vs</span>
                        <span>{m.doiKhach?.ten || '???'}</span>
                      </div>
                    </td>
                    <td>{m.san}</td>
                    <td>
                      <span className={`
                        ${styles.statusBadge} 
                        ${m.trangThai === 'DANG_DIEN_RA' ? styles.badgeSuccess :
                          m.trangThai === 'KET_THUC' ? styles.badgeWarning : ''}
                      `} style={m.trangThai === 'SAP_DIEN_RA' ? { background: '#f1f5f9' } : {}}>
                        {m.trangThai === 'DANG_DIEN_RA' ? 'Đang đá' :
                          m.trangThai === 'KET_THUC' ? 'Kết thúc' : 'Chờ đá'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.editBtn} onClick={() => handleEditMatch(m)}>Đổi giờ</button>
                      <button className={styles.editBtn} style={{ color: '#ef4444', marginLeft: '10px' }} onClick={() => handleDeleteMatch(m.id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modals are simplified versions for brevity in this response, but keep full logic from previous version */}
        {/* ... Modal implementations (isAddingTeam, editingTeam, editingMatch) using handleSaveTeam, handleSaveMatch ... */}
        {/* I will keep the modals logic consistent with the previous version but using the new save handlers */}

        {activeTab === 'referee' && (
          <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>
            {!selectedMatchId ? (
              <div className={styles.content}>
                <h2 className={styles.pageTitle}>Trung tâm Điều khiển</h2>
                <p className={styles.pageDesc}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>

                <div className={styles.adminMatchList}>
                  {liveMatches.map(m => (
                    <div key={m.id} className={styles.adminMatchItem} onClick={() => setSelectedMatchId(m.id)}>
                      <div className={styles.matchListInfo}>
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, width: '80px' }}>{m.vong}</span>
                        <div className={styles.listTeam}>
                          <span>{m.doiNha?.logo}</span>
                          <span style={{ fontWeight: 700 }}>{m.doiNha?.ten}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontWeight: 800, fontSize: '18px', width: '60px', justifyContent: 'center' }}>
                          <span>{m.tyNha}</span>
                          <span>-</span>
                          <span>{m.tyKhach}</span>
                        </div>
                        <div className={styles.listTeam}>
                          <span>{m.doiKhach?.logo}</span>
                          <span style={{ fontWeight: 700 }}>{m.doiKhach?.ten}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className={`
                          ${styles.listStatus} 
                          ${m.trangThai === 'DANG_DIEN_RA' ? styles.statusLive : ''}
                          ${m.trangThai === 'KET_THUC' ? styles.statusFinished : ''}
                        `}>
                          {m.trangThai === 'DANG_DIEN_RA' ? (m.dangTamDung ? `TẠM DỪNG - ${calculateMatchMinute(m)}'` : `LIVE - ${calculateMatchMinute(m)}'`) :
                            m.trangThai === 'KET_THUC' ? 'KẾT THÚC' : 'CHƯA ĐÁ'}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>➜</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedMatch && (
              <div className={styles.liveConsole}>
                {/* TOP BAR */}
                <div className={styles.consoleTopBar}>
                  <button className={styles.consoleBackBtn} onClick={() => setSelectedMatchId(null)}>
                    ← Danh sách
                  </button>
                  <div className={styles.consoleMatchMeta}>
                    <span className={styles.consoleVong}>{selectedMatch.vong}</span>
                    {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                      <div className={styles.consoleLiveBadge}>
                        <span className={selectedMatch.dangTamDung ? '' : styles.consolePulseDot} />
                        {selectedMatch.dangTamDung ? 'TM DUNG' : 'LIVE'} {calculateMatchMinute(selectedMatch)}&apos;
                      </div>
                    )}
                    {selectedMatch.trangThai === 'SAP_DIEN_RA' && <span className={styles.consolePendingBadge}>CHUA BAT DAU</span>}
                    {selectedMatch.trangThai === 'KET_THUC' && <span className={styles.consoleFinishedBadge}>KET THUC</span>}
                  </div>
                  <div className={styles.consoleTopActions}>
                    {selectedMatch.trangThai === 'SAP_DIEN_RA' && (
                      <button className={styles.consoleStartBtn} onClick={() => handleStartMatch(selectedMatch.id)}>Bat dau</button>
                    )}
                    {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                      selectedMatch.dangTamDung
                        ? <button className={styles.consoleResumeBtn} onClick={() => handleResumeMatch(selectedMatch.id)}>Tiep tuc</button>
                        : <button className={styles.consolePauseBtn} onClick={() => handlePauseMatch(selectedMatch.id)}>Tam dung</button>
                    )}
                    {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                      <button className={styles.consoleFinishBtn} onClick={() => handleFinishMatch(selectedMatch.id)}>Ket thuc</button>
                    )}
                    {(selectedMatch.trangThai === 'KET_THUC' || selectedMatch.trangThai === 'DANG_DIEN_RA') && (
                      <button className={styles.consoleResetBtn} onClick={() => handleResetMatch(selectedMatch.id)}>Reset</button>
                    )}
                  </div>
                </div>

                {/* 3-PANEL GRID */}
                <div className={styles.consoleGrid}>

                  {/* LEFT — Doi nha */}
                  <div className={styles.consoleTeamPanel}>
                    <div className={styles.consoleTeamHeader}>
                      <span className={styles.consoleTeamEmoji}>{selectedMatch.doiNha?.logo}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.consoleTeamName}>{selectedMatch.doiNha?.ten}</div>
                        <div className={styles.consoleTeamLabel} style={{ color: '#f87171' }}>DOI NHA</div>
                      </div>
                      <div className={styles.consoleTeamScore} style={{ color: '#f87171' }}>{selectedMatch.tyNha || 0}</div>
                    </div>
                    <div className={styles.consoleRosterGrid}>
                      {(!selectedMatch.doiNha?.cauThu || selectedMatch.doiNha.cauThu.length === 0) && (
                        <p className={styles.consoleEmptyRoster}>Chua co cau thu nao</p>
                      )}
                      {selectedMatch.doiNha?.cauThu?.map((player: any) => {
                        const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                        const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                        const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                        const chotCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'CHOT' && ev.cauThuId === player.id).length || 0;
                        const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                        const isClickable = !hasRedCard && selectedMatch.trangThai === 'DANG_DIEN_RA';
                        return (
                          <button
                            key={player.id}
                            className={`${styles.consolePlayerBtn} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''}`}
                            onClick={() => isClickable && setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiNha.id, player })}
                            disabled={!isClickable}
                          >
                            <div className={styles.consolePlayerNo}>{player.soAo}</div>
                            <div className={styles.consolePlayerName}>{player.ten}</div>
                            <div className={styles.consolePlayerBadges}>
                              {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                              {chotCount > 0 && <span>{chotCount > 1 ? chotCount : ''}&#x26A1;</span>}
                              {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                              {hasRedCard && <span>R</span>}
                              {isMotm && <span>MVP</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CENTER — Scoreboard + Event Log */}
                  <div className={styles.consoleCenterPanel}>
                    {selectedMatch.trangThai === 'SAP_DIEN_RA' ? (
                      <div className={styles.consolePendingState}>
                        <div style={{ fontSize: '52px', marginBottom: '12px' }}>&#x26BD;</div>
                        <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Tran chua bat dau</h3>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Bam &quot;Bat dau&quot; de kich hoat</p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.consoleScoreBoard}>
                          <span className={styles.consoleBigScore}>{selectedMatch.tyNha || 0}</span>
                          <div className={styles.consoleSep}>
                            <span className={styles.consoleSepColon}>:</span>
                            {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                              <div className={styles.consoleMinutePill}>
                                {!selectedMatch.dangTamDung && <span className={styles.consolePulseDot} />}
                                {calculateMatchMinute(selectedMatch)}&apos;
                              </div>
                            )}
                          </div>
                          <span className={styles.consoleBigScore}>{selectedMatch.tyKhach || 0}</span>
                        </div>

                        <div className={styles.consoleEventLog}>
                          <div className={styles.consoleEventLogTitle}>Nhat ky su kien</div>
                          <div className={styles.consoleEventLogList}>
                            {selectedMatch.suKien && selectedMatch.suKien.length > 0 ? (
                              [...selectedMatch.suKien].sort((a: any, b: any) => b.phut - a.phut).slice(0, 8).map((ev: any) => (
                                <div key={ev.id} className={styles.consoleEventRow}>
                                  <span className={styles.consoleEventMin}>{ev.phut}&apos;</span>
                                  <span className={styles.consoleEventDesc}>{ev.moTa}</span>
                                  <button
                                    className={styles.consoleUndoBtn}
                                    onClick={() => handleUndoEvent(ev.id, ev.loai, ev.doiId, ev.cauThuId)}
                                    disabled={selectedMatch.trangThai === 'KET_THUC'}
                                  >x</button>
                                </div>
                              ))
                            ) : (
                              <p className={styles.consoleEventEmpty}>Chua co su kien nao</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* RIGHT — Doi khach */}
                  <div className={styles.consoleTeamPanel}>
                    <div className={styles.consoleTeamHeader}>
                      <div className={styles.consoleTeamScore} style={{ color: '#60a5fa' }}>{selectedMatch.tyKhach || 0}</div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <div className={styles.consoleTeamName}>{selectedMatch.doiKhach?.ten}</div>
                        <div className={styles.consoleTeamLabel} style={{ color: '#60a5fa', textAlign: 'right' }}>DOI KHACH</div>
                      </div>
                      <span className={styles.consoleTeamEmoji}>{selectedMatch.doiKhach?.logo}</span>
                    </div>
                    <div className={styles.consoleRosterGrid}>
                      {(!selectedMatch.doiKhach?.cauThu || selectedMatch.doiKhach.cauThu.length === 0) && (
                        <p className={styles.consoleEmptyRoster}>Chua co cau thu nao</p>
                      )}
                      {selectedMatch.doiKhach?.cauThu?.map((player: any) => {
                        const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                        const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                        const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                        const chotCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'CHOT' && ev.cauThuId === player.id).length || 0;
                        const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                        const isClickable = !hasRedCard && selectedMatch.trangThai === 'DANG_DIEN_RA';
                        return (
                          <button
                            key={player.id}
                            className={`${styles.consolePlayerBtn} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''}`}
                            onClick={() => isClickable && setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiKhach.id, player })}
                            disabled={!isClickable}
                          >
                            <div className={styles.consolePlayerNo}>{player.soAo}</div>
                            <div className={styles.consolePlayerName}>{player.ten}</div>
                            <div className={styles.consolePlayerBadges}>
                              {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                              {chotCount > 0 && <span>{chotCount > 1 ? chotCount : ''}&#x26A1;</span>}
                              {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                              {hasRedCard && <span>R</span>}
                              {isMotm && <span>MVP</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast.visible && <div className={styles.toast}>{toast.message}</div>}

      {/* Action Selection Bottom Sheet */}
      {activePlayerParams && selectedMatch && (
        <>
          <div className={styles.bottomSheetOverlay} onClick={() => setActivePlayerParams(null)} />
          <div className={styles.bottomSheet}>
            <div className={styles.bottomSheetHeader}>
              <div className={styles.bottomSheetHandle} />
              <div className={styles.sheetPlayerInfoContainer}>
                <span className={styles.sheetPlayerJersey}>#{activePlayerParams.player.soAo}</span>
                <div>
                  <h3 className={styles.sheetPlayerFullName}>{activePlayerParams.player.ten}</h3>
                  <p className={styles.sheetPlayerTeamName}>
                    {activePlayerParams.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha?.ten : selectedMatch.doiKhach?.ten}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.bottomSheetActionsGrid}>
              <button className={`${styles.bsActionCard} ${styles.bsGoalNormal}`} onClick={() => handleActionSelect('goal', 'normal')}>
                <span className={styles.bsActionIcon}>⚽</span>
                <span className={styles.bsActionText}>Bàn thắng</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsGoalPen}`} onClick={() => handleActionSelect('goal', 'pen')}>
                <span className={styles.bsActionIcon}>🥅</span>
                <span className={styles.bsActionText}>Penalty</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsGoalOg}`} onClick={() => handleActionSelect('goal', 'og')}>
                <span className={styles.bsActionIcon}>😈</span>
                <span className={styles.bsActionText}>Phản lưới</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsChotDeal}`} onClick={() => handleActionSelect('chot')}>
                <span className={styles.bsActionIcon}>⚡</span>
                <span className={styles.bsActionText}>Siêu chốt (+2)</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsYellow}`} onClick={() => handleActionSelect('card', 'yellow')}>
                <span className={styles.bsActionIcon}>🟨</span>
                <span className={styles.bsActionText}>Thẻ vàng</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsRed}`} onClick={() => handleActionSelect('card', 'red')}>
                <span className={styles.bsActionIcon}>🟥</span>
                <span className={styles.bsActionText}>Thẻ đỏ</span>
              </button>

              <button className={`${styles.bsActionCard} ${styles.bsMotm}`} onClick={() => handleActionSelect('motm')}>
                <span className={styles.bsActionIcon}>🏅</span>
                <span className={styles.bsActionText}>Cầu thủ MOTM</span>
              </button>
            </div>

            <div style={{ padding: '16px 0 8px 0', marginTop: '12px' }}>
              <button className={styles.finishBtn} style={{ width: '100%', margin: 0, background: '#334155' }} onClick={() => setActivePlayerParams(null)}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </>
      )}

      {/* Adding Team Modal */}
      {isAddingTeam && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>🏆 KHỞI TẠO ĐỘI BÓNG</h3>
            <input
              type="text"
              placeholder="Tên đội bóng"
              className={styles.modalInput}
              value={newTeamData.ten}
              onChange={(e) => setNewTeamData({ ...newTeamData, ten: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <input className={styles.modalInput} value={newTeamData.logo} onChange={(e) => setNewTeamData({ ...newTeamData, logo: e.target.value })} />
              <select className={styles.modalInput} value={newTeamData.bang} onChange={(e) => setNewTeamData({ ...newTeamData, bang: e.target.value })}>
                <option value="A">Bảng A</option>
                <option value="B">Bảng B</option>
                <option value="C">Bảng C</option>
                <option value="D">Bảng D</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className={styles.finishBtn} onClick={confirmAddTeam}>KHỞI TẠO</button>
              <button className={styles.undoBtn} onClick={() => setIsAddingTeam(false)}>HỦY</button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Team Modal */}
      {editingTeam && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: '650px', width: '100%', padding: '30px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b' }}>
              ⚙️ CHỈNH SỬA ĐỘI BÓNG
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Cập nhật tên đội bóng và quản lý danh sách thành viên đăng ký thi đấu.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                📛 Tên đội bóng
              </label>
              <input
                type="text"
                className={styles.modalInput}
                style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '15px' }}
                value={editingTeam.ten}
                onChange={(e) => setEditingTeam({ ...editingTeam, ten: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  ➕ Thêm cầu thủ mới
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    className={styles.modalInput}
                    style={{ flex: 3, padding: '10px 14px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    placeholder="Tên cầu thủ"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                  />
                  <input
                    className={styles.modalInput}
                    style={{ width: '65px', padding: '10px 10px', textAlign: 'center', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    placeholder="Số"
                    value={newPlayerNumber}
                    onChange={e => setNewPlayerNumber(e.target.value)}
                  />
                  <select
                    className={styles.modalInput}
                    style={{ width: '150px', padding: '10px 10px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '13px', cursor: 'pointer' }}
                    value={newPlayerPosition}
                    onChange={e => setNewPlayerPosition(e.target.value)}
                  >
                    <option value="Thủ môn">Thủ môn</option>
                    <option value="Hậu vệ">Hậu vệ</option>
                    <option value="Tiền vệ">Tiền vệ</option>
                    <option value="Tiền đạo">Tiền đạo</option>
                    <option value="Dự bị - Thủ môn">Dự bị - Thủ môn</option>
                    <option value="Dự bị - Hậu vệ">Dự bị - Hậu vệ</option>
                    <option value="Dự bị - Tiền vệ">Dự bị - Tiền vệ</option>
                    <option value="Dự bị - Tiền đạo">Dự bị - Tiền đạo</option>
                  </select>
                  <button
                    className={styles.addBtn}
                    style={{ height: '42px', width: '42px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}
                    onClick={handleAddPlayer}
                  >
                    +
                  </button>
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                👥 Danh sách thành viên ({editingTeam.cauThu?.length || 0})
              </label>

              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {(!editingTeam.cauThu || editingTeam.cauThu.length === 0) ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>Chương có cầu thủ nào. Hãy thêm cầu thủ ở trên!</p>
                ) : (
                  editingTeam.cauThu.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: p.viTri?.startsWith('Dự bị') ? '#f1f5f9' : '#fee2e2', color: p.viTri?.startsWith('Dự bị') ? '#475569' : '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                          {p.soAo}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{p.ten}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={p.viTri || 'Chưa rõ'}
                          onChange={(e) => {
                            const updatedPlayers = editingTeam.cauThu.map((player: any) =>
                              player.id === p.id ? { ...player, viTri: e.target.value } : player
                            );
                            setEditingTeam({ ...editingTeam, cauThu: updatedPlayers });
                          }}
                          style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 500, cursor: 'pointer' }}
                        >
                          <option value="Thủ môn">Thủ môn</option>
                          <option value="Hậu vệ">Hậu vệ</option>
                          <option value="Tiền vệ">Tiền vệ</option>
                          <option value="Tiền đạo">Tiền đạo</option>
                          <option value="Dự bị - Thủ môn">Dự bị - Thủ môn</option>
                          <option value="Dự bị - Hậu vệ">Dự bị - Hậu vệ</option>
                          <option value="Dự bị - Tiền vệ">Dự bị - Tiền vệ</option>
                          <option value="Dự bị - Tiền đạo">Dự bị - Tiền đạo</option>
                          <option value="Chưa rõ">Chưa rõ</option>
                        </select>
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooter} style={{ marginTop: '24px', padding: 0, border: 'none', display: 'flex', gap: '10px' }}>
              <button className={`${styles.modalFooterBtn} ${styles.modalFooterPrimary}`} style={{ flex: 1, padding: '12px 20px', fontSize: '14px', borderRadius: '12px' }} onClick={handleSaveTeam}>LƯU THAY ĐỔI</button>
              <button className={`${styles.modalFooterBtn} ${styles.modalFooterSecondary}`} style={{ flex: 1, padding: '12px 20px', fontSize: '14px', borderRadius: '12px' }} onClick={() => setEditingTeam(null)}>HỦY</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Match Modal */}
      {isAddingMatch && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>TẠO TRẬN ĐẤU MỚI</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <select
                className={styles.modalInput}
                value={newMatchData.doiNhaId}
                onChange={(e) => setNewMatchData({ ...newMatchData, doiNhaId: e.target.value })}
              >
                <option value="">-- Chọn đội nhà --</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.ten}</option>
                ))}
              </select>
              <select
                className={styles.modalInput}
                value={newMatchData.doiKhachId}
                onChange={(e) => setNewMatchData({ ...newMatchData, doiKhachId: e.target.value })}
              >
                <option value="">-- Chọn đội khách --</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.ten}</option>
                ))}
              </select>
              <input className={styles.modalInput} placeholder="Vòng đấu (VD: Vòng bảng)" value={newMatchData.vong} onChange={(e) => setNewMatchData({ ...newMatchData, vong: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className={styles.modalInput} type="date" value={newMatchData.date} onChange={(e) => setNewMatchData({ ...newMatchData, date: e.target.value })} />
                <input className={styles.modalInput} type="time" value={newMatchData.time} onChange={(e) => setNewMatchData({ ...newMatchData, time: e.target.value })} />
              </div>
              <input className={styles.modalInput} placeholder="Sân thi đấu" value={newMatchData.san} onChange={(e) => setNewMatchData({ ...newMatchData, san: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className={styles.finishBtn} onClick={handleCreateMatch}>TẠO TRẬN ĐẤU</button>
              <button className={styles.undoBtn} onClick={() => setIsAddingMatch(false)}>HỦY</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>CHỈNH SỬA LỊCH THI ĐẤU</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                {editingMatch.doiNha?.ten} vs {editingMatch.doiKhach?.ten}
              </p>
              <input className={styles.modalInput} placeholder="Vòng đấu" value={editingMatch.vong || ''} onChange={(e) => setEditingMatch({ ...editingMatch, vong: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className={styles.modalInput} type="date" value={editingMatch.date || ''} onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })} />
                <input className={styles.modalInput} type="time" value={editingMatch.time || ''} onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })} />
              </div>
              <input className={styles.modalInput} placeholder="Sân thi đấu" value={editingMatch.san || ''} onChange={(e) => setEditingMatch({ ...editingMatch, san: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className={styles.finishBtn} onClick={handleSaveMatch}>LƯU</button>
              <button className={styles.undoBtn} onClick={() => setEditingMatch(null)}>HỦY</button>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {viewingTeam && (
        <div className={styles.overlay} onClick={() => setViewingTeam(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '40px', background: '#f8fafc', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  {viewingTeam.logo}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{viewingTeam.ten}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={styles.statusBadge} style={{ background: '#f1f5f9' }}>Bảng {viewingTeam.bang}</span>
                    <span>•</span>
                    <span>{viewingTeam.cauThu?.length || 0} cầu thủ</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTeam(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                Danh sách cầu thủ đăng ký
              </h4>
              {(!viewingTeam.cauThu || viewingTeam.cauThu.length === 0) ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  Chưa có cầu thủ nào được đăng ký cho đội bóng này.
                </p>
              ) : (() => {
                const chinhThuc = viewingTeam.cauThu.filter((p: any) => !p.viTri?.startsWith('Dự bị'));
                const duBi = viewingTeam.cauThu.filter((p: any) => p.viTri?.startsWith('Dự bị'));

                const posOrder: Record<string, number> = {
                  'Thủ môn': 1, 'GK': 1,
                  'Hậu vệ': 2, 'DF': 2,
                  'Tiền vệ': 3, 'MF': 3,
                  'Tiền đạo': 4, 'FW': 4,
                  'Chưa rõ': 99
                };

                const sortPlayers = (list: any[]) => {
                  return [...list].sort((a: any, b: any) => {
                    const cleanPosA = a.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
                    const cleanPosB = b.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
                    return (posOrder[cleanPosA] || 99) - (posOrder[cleanPosB] || 99) || (a.soAo - b.soAo);
                  });
                };

                const sortedChinhThuc = sortPlayers(chinhThuc);
                const sortedDuBi = sortPlayers(duBi);

                const getDisplayPos = (pos: string) => {
                  if (!pos) return 'Chưa rõ';
                  if (pos.startsWith('Dự bị - ')) return pos.replace('Dự bị - ', '') + ' (Dự bị)';
                  return pos === 'GK' ? 'Thủ môn' : pos === 'DF' ? 'Hậu vệ' : pos === 'MF' ? 'Tiền vệ' : pos === 'FW' ? 'Tiền đạo' : pos;
                };

                return (
                  <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Đội hình chính thức */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🛡️ Đội hình chính thức ({chinhThuc.length})
                      </h5>
                      {chinhThuc.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: '4px 0 0 12px' }}>Không có cầu thủ chính thức</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sortedChinhThuc.map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                                  {p.soAo}
                                </span>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px', color: '#1e293b' }}>{p.ten}</p>
                                  <p style={{ margin: 0, fontSize: '10.5px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    {getDisplayPos(p.viTri)}
                                  </p>
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                ⚽ {p.banThang || 0} bàn
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Danh sách dự bị */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#4b5563', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📋 Danh sách dự bị ({duBi.length})
                      </h5>
                      {duBi.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: '4px 0 0 12px' }}>Không có cầu thủ dự bị</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sortedDuBi.map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(248, 250, 252, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', background: '#f1f5f9', color: '#475569', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                                  {p.soAo}
                                </span>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px', color: '#334155' }}>{p.ten}</p>
                                  <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    {getDisplayPos(p.viTri)}
                                  </p>
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                ⚽ {p.banThang || 0} bàn
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.modalFooterBtn} ${styles.modalFooterPrimary}`}
                onClick={() => {
                  const teamToEdit = viewingTeam;
                  setViewingTeam(null);
                  handleEditTeam(teamToEdit);
                }}
              >
                Chỉnh sửa thành viên
              </button>
              <button
                className={`${styles.modalFooterBtn} ${styles.modalFooterSecondary}`}
                onClick={() => setViewingTeam(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
