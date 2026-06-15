import React, { useState, useMemo, useEffect } from 'react';
import styles from '../quan-tri.module.css';
import TeamLogo from '@/components/TeamLogo';
import { IconGoal, IconCalendar, IconShield, IconSettings, IconTrophy } from './RefereeIcons';
import TeamDetailView from './TeamDetailView';
import RefereeMobileView from './RefereeMobileView';
import SettingsTab from './SettingsTab';
import { supabase } from '@/lib/supabase';
import RoleManagementTab from './RoleManagementTab';

export default function AdminMobileView(props: any) {
  const { data, actions } = props;

  // Destructure needed data
  const {
    activeTab, mobileMenuOpen, teams, liveMatches, sidebarItems,
    isAddingTeam, newTeamData, editingTeam,
    isAddingMatch, newMatchData, editingMatch, tournaments, selectedTournament,
    confirmDialog,
    // Settings configuration fields
    tournamentName, tournamentSeason, tournamentStartDate,
    tournamentEndDate, tournamentMaxPlayers, maxTeams,
    tournamentType, tournamentVenueType, tournamentGroupLegs,
    tournamentLeagueRounds, standingsConfig, customEvents,
    teamSuggestion,
    userRole
  } = data;

  const {
    setActiveTab, setMobileMenuOpen,
    setIsAddingTeam, setNewTeamData, confirmAddTeam, setEditingTeam, handleSaveTeam, handleDeleteTeam,
    setIsAddingMatch, setNewMatchData, handleCreateMatch, setEditingMatch, handleSaveMatch, handleDeleteMatch,
    handleAutoFetchLogo,
    setSelectedTournament, fetchData, showToast,
    // Settings configuration action triggers
    setTournamentName, setTournamentSeason, setTournamentStartDate,
    setTournamentEndDate, setTournamentMaxPlayers, setMaxTeams,
    setTournamentType, setTournamentVenueType, setTournamentGroupLegs,
    setTournamentLeagueRounds, setStandingsConfig,
    addCustomEvent, updateCustomEvent, removeCustomEvent,
    handleSaveTournamentConfig, handleDeleteTournament,
    handleTeamNameBlur, setTeamSuggestion
  } = actions;

  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [isTourDropdownOpen, setIsTourDropdownOpen] = useState(false);

  const parseVongDetails = (vongStr: string = '') => {
    const str = vongStr.trim();
    const matchNew = str.match(/Vòng\s+(\d+)\s+-\s+Bảng\s+([A-Z])/i);
    if (matchNew) return { bang: `Bảng ${matchNew[2]}`, vong: `Vòng ${matchNew[1]}` };
    const matchOld = str.match(/Bảng\s+([A-Z])\s+-\s+Vòng\s+(\d+)/i);
    if (matchOld) return { bang: `Bảng ${matchOld[1]}`, vong: `Vòng ${matchOld[2]}` };
    return { bang: '', vong: str };
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = days[d.getDay()];
      return `${dayName}, ${day} Thg ${month}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getRoundPriority = (roundName: string) => {
    const name = roundName.toLowerCase();
    if (name.includes('1/8')) return 100;
    if (name.includes('tứ kết')) return 200;
    if (name.includes('bán kết')) return 300;
    if (name.includes('hạng ba')) return 400;
    if (name.includes('chung kết')) return 500;
    const match = name.match(/vòng\s+(\d+)/);
    if (match) return parseInt(match[1]);
    return 999;
  };

  const uniqueRounds = useMemo(() => {
    if (!liveMatches) return [];
    const roundsSet = new Set<string>();
    liveMatches.forEach((m: any) => {
      const { vong } = parseVongDetails(m.vong);
      if (vong) roundsSet.add(vong);
    });
    return Array.from(roundsSet).sort((a, b) => getRoundPriority(a) - getRoundPriority(b));
  }, [liveMatches]);

  // Helper to find closest round to current date
  const getClosestRound = () => {
    if (!uniqueRounds || uniqueRounds.length === 0) return 'NONE';
    if (!liveMatches || liveMatches.length === 0) return uniqueRounds[0];

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    // 1. Matches today
    const matchesToday = liveMatches.filter((m: any) => {
      const mDateStr = m.date || m.batDauLuc;
      if (!mDateStr) return false;
      try {
        const mTime = new Date(mDateStr).getTime();
        return mTime >= todayStart && mTime < todayEnd;
      } catch (e) {
        return false;
      }
    });
    if (matchesToday.length > 0) {
      const { vong } = parseVongDetails(matchesToday[0].vong);
      if (vong && uniqueRounds.includes(vong)) return vong;
    }

    // 2. Matches this week (Mon to Sun)
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);
    monday.setHours(0, 0, 0, 0);
    const monTime = monday.getTime();
    const sunTime = monTime + 7 * 24 * 60 * 60 * 1000;

    const matchesThisWeek = liveMatches.filter((m: any) => {
      const mDateStr = m.date || m.batDauLuc;
      if (!mDateStr) return false;
      try {
        const mTime = new Date(mDateStr).getTime();
        return mTime >= monTime && mTime < sunTime;
      } catch (e) {
        return false;
      }
    });

    if (matchesThisWeek.length > 0) {
      matchesThisWeek.sort((a: any, b: any) => {
        const tA = new Date(a.date || a.batDauLuc).getTime();
        const tB = new Date(b.date || b.batDauLuc).getTime();
        return Math.abs(tA - today.getTime()) - Math.abs(tB - today.getTime());
      });
      const { vong } = parseVongDetails(matchesThisWeek[0].vong);
      if (vong && uniqueRounds.includes(vong)) return vong;
    }

    // 3. Nearest upcoming matches
    const upcoming = liveMatches.filter((m: any) => m.trangThai === 'DANG_DIEN_RA' || m.trangThai === 'SAP_DIEN_RA');
    if (upcoming.length > 0) {
      upcoming.sort((a: any, b: any) => {
        const tA = new Date(a.batDauLuc || a.date).getTime();
        const tB = new Date(b.batDauLuc || b.date).getTime();
        return tA - tB;
      });
      const { vong } = parseVongDetails(upcoming[0].vong);
      if (vong && uniqueRounds.includes(vong)) return vong;
    }

    // 4. Fallback to nearest past match
    const finished = liveMatches.filter((m: any) => m.trangThai === 'KET_THUC');
    if (finished.length > 0) {
      finished.sort((a: any, b: any) => {
        const tA = new Date(a.batDauLuc || a.date).getTime();
        const tB = new Date(b.batDauLuc || b.date).getTime();
        return tB - tA;
      });
      const { vong } = parseVongDetails(finished[0].vong);
      if (vong && uniqueRounds.includes(vong)) return vong;
    }

    return uniqueRounds[0];
  };

  // Set default selection
  useEffect(() => {
    if (uniqueRounds.length === 0) {
      if (selectedRound !== 'NONE') setSelectedRound('NONE');
      return;
    }
    if (selectedRound === 'all' || selectedRound === 'NONE' || !uniqueRounds.includes(selectedRound)) {
      const closest = getClosestRound();
      if (closest) setSelectedRound(closest);
    }
  }, [uniqueRounds, selectedRound]);

  const filteredMatches = useMemo(() => {
    if (!liveMatches) return [];
    let list = liveMatches.filter((m: any) => {
      const { vong } = parseVongDetails(m.vong);
      return vong === selectedRound;
    });

    return list.sort((a: any, b: any) => {
      const pA = getRoundPriority(parseVongDetails(a.vong).vong);
      const pB = getRoundPriority(parseVongDetails(b.vong).vong);
      if (pA !== pB) return pA - pB;
      
      const gA = parseVongDetails(a.vong).bang || '';
      const gB = parseVongDetails(b.vong).bang || '';
      if (gA !== gB) return gA.localeCompare(gB);
      
      return (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || '');
    });
  }, [liveMatches, selectedRound]);

  const getRoundDateRange = () => {
    const dates = filteredMatches
      .map((m: any) => m.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) return 'Chưa xếp lịch';
    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }
    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  const handlePrevRound = () => {
    if (uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(selectedRound);
    if (idx > 0) {
      setSelectedRound(uniqueRounds[idx - 1]);
    }
  };

  const handleNextRound = () => {
    if (uniqueRounds.length === 0) return;
    const idx = uniqueRounds.indexOf(selectedRound);
    if (idx < uniqueRounds.length - 1 && idx !== -1) {
      setSelectedRound(uniqueRounds[idx + 1]);
    }
  };

  // Styles for Mobile
  const mobileStyles = {
    container: { background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, paddingBottom: '60px', fontFamily: 'Inter, sans-serif' },
    header: { background: '#ffffff', padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky' as const, top: 0, zIndex: 10 },
    title: { fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' },
    content: { flex: 1, padding: '16px', overflowY: 'auto' as const },
    bottomTab: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '64px', zIndex: 10 },
    tabItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', border: 'none', background: 'none' },
    card: { background: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
    cardTitle: { fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' },
    cardSubtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
    buttonPrimary: { background: 'var(--color-primary, #3b82f6)', color: '#fff', border: 'none', borderRadius: '12px', minHeight: '48px', fontWeight: 600, fontSize: '15px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    buttonSecondary: { background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', minHeight: '48px', fontWeight: 600, fontSize: '15px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    bottomSheetOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end' },
    bottomSheet: { background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' as const },
    input: { width: '100%', minHeight: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box' as const }
  };

  const renderTeamsTab = () => {
    if (viewingTeam) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', zIndex: 20, overflowY: 'auto' }}>
          <TeamDetailView 
            team={viewingTeam} 
            styles={styles} 
            onBack={() => setViewingTeam(null)} 
            onEdit={() => setEditingTeam(viewingTeam)} 
          />
        </div>
      );
    }
    
    return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Các đội bóng ({teams?.length || 0})</h2>
      </div>
      
      {teams?.map((doi: any) => (
        <div key={doi.id} style={mobileStyles.card} onClick={() => setViewingTeam(doi)}>
          <div style={mobileStyles.cardHeader}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <TeamLogo logo={doi.logo} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={mobileStyles.cardTitle}>{doi.ten}</h3>
              <p style={mobileStyles.cardSubtitle}>Bảng {doi.bang} • {doi.cauThu?.length || 0} cầu thủ</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ ...mobileStyles.buttonSecondary, minHeight: '40px', flex: 1 }} onClick={(e) => { e.stopPropagation(); setEditingTeam(doi); }}>Sửa</button>
            <button style={{ ...mobileStyles.buttonSecondary, minHeight: '40px', flex: 1, background: '#fee2e2', color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleDeleteTeam(doi.id); }}>Xóa</button>
          </div>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: '80px', right: '16px' }}>
        <button 
          style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'var(--color-primary, #3b82f6)', color: '#fff', border: 'none', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsAddingTeam(true)}
        >
          +
        </button>
      </div>
    </div>
  );
};

  const renderSchedulerTab = () => (
    <div>
      {/* Centered Round Switcher Strip */}
      {uniqueRounds.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          padding: '16px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          gap: '12px'
        }}>
          {/* Filter Dropdown on Top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Chọn nhanh vòng:</span>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {uniqueRounds.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {(() => {
              const currentIdx = uniqueRounds.indexOf(selectedRound);
              const isFirstRound = currentIdx <= 0;
              const isLastRound = currentIdx >= uniqueRounds.length - 1 || currentIdx === -1;
              return (
                <>
                  <button
                    onClick={handlePrevRound}
                    disabled={isFirstRound}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFirstRound ? 'not-allowed' : 'pointer',
                      outline: 'none',
                      opacity: isFirstRound ? 0.5 : 1
                    }}
                    title="Vòng trước"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isFirstRound ? '#cbd5e1' : '#334155'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                      {selectedRound === 'NONE' ? 'Không có trận đấu' : selectedRound}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                      {getRoundDateRange()}
                    </div>
                  </div>
                  <button
                    onClick={handleNextRound}
                    disabled={isLastRound}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isLastRound ? 'not-allowed' : 'pointer',
                      outline: 'none',
                      opacity: isLastRound ? 0.5 : 1
                    }}
                    title="Vòng sau"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLastRound ? '#cbd5e1' : '#334155'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {filteredMatches?.map((match: any) => {
        const { vong, bang } = parseVongDetails(match.vong);
        return (
          <div key={match.id} style={mobileStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary, #0f766e)', background: 'var(--color-primary-light, #eff6ff)', padding: '4px 8px', borderRadius: '6px' }}>
                  {vong || 'Vòng đấu'}
                </span>
                {bang && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                    {bang}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{match.date} • {match.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '4px' }}>
                  <TeamLogo logo={match.doiNha?.logo} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>{match.doiNha?.ten || 'Đội nhà'}</span>
              </div>
              <div style={{ padding: '0 16px', fontSize: '24px', fontWeight: 800 }}>
                {match.trangThai === 'SAP_DIEN_RA' ? 'vs' : `${match.diemNha || 0} - ${match.diemKhach || 0}`}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '4px' }}>
                  <TeamLogo logo={match.doiKhach?.logo} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>{match.doiKhach?.ten || 'Đội khách'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...mobileStyles.buttonSecondary, minHeight: '40px', flex: 1 }} onClick={() => setEditingMatch(match)}>Sửa</button>
            </div>
          </div>
        );
      })}

      {filteredMatches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          Không có trận đấu nào.
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '80px', right: '16px' }}>
        <button 
          style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'var(--color-primary, #3b82f6)', color: '#fff', border: 'none', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsAddingMatch(true)}
        >
          +
        </button>
      </div>
    </div>
  );

  const getTabIcon = (id: string, isActive: boolean) => {
    const color = isActive ? 'var(--color-primary, #3b82f6)' : '#94a3b8';
    switch (id) {
      case 'lich': return <IconCalendar size={24} color={color} />;
      case 'doi': return <IconShield size={24} color={color} />;
      case 'referee': return <IconGoal size={24} color={color} />;
      case 'cai-dat': return <IconSettings size={24} color={color} />;
      case 'role-management': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
      default: return null;
    }
  };

  return (
    <div style={mobileStyles.container}>
      <header style={{
        ...mobileStyles.header,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        height: '60px',
        padding: '0 16px'
      }}>
        {/* Left: Sparta Logo */}
        <div style={{ display: 'flex', alignItems: 'center', width: '50px' }}>
          <img 
            src="/logo-premium-transparent.png" 
            alt="Sparta Logo" 
            style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
          />
        </div>

        {/* Center: Tournament Switcher */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
          <button
            onClick={() => setIsTourDropdownOpen(!isTourDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              background: 'none',
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--color-primary, #0f766e)',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '8px',
              outline: 'none',
              maxWidth: '220px',
              width: 'auto'
            }}
          >
            <IconTrophy size={18} color="var(--color-primary, #0f766e)" />
            <span style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: 'inline-block',
              maxWidth: '130px'
            }}>
              {selectedTournament?.ten || 'Chọn giải đấu'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: isTourDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Custom Dropdown Menu */}
          {isTourDropdownOpen && (
            <>
              {/* Invisible backdrop to close dropdown when clicking outside */}
              <div 
                onClick={() => setIsTourDropdownOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                  background: 'transparent'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '42px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '260px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 1000,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {tournaments?.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTournament(t);
                      fetchData(t.id);
                      setIsTourDropdownOpen(false);
                      showToast(`Đã chuyển sang giải đấu: ${t.ten}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedTournament?.id === t.id ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                      color: selectedTournament?.id === t.id ? 'var(--color-primary, #0f766e)' : '#334155',
                      fontSize: '14px',
                      fontWeight: selectedTournament?.id === t.id ? 700 : 500,
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <IconTrophy size={16} color={selectedTournament?.id === t.id ? 'var(--color-primary, #0f766e)' : '#64748b'} />
                    <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', flex: 1 }}>
                      {t.ten}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Spacer to offset the logo on the left */}
        <div style={{ width: '50px' }} />
      </header>

      <main style={mobileStyles.content}>
        {activeTab === 'doi' && renderTeamsTab()}
        {activeTab === 'lich' && renderSchedulerTab()}
        {activeTab === 'referee' && <RefereeMobileView data={data} actions={actions} />}
        {activeTab === 'cai-dat' && (
          <SettingsTab
            styles={styles}
            selectedTournamentId={selectedTournament?.id || 'giai-1'}
            selectedTournament={selectedTournament}
            tournamentName={tournamentName}
            setTournamentName={setTournamentName}
            tournamentSeason={tournamentSeason}
            setTournamentSeason={setTournamentSeason}
            tournamentStartDate={tournamentStartDate}
            setTournamentStartDate={setTournamentStartDate}
            tournamentEndDate={tournamentEndDate}
            setTournamentEndDate={setTournamentEndDate}
            maxTeams={maxTeams}
            setMaxTeams={setMaxTeams}
            tournamentMaxPlayers={tournamentMaxPlayers}
            setTournamentMaxPlayers={setTournamentMaxPlayers}
            tournamentType={tournamentType}
            setTournamentType={setTournamentType}
            tournamentVenueType={tournamentVenueType}
            setTournamentVenueType={setTournamentVenueType}
            tournamentGroupLegs={tournamentGroupLegs}
            setTournamentGroupLegs={setTournamentGroupLegs}
            tournamentLeagueRounds={tournamentLeagueRounds}
            setTournamentLeagueRounds={setTournamentLeagueRounds}
            standingsConfig={standingsConfig}
            setStandingsConfig={setStandingsConfig}
            customEvents={customEvents}
            addCustomEvent={addCustomEvent}
            updateCustomEvent={updateCustomEvent}
            removeCustomEvent={removeCustomEvent}
            handleSaveTournamentConfig={handleSaveTournamentConfig}
            handleDeleteTournament={handleDeleteTournament}
          />
        )}
        {activeTab === 'role-management' && (
          <RoleManagementTab showToast={showToast} />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <div style={mobileStyles.bottomTab}>
        {sidebarItems.map((item: any) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={mobileStyles.tabItem}
          >
            {getTabIcon(item.id, activeTab === item.id)}
            <span style={{ fontSize: '10px', fontWeight: activeTab === item.id ? 700 : 500, color: activeTab === item.id ? 'var(--color-primary, #3b82f6)' : '#94a3b8', marginTop: '4px' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Modals (Bottom Sheets) */}
      
      {/* Add Team Bottom Sheet */}
      {isAddingTeam && (
        <div style={mobileStyles.bottomSheetOverlay} onClick={() => { setIsAddingTeam(false); setTeamSuggestion(null); }}>
          <div style={mobileStyles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 20px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>Tạo đội bóng mới</h3>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Tên đội bóng</label>
            <input 
              style={mobileStyles.input} 
              placeholder="Nhập tên đội..." 
              value={newTeamData.ten}
              onChange={e => setNewTeamData({...newTeamData, ten: e.target.value})}
              onBlur={() => handleTeamNameBlur(newTeamData.ten)}
            />
            {teamSuggestion && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={teamSuggestion.logo} alt={teamSuggestion.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  <span style={{ textAlign: 'left' }}>
                    💡 Tìm thấy dữ liệu quốc tế: <strong>{teamSuggestion.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewTeamData({
                      ...newTeamData,
                      logo: teamSuggestion.logo,
                      externalApiId: teamSuggestion.id,
                      logoSource: 'EXTERNAL_API'
                    });
                    setTeamSuggestion(null);
                  }}
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Áp dụng
                </button>
              </div>
            )}
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Bảng đấu</label>
            <input 
              style={mobileStyles.input} 
              placeholder="VD: A, B, C..." 
              value={newTeamData.bang}
              onChange={e => setNewTeamData({...newTeamData, bang: e.target.value})}
            />
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Logo đội bóng</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      showToast("⏳ Đang tải ảnh lên...");
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                      const { data, error } = await supabase.storage.from('team-logos').upload(fileName, file);
                      if (error) throw error;
                      const { data: publicData } = supabase.storage.from('team-logos').getPublicUrl(fileName);
                      setNewTeamData({ 
                        ...newTeamData, 
                        logo: publicData.publicUrl,
                        logoSource: 'SUPABASE_BUCKET',
                        externalApiId: null
                      });
                      showToast("✅ Đã cập nhật logo!");
                    } catch (err) {
                      console.error("Upload error:", err);
                      showToast("❌ Lỗi khi tải ảnh lên");
                    }
                  }}
                />
                <TeamLogo logo={newTeamData.logo} teamName={newTeamData.ten} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" style={{ width: '48px', height: '48px', cursor: 'pointer' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#ffffff', borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#475569"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
              </label>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Nhấn vào ảnh để tải lên<br/>logo từ thiết bị của bạn.
              </div>
            </div>
            <button style={mobileStyles.buttonPrimary} onClick={confirmAddTeam}>Xác Nhận Tạo Đội</button>
          </div>
        </div>
      )}

      {/* Edit Team Bottom Sheet */}
      {editingTeam && (
        <div style={mobileStyles.bottomSheetOverlay} onClick={() => { setEditingTeam(null); setTeamSuggestion(null); }}>
          <div style={mobileStyles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 20px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>Sửa đội bóng</h3>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Tên đội bóng</label>
            <input 
              style={mobileStyles.input} 
              value={editingTeam.ten}
              onChange={e => setEditingTeam({...editingTeam, ten: e.target.value})}
              onBlur={() => handleTeamNameBlur(editingTeam.ten)}
            />
            {teamSuggestion && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={teamSuggestion.logo} alt={teamSuggestion.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  <span style={{ textAlign: 'left' }}>
                    💡 Tìm thấy dữ liệu quốc tế: <strong>{teamSuggestion.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam({
                      ...editingTeam,
                      logo: teamSuggestion.logo,
                      externalApiId: teamSuggestion.id,
                      logoSource: 'EXTERNAL_API'
                    });
                    setTeamSuggestion(null);
                  }}
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Áp dụng
                </button>
              </div>
            )}
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Bảng đấu</label>
            <input 
              style={mobileStyles.input} 
              value={editingTeam.bang}
              onChange={e => setEditingTeam({...editingTeam, bang: e.target.value})}
            />
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Logo đội bóng</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      showToast("⏳ Đang tải ảnh lên...");
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                      const { data, error } = await supabase.storage.from('team-logos').upload(fileName, file);
                      if (error) throw error;
                      const { data: publicData } = supabase.storage.from('team-logos').getPublicUrl(fileName);
                      setEditingTeam({ 
                        ...editingTeam, 
                        logo: publicData.publicUrl,
                        logoSource: 'SUPABASE_BUCKET',
                        externalApiId: null
                      });
                      showToast("✅ Đã cập nhật logo!");
                    } catch (err) {
                      console.error("Upload error:", err);
                      showToast("❌ Lỗi khi tải ảnh lên");
                    }
                  }}
                />
                <TeamLogo logo={editingTeam.logo} teamName={editingTeam.ten} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" style={{ width: '48px', height: '48px', cursor: 'pointer' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#ffffff', borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#475569"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
              </label>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Nhấn vào ảnh để tải lên<br/>logo từ thiết bị của bạn.
              </div>
            </div>
            <button style={{ ...mobileStyles.buttonPrimary, marginBottom: '12px' }} onClick={handleSaveTeam}>Lưu Thay Đổi</button>
            <button style={{ ...mobileStyles.buttonSecondary, color: '#ef4444', background: '#fee2e2' }} onClick={() => setEditingTeam(null)}>Hủy Bỏ</button>
          </div>
        </div>
      )}

      {/* Create Match Bottom Sheet */}
      {isAddingMatch && (
        <div style={mobileStyles.bottomSheetOverlay} onClick={() => setIsAddingMatch(false)}>
          <div style={mobileStyles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 20px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>Tạo trận đấu mới</h3>
            <select style={mobileStyles.input} value={newMatchData.doiNhaId} onChange={e => setNewMatchData({...newMatchData, doiNhaId: e.target.value})}>
              <option value="">-- Chọn đội nhà --</option>
              {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.ten}</option>)}
            </select>
            <select style={mobileStyles.input} value={newMatchData.doiKhachId} onChange={e => setNewMatchData({...newMatchData, doiKhachId: e.target.value})}>
              <option value="">-- Chọn đội khách --</option>
              {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.ten}</option>)}
            </select>
            <input style={mobileStyles.input} placeholder="Vòng đấu" value={newMatchData.vong} onChange={e => setNewMatchData({...newMatchData, vong: e.target.value})} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input style={{...mobileStyles.input, flex: 1}} type="date" value={newMatchData.date} onChange={e => setNewMatchData({...newMatchData, date: e.target.value})} />
              <input style={{...mobileStyles.input, flex: 1}} type="time" value={newMatchData.time} onChange={e => setNewMatchData({...newMatchData, time: e.target.value})} />
            </div>
            <button style={mobileStyles.buttonPrimary} onClick={handleCreateMatch}>Tạo Trận Đấu</button>
          </div>
        </div>
      )}

      {/* Edit Match Bottom Sheet */}
      {editingMatch && (
        <div style={mobileStyles.bottomSheetOverlay} onClick={() => setEditingMatch(null)}>
          <div style={mobileStyles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 20px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>Chỉnh sửa trận đấu</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>{editingMatch.doiNha?.ten} vs {editingMatch.doiKhach?.ten}</p>
            <input style={mobileStyles.input} placeholder="Vòng đấu" value={editingMatch.vong || ''} onChange={e => setEditingMatch({...editingMatch, vong: e.target.value})} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input style={{...mobileStyles.input, flex: 1}} type="date" value={editingMatch.date || ''} onChange={e => setEditingMatch({...editingMatch, date: e.target.value})} />
              <input style={{...mobileStyles.input, flex: 1}} type="time" value={editingMatch.time || ''} onChange={e => setEditingMatch({...editingMatch, time: e.target.value})} />
            </div>
            <input style={mobileStyles.input} placeholder="Sân thi đấu" value={editingMatch.san || ''} onChange={e => setEditingMatch({...editingMatch, san: e.target.value})} />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button style={{...mobileStyles.buttonSecondary, flex: 1, color: '#ef4444', background: '#fee2e2'}} onClick={() => { handleDeleteMatch(editingMatch.id); setEditingMatch(null); }}>Xóa</button>
              <button style={{...mobileStyles.buttonPrimary, flex: 2}} onClick={handleSaveMatch}>Lưu</button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className={styles.overlay} style={{ zIndex: 9999 }}>
          <div className={styles.modal} style={{ maxWidth: '340px', width: '90%', textAlign: 'center', padding: '24px', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>❓</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className={styles.finishBtn}
                style={{ flex: 1, margin: 0, justifyContent: 'center', minHeight: '44px', borderRadius: '10px' }}
                onClick={confirmDialog.onConfirm}
              >
                Xác nhận
              </button>
              <button
                className={styles.undoBtn}
                style={{ flex: 1, margin: 0, minHeight: '44px', borderRadius: '10px' }}
                onClick={confirmDialog.onCancel}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
