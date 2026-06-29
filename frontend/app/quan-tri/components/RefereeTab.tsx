import React, { useState, useEffect } from 'react';
import { desktopStyles, mobileStyles } from './referee/refereeStyles';
import MatchList from './referee/MatchList';
import LineupColumn from './referee/LineupColumn';
import ScoreBoard from './referee/ScoreBoard';
import ActionButtons from './referee/ActionButtons';
import MatchTimeline from './referee/MatchTimeline';
import ActionWizardModal from './referee/ActionWizardModal';
import QuickAddPlayerModal from './referee/QuickAddPlayerModal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import styles from '../quan-tri.module.css';

export default function RefereeTab({ data, actions }: any) {
  const {
    selectedMatchId,
    selectedMatch,
    uniqueRounds,
    refereeFilterVong,
    refereeFilterBang,
    uniqueGroups,
    filteredAndSortedRefereeMatches,
    starterCount,
    customEvents
  } = data;

  const {
    setSelectedMatchId,
    setRefereeFilterVong,
    setRefereeFilterBang,
    handleStartMatch,
    handleTemporaryPauseToggle,
    handleFinishMatch,
    handleResetMatch,
    handleDeleteEvent,
    handleActionSelect,
    handleExecuteSubstitution,
    calculateCurrentRoster,
    formatMatchTime,
    getMatchHalfState,
    handleQuickAddPlayerSuccess
  } = actions;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [activePlayerPopover, setActivePlayerPopover] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  const [pcSubModalState, setPcSubModalState] = useState({
    isOpen: false,
    teamId: '',
    subOutPlayer: null as any,
    subInPlayerId: '',
    minute: ''
  });

  const [quickAddPlayerModalState, setQuickAddPlayerModalState] = useState({
    isOpen: false,
    teamId: '',
    teamName: '',
    name: '',
    jerseyNumber: '',
    isSaving: false
  });

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLive = selectedMatch?.trangThai === 'DANG_DIEN_RA';

  const onActionClick = (type: string, subType?: string, overrideParams?: any) => {
    handleActionSelect(type, subType, overrideParams);
    setActivePlayerPopover(null);
    setActiveActionMenu(null);
  };

  const handleSaveQuickPlayer = async () => {
    setQuickAddPlayerModalState(prev => ({ ...prev, isSaving: true }));
    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/teams/${quickAddPlayerModalState.teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          ten: quickAddPlayerModalState.name,
          soAo: parseInt(quickAddPlayerModalState.jerseyNumber),
          viTri: 'Cầu thủ'
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      handleQuickAddPlayerSuccess(quickAddPlayerModalState.teamId, result.player);
      actions.showToast(`✅ Đã thêm ${result.player.ten} vào đội`);
      setQuickAddPlayerModalState(prev => ({ ...prev, isOpen: false, name: '', jerseyNumber: '' }));
    } catch (e: any) {
      actions.showToast('❌ Lỗi khi thêm cầu thủ!');
      console.error(e);
    } finally {
      setQuickAddPlayerModalState(prev => ({ ...prev, isSaving: false }));
    }
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Đang tải giao diện điều khiển...</div>;
  }

  return (
    <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>
      {!selectedMatchId ? (
        <div className={styles.content}>
          <h2 className={styles.pageTitle}>Trung tâm Điều khiển</h2>
          <p className={styles.pageDesc}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>
          <MatchList
            uniqueRounds={uniqueRounds}
            refereeFilterVong={refereeFilterVong}
            setRefereeFilterVong={setRefereeFilterVong}
            refereeFilterBang={refereeFilterBang}
            setRefereeFilterBang={setRefereeFilterBang}
            uniqueGroups={uniqueGroups}
            filteredAndSortedRefereeMatches={filteredAndSortedRefereeMatches}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
          />
        </div>
      ) : (
        <div style={isMobile ? mobileStyles.wrapper : desktopStyles.wrapper}>
          <button style={isMobile ? mobileStyles.backBtn : desktopStyles.backBtn} onClick={() => setSelectedMatchId(null)}>
            ← Quay lại
          </button>

          {!isMobile && (
            <LineupColumn
              team={selectedMatch?.doiNha}
              isHome={true}
              events={selectedMatch?.suKien}
              starterCount={starterCount}
              activePlayerPopover={activePlayerPopover}
              activeActionMenu={activeActionMenu}
              calculateCurrentRoster={calculateCurrentRoster}
              onActionClick={onActionClick}
              onSetActivePlayerPopover={setActivePlayerPopover}
              onSetActiveActionMenu={setActiveActionMenu}
              onOpenQuickAdd={(teamId: string) => setQuickAddPlayerModalState({ isOpen: true, teamId, teamName: selectedMatch?.doiNha?.ten || '', name: '', jerseyNumber: '', isSaving: false })}
              onOpenPcSub={(teamId: string, player: any) => setPcSubModalState({ isOpen: true, teamId, subOutPlayer: player, subInPlayerId: '', minute: '' })}
              desktopStyles={desktopStyles}
              isMobile={false}
            />
          )}

          <div style={isMobile ? mobileStyles.columnCenter : desktopStyles.columnCenter}>
            <ScoreBoard
              selectedMatch={selectedMatch}
              isLive={isLive}
              displayTime={formatMatchTime(selectedMatch)}
              halfState={getMatchHalfState(selectedMatch)}
              desktopStyles={desktopStyles}
            />

            <ActionButtons
              selectedMatch={selectedMatch}
              isLive={isLive}
              onStartMatch={() => handleStartMatch(selectedMatch)}
              onTemporaryPauseToggle={() => handleTemporaryPauseToggle(selectedMatch)}
              onFinishMatch={() => handleFinishMatch(selectedMatch)}
              onResetMatch={() => handleResetMatch(selectedMatch)}
              desktopStyles={desktopStyles}
              isMobile={isMobile}
            />

            <MatchTimeline
              selectedMatch={selectedMatch}
              customEvents={customEvents}
              onDeleteEvent={handleDeleteEvent}
              desktopStyles={desktopStyles}
            />
          </div>

          {!isMobile && (
            <LineupColumn
              team={selectedMatch?.doiKhach}
              isHome={false}
              events={selectedMatch?.suKien}
              starterCount={starterCount}
              activePlayerPopover={activePlayerPopover}
              activeActionMenu={activeActionMenu}
              calculateCurrentRoster={calculateCurrentRoster}
              onActionClick={onActionClick}
              onSetActivePlayerPopover={setActivePlayerPopover}
              onSetActiveActionMenu={setActiveActionMenu}
              onOpenQuickAdd={(teamId: string) => setQuickAddPlayerModalState({ isOpen: true, teamId, teamName: selectedMatch?.doiKhach?.ten || '', name: '', jerseyNumber: '', isSaving: false })}
              onOpenPcSub={(teamId: string, player: any) => setPcSubModalState({ isOpen: true, teamId, subOutPlayer: player, subInPlayerId: '', minute: '' })}
              desktopStyles={desktopStyles}
              isMobile={false}
            />
          )}

          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <LineupColumn
                team={selectedMatch?.doiNha}
                isHome={true}
                events={selectedMatch?.suKien}
                starterCount={starterCount}
                activePlayerPopover={activePlayerPopover}
                activeActionMenu={activeActionMenu}
                calculateCurrentRoster={calculateCurrentRoster}
                onActionClick={onActionClick}
                onSetActivePlayerPopover={setActivePlayerPopover}
                onSetActiveActionMenu={setActiveActionMenu}
                onOpenQuickAdd={(teamId: string) => setQuickAddPlayerModalState({ isOpen: true, teamId, teamName: selectedMatch?.doiNha?.ten || '', name: '', jerseyNumber: '', isSaving: false })}
                onOpenPcSub={(teamId: string, player: any) => setPcSubModalState({ isOpen: true, teamId, subOutPlayer: player, subInPlayerId: '', minute: '' })}
                desktopStyles={mobileStyles}
                isMobile={true}
              />
              <LineupColumn
                team={selectedMatch?.doiKhach}
                isHome={false}
                events={selectedMatch?.suKien}
                starterCount={starterCount}
                activePlayerPopover={activePlayerPopover}
                activeActionMenu={activeActionMenu}
                calculateCurrentRoster={calculateCurrentRoster}
                onActionClick={onActionClick}
                onSetActivePlayerPopover={setActivePlayerPopover}
                onSetActiveActionMenu={setActiveActionMenu}
                onOpenQuickAdd={(teamId: string) => setQuickAddPlayerModalState({ isOpen: true, teamId, teamName: selectedMatch?.doiKhach?.ten || '', name: '', jerseyNumber: '', isSaving: false })}
                onOpenPcSub={(teamId: string, player: any) => setPcSubModalState({ isOpen: true, teamId, subOutPlayer: player, subInPlayerId: '', minute: '' })}
                desktopStyles={mobileStyles}
                isMobile={true}
              />
            </div>
          )}
        </div>
      )}

      <QuickAddPlayerModal
        isOpen={quickAddPlayerModalState.isOpen}
        teamName={quickAddPlayerModalState.teamName}
        name={quickAddPlayerModalState.name}
        jerseyNumber={quickAddPlayerModalState.jerseyNumber}
        isSaving={quickAddPlayerModalState.isSaving}
        onClose={() => setQuickAddPlayerModalState(prev => ({ ...prev, isOpen: false }))}
        onNameChange={val => setQuickAddPlayerModalState(prev => ({ ...prev, name: val }))}
        onJerseyNumberChange={val => setQuickAddPlayerModalState(prev => ({ ...prev, jerseyNumber: val }))}
        onSave={handleSaveQuickPlayer}
      />

      <ActionWizardModal
        isOpen={pcSubModalState.isOpen}
        teamId={pcSubModalState.teamId}
        subOutPlayer={pcSubModalState.subOutPlayer}
        subInPlayerId={pcSubModalState.subInPlayerId}
        minute={pcSubModalState.minute}
        selectedMatch={selectedMatch}
        starterCount={starterCount}
        calculateCurrentRoster={calculateCurrentRoster}
        onClose={() => setPcSubModalState(prev => ({ ...prev, isOpen: false, subInPlayerId: '', minute: '' }))}
        onSubInPlayerChange={id => setPcSubModalState(prev => ({ ...prev, subInPlayerId: id }))}
        onMinuteChange={val => setPcSubModalState(prev => ({ ...prev, minute: val }))}
        onConfirm={(subInPlayer) => {
          handleExecuteSubstitution(subInPlayer, pcSubModalState.subOutPlayer, pcSubModalState.teamId, pcSubModalState.minute || selectedMatch?.phut || 0);
          setPcSubModalState(prev => ({ ...prev, isOpen: false, subInPlayerId: '', minute: '' }));
        }}
      />
    </div>
  );
}
