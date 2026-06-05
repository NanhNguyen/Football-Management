import React, { useState, useEffect } from 'react';
import TeamLogo from '@/components/TeamLogo';

interface RefereeTabProps {
  styles: any;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
  refereeFilterVong: string;
  setRefereeFilterVong: (val: string) => void;
  refereeFilterBang: string;
  setRefereeFilterBang: (val: string) => void;
  uniqueRounds: string[];
  uniqueGroups: string[];
  isKnockoutActive: boolean;
  filteredAndSortedRefereeMatches: any[];
  calculateMatchMinute: (match: any) => number;
  formatMatchTime: (match: any) => string;
  selectedMatch: any;
  starterCount: number;
  calculateCurrentRoster: (team: any, suKien: any[], limit: number) => { starters: any[]; bench: any[] };
  pendingSubOut: any;
  setPendingSubOut: (val: any) => void;
  handleExecuteSubstitution: (inPlayer: any, outPlayer: any, teamId: string) => void;
  setActivePlayerParams: (val: any) => void;
  activePlayerParams: any;
  customEvents: any[];
  handleStartMatch: (id: string) => void;
  handleTemporaryPauseToggle: (id: string) => void;
  handlePauseMatch: (id: string) => void;
  handleResumeMatch: (id: string) => void;
  handleFinishMatch: (id: string) => void;
  handleResetMatch: (id: string) => void;
  handleDeleteEvent: (evtId: string, type: string, points?: number, isIndividual?: boolean, playerId?: string) => void;
  isSelectingSubstitute: boolean;
  setIsSelectingSubstitute: (val: boolean) => void;
  handleActionSelect: (type: string, detail?: string, overrideParams?: any) => void;
  getMatchHalfState: (match: any) => '1_not_started' | '1_active' | 'half_time' | '2_active' | 'finished';
}

export default function RefereeTab({
  styles,
  selectedMatchId,
  setSelectedMatchId,
  refereeFilterVong,
  setRefereeFilterVong,
  refereeFilterBang,
  setRefereeFilterBang,
  uniqueRounds,
  uniqueGroups,
  isKnockoutActive,
  filteredAndSortedRefereeMatches,
  calculateMatchMinute,
  formatMatchTime,
  selectedMatch,
  starterCount,
  calculateCurrentRoster,
  handleExecuteSubstitution,
  customEvents,
  handleStartMatch,
  handleTemporaryPauseToggle,
  handlePauseMatch,
  handleResumeMatch,
  handleFinishMatch,
  handleResetMatch,
  handleDeleteEvent,
  handleActionSelect,
  getMatchHalfState
}: RefereeTabProps) {

  const [wizardState, setWizardState] = useState<{
    isOpen: boolean;
    action: 'goal' | 'card' | 'sub' | 'custom' | 'motm' | null;
    customActionId?: string;
    teamId: string;
    subType: string; // 'normal' | 'pen' | 'og' | 'yellow' | 'red'
    step: 1 | 2; // For substitution
    subOutPlayer?: any;
  }>({
    isOpen: false,
    action: null,
    teamId: '',
    subType: 'normal',
    step: 1
  });

  useEffect(() => {
    // When match changes, ensure wizard resets
    if (selectedMatch) {
      setWizardState(prev => ({ ...prev, isOpen: false, teamId: selectedMatch.doiNha?.id || '' }));
    }
  }, [selectedMatch]);

  const openWizard = (action: 'goal' | 'card' | 'sub' | 'custom' | 'motm', subType: string = 'normal', customId?: string) => {
    if (!selectedMatch) return;
    setWizardState({
      isOpen: true,
      action,
      teamId: selectedMatch.doiNha?.id,
      subType,
      customActionId: customId,
      step: 1,
      subOutPlayer: undefined
    });
  };

  const closeWizard = () => {
    setWizardState(prev => ({ ...prev, isOpen: false }));
  };

  const handlePlayerSelect = (player: any) => {
    if (!selectedMatch) return;

    if (wizardState.action === 'sub') {
      if (wizardState.step === 1) {
        // Selected player to sub out. Now show bench to select player in.
        setWizardState(prev => ({ ...prev, step: 2, subOutPlayer: player }));
      } else {
        // Selected player to sub in. Execute sub.
        handleExecuteSubstitution(player, wizardState.subOutPlayer, wizardState.teamId);
        closeWizard();
      }
    } else {
      // Goal, Card, Custom
      const overrideParams = {
        matchId: selectedMatch.id,
        teamId: wizardState.teamId,
        player
      };
      
      let detail = wizardState.subType;
      if (wizardState.action === 'custom') detail = wizardState.customActionId || '';

      handleActionSelect(wizardState.action!, detail, overrideParams);
      closeWizard();
    }
  };

  return (
    <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>
      {!selectedMatchId ? (
        <div className={styles.content}>
          <h2 className={styles.pageTitle}>Trung tâm Điều khiển</h2>
          <p className={styles.pageDesc}>Chọn một trận đấu để bắt đầu điều khiển và cập nhật tỉ số</p>

          {/* Referee Filter Bar */}
          <div className={styles.refereeFilterBar}>
            <div className={styles.refereeFilterItem}>
              <label className={styles.refereeFilterLabel}>Vòng đấu</label>
              <select
                className={styles.refereeFilterSelect}
                value={refereeFilterVong}
                onChange={(e) => {
                  setRefereeFilterVong(e.target.value);
                  setRefereeFilterBang('all'); // Reset group filter when round changes
                }}
              >
                <option value="all">Tất cả các vòng</option>
                {uniqueRounds.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {!isKnockoutActive && uniqueGroups.length > 0 && (
              <div className={styles.refereeFilterItem}>
                <label className={styles.refereeFilterLabel}>Bảng đấu</label>
                <select
                  className={styles.refereeFilterSelect}
                  value={refereeFilterBang}
                  onChange={(e) => setRefereeFilterBang(e.target.value)}
                >
                  <option value="all">Tất cả các bảng</option>
                  {uniqueGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.adminMatchList}>
            {filteredAndSortedRefereeMatches.length > 0 ? (
              filteredAndSortedRefereeMatches.map(m => (
                <div
                  key={m.id}
                  className={`${styles.adminMatchItem} ${m.trangThai === 'DANG_DIEN_RA' ? styles.adminMatchItemLive : ''}`}
                  onClick={() => setSelectedMatchId(m.id)}
                >
                  <div className={styles.matchListInfo}>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, width: '80px' }}>{m.vong}</span>
                    <div className={styles.listTeam}>
                      <span style={{ display: 'flex' }}><TeamLogo logo={m.doiNha?.logo} /></span>
                      <span style={{ fontWeight: 700 }}>{m.doiNha?.ten || 'Chờ xác định'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontWeight: 800, fontSize: '18px', width: '60px', justifyContent: 'center' }}>
                      <span>{m.tyNha}</span>
                      <span>-</span>
                      <span>{m.tyKhach}</span>
                    </div>
                    <div className={styles.listTeam}>
                      <span style={{ display: 'flex' }}><TeamLogo logo={m.doiKhach?.logo} /></span>
                      <span style={{ fontWeight: 700 }}>{m.doiKhach?.ten || 'Chờ xác định'}</span>
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
              ))
            ) : (
              <div className={styles.consoleEmptyRoster} style={{ padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                Không tìm thấy trận đấu nào thỏa mãn bộ lọc.
              </div>
            )}
          </div>
        </div>
      ) : selectedMatch && (
        <div className={styles.liveConsole}>
          {/* TOP BAR */}
          <div className={styles.consoleTopBar} style={{ marginBottom: 0, paddingBottom: '16px' }}>
            <button className={styles.consoleBackBtn} onClick={() => setSelectedMatchId(null)}>
              ← Trở về
            </button>
            <div className={styles.consoleMatchMeta}>
              <span className={styles.consoleVong}>{selectedMatch.vong}</span>
              {selectedMatch.trangThai === 'DANG_DIEN_RA' && (
                <div className={styles.consoleLiveBadge}>
                  <span className={styles.liveDot}></span>
                  LIVE - HIỆP {selectedMatch.hiepHienTai || 1}
                </div>
              )}
              {selectedMatch.trangThai === 'KET_THUC' && (
                <span className={styles.consoleFinishedBadge}>ĐÃ KẾT THÚC</span>
              )}
            </div>
          </div>

          {/* 1. STICKY SCOREBOARD */}
          <div className={styles.stickyScoreboard}>
            <div className={styles.consoleCentralHeaderCard} style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              <div className={styles.consoleCentralTeam}>
                <span className={styles.consoleCentralLogo} style={{ display: 'flex', width: '40px', height: '40px' }}><TeamLogo logo={selectedMatch.doiNha?.logo} /></span>
                <span className={styles.consoleCentralName}>{selectedMatch.doiNha?.ten}</span>
              </div>

              <div className={styles.consoleCentralScoreWrapper}>
                <div className={styles.consoleCentralScore}>
                  <span className={styles.consoleCentralBigScore}>{selectedMatch.tyNha}</span>
                  <span className={styles.consoleCentralScoreSep}>:</span>
                  <span className={styles.consoleCentralBigScore}>{selectedMatch.tyKhach}</span>
                </div>
              </div>

              <div className={styles.consoleCentralTeam}>
                <span className={styles.consoleCentralLogo} style={{ display: 'flex', width: '40px', height: '40px' }}><TeamLogo logo={selectedMatch.doiKhach?.logo} /></span>
                <span className={styles.consoleCentralName}>{selectedMatch.doiKhach?.ten}</span>
              </div>
            </div>

            <div className={styles.consoleCentralTimerWrapper} style={{ marginTop: '12px' }}>
              <div className={styles.consoleCentralTimer}>
                ⏱️ {formatMatchTime(selectedMatch)}
              </div>
              <div className={styles.consoleCentralHalfLabel}>
                Hiệp {selectedMatch.hiepHienTai || 1}
              </div>
            </div>
          </div>

          {/* MAIN FIELD CONTROLLER (MOBILE FIRST) */}
          <div style={{ padding: '0 16px' }}>
            
            {/* MATCH STATE MACHINE MAIN CTA (START / PAUSE / RESUME) */}
            <div className={styles.consoleMainCtaWrapper} style={{ marginBottom: '24px' }}>
              {getMatchHalfState(selectedMatch) === '1_not_started' && (
                <button className={`${styles.consoleMainCta} ${styles.ctaStartH1}`} onClick={() => handleStartMatch(selectedMatch.id)}>
                  🟢 BẮT ĐẦU HIỆP 1
                </button>
              )}

              {getMatchHalfState(selectedMatch) === '1_active' && (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button className={styles.consoleMainCta} style={{ background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb' }} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                    {selectedMatch.dangTamDung ? '▶ TIẾP TỤC' : '⏸ TẠM DỪNG'}
                  </button>
                  <button className={`${styles.consoleMainCta} ${styles.ctaEndH1}`} onClick={() => handlePauseMatch(selectedMatch.id)}>
                    ⏸ HẾT H1
                  </button>
                </div>
              )}

              {getMatchHalfState(selectedMatch) === 'half_time' && (
                <>
                  <span className={styles.halfTimeOverlayText}>Đang nghỉ giữa hiệp</span>
                  <button className={`${styles.consoleMainCta} ${styles.ctaStartH2}`} onClick={() => handleResumeMatch(selectedMatch.id)}>
                    🟢 BẮT ĐẦU HIỆP 2
                  </button>
                </>
              )}

              {getMatchHalfState(selectedMatch) === '2_active' && (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button className={styles.consoleMainCta} style={{ background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb' }} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                    {selectedMatch.dangTamDung ? '▶ TIẾP TỤC' : '⏸ TẠM DỪNG'}
                  </button>
                  <button className={`${styles.consoleMainCta} ${styles.ctaEndMatch}`} onClick={() => handleFinishMatch(selectedMatch.id)}>
                    🟥 KẾT THÚC
                  </button>
                </div>
              )}

              {getMatchHalfState(selectedMatch) === 'finished' && (
                <button className={`${styles.consoleMainCta} ${styles.ctaReset}`} onClick={() => handleResetMatch(selectedMatch.id)}>
                  🔄 THIẾT LẬP LẠI
                </button>
              )}
            </div>

            {/* 2. HUGE ACTION BUTTONS (EVENT WIZARD FLOW) */}
            <div className={styles.mobileMainActionArea}>
              <button 
                className={`${styles.hugeActionBtn} ${styles.hugeActionGoal}`}
                onClick={() => openWizard('goal')}
                disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC'}
                style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC') ? 0.5 : 1 }}
              >
                <span className={styles.hugeActionIcon}>⚽</span>
                <span>Bàn thắng</span>
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button 
                  className={`${styles.hugeActionBtn} ${styles.hugeActionCard}`}
                  onClick={() => openWizard('card')}
                  disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC'}
                  style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC') ? 0.5 : 1 }}
                >
                  <span className={styles.hugeActionIcon}>🟨/🟥</span>
                  <span>Thẻ phạt</span>
                </button>

                <button 
                  className={`${styles.hugeActionBtn} ${styles.hugeActionSub}`}
                  onClick={() => openWizard('sub')}
                  disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC'}
                  style={{ opacity: (selectedMatch.trangThai !== 'DANG_DIEN_RA' && selectedMatch.trangThai !== 'KET_THUC') ? 0.5 : 1 }}
                >
                  <span className={styles.hugeActionIcon}>🔄</span>
                  <span>Thay người</span>
                </button>
              </div>
            </div>

            {/* SECONDARY ACTION BUTTONS (CUSTOM EVENTS & MOTM) */}
            {(customEvents.length > 0 || selectedMatch.trangThai === 'KET_THUC') && (
              <div className={styles.mobileSecondaryActionArea}>
                {selectedMatch.trangThai === 'KET_THUC' && (
                  <button 
                    className={styles.secondaryActionBtn} 
                    onClick={() => openWizard('motm', 'normal')}
                    style={{ gridColumn: '1 / -1', background: '#faf5ff', borderColor: '#c084fc', color: '#7e22ce' }}
                  >
                    🏅 Bầu xuất sắc nhất (MOTM)
                  </button>
                )}
                {customEvents.map((evt) => (
                  <button 
                    key={evt.id} 
                    className={styles.secondaryActionBtn}
                    onClick={() => openWizard('custom', 'normal', evt.id)}
                    disabled={selectedMatch.trangThai !== 'DANG_DIEN_RA'}
                  >
                    <span>{evt.icon}</span> {evt.name} {evt.points ? `(+${evt.points})` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* 3. EVENT TIMELINE LOG (COMPACT) */}
            <div className={styles.consoleEventLog}>
              <div className={styles.consoleEventLogTitle}>NHẬT KÝ SỰ KIỆN</div>
              <div className={styles.consoleEventLogList}>
                {(!selectedMatch.suKien || selectedMatch.suKien.length === 0) ? (
                  <div className={styles.consoleEventEmpty}>Chưa ghi nhận sự kiện nào</div>
                ) : (
                  selectedMatch.suKien.slice().sort((a: any, b: any) => b.phut - a.phut || b.id.localeCompare(a.id)).slice(0, 5).map((ev: any) => {
                    const pointsLabel = ev.diemCong ? ` (${ev.diemCong > 0 ? '+' : ''}${ev.diemCong}đ)` : '';
                    return (
                      <div key={ev.id} className={styles.consoleEventRow}>
                        <span className={styles.consoleEventMin}>{ev.phut || 0}&apos;</span>
                        <span className={styles.consoleEventDesc}>
                          {ev.teamId === selectedMatch.doiNha?.id ? '🏠 ' : '✈️ '}
                          <strong>{ev.cauThu?.ten || 'Cầu thủ'}</strong> ({ev.moTa || ev.loai}){pointsLabel}
                        </span>
                        <button
                          className={styles.consoleUndoBtn}
                          onClick={() => handleDeleteEvent(ev.id, ev.loai, ev.diemCong, ev.isIndividual, ev.cauThuId)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
                {selectedMatch.suKien?.length > 5 && (
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    Hiển thị 5 sự kiện gần nhất...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET WIZARD OVERLAY */}
      {wizardState.isOpen && selectedMatch && (
        <div className={styles.mobileBottomSheetOverlay} onClick={closeWizard}>
          <div className={styles.mobileBottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle}></div>
            
            <div className={styles.bsHeaderTitle}>
              {wizardState.action === 'goal' && '⚽ XÁC NHẬN BÀN THẮNG'}
              {wizardState.action === 'card' && '🟨/🟥 XÁC NHẬN THẺ PHẠT'}
              {wizardState.action === 'sub' && (wizardState.step === 1 ? '🔄 CHỌN NGƯỜI RA SÂN' : '🔄 CHỌN NGƯỜI VÀO SÂN')}
              {wizardState.action === 'custom' && '✨ GHI NHẬN SỰ KIỆN'}
              {wizardState.action === 'motm' && '🏅 BẦU MVP'}
            </div>

            {/* TEAM SEGMENTED CONTROL */}
            {wizardState.step === 1 && wizardState.action !== 'motm' && (
              <div className={styles.segmentedControl}>
                <button 
                  className={`${styles.segmentBtn} ${wizardState.teamId === selectedMatch.doiNha?.id ? styles.segmentBtnActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, teamId: selectedMatch.doiNha?.id }))}
                >
                  🏠 {selectedMatch.doiNha?.ten}
                </button>
                <button 
                  className={`${styles.segmentBtn} ${wizardState.teamId === selectedMatch.doiKhach?.id ? styles.segmentBtnActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, teamId: selectedMatch.doiKhach?.id }))}
                >
                  ✈️ {selectedMatch.doiKhach?.ten}
                </button>
              </div>
            )}

            {/* ACTION CHIPS FOR SPECIFIC TYPES */}
            {wizardState.action === 'goal' && (
              <div className={styles.actionOptionsChips}>
                <button 
                  className={`${styles.actionChip} ${wizardState.subType === 'normal' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'normal' }))}
                >Bàn thắng thường</button>
                <button 
                  className={`${styles.actionChip} ${wizardState.subType === 'pen' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'pen' }))}
                >Penalty</button>
                <button 
                  className={`${styles.actionChip} ${wizardState.subType === 'og' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'og' }))}
                >Phản lưới nhà</button>
              </div>
            )}
            
            {wizardState.action === 'card' && (
              <div className={styles.actionOptionsChips} style={{ justifyContent: 'center' }}>
                <button 
                  className={`${styles.actionChip} ${wizardState.subType === 'yellow' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'yellow' }))}
                  style={wizardState.subType === 'yellow' ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
                >🟨 Thẻ Vàng</button>
                <button 
                  className={`${styles.actionChip} ${wizardState.subType === 'red' ? styles.actionChipActive : ''}`}
                  onClick={() => setWizardState(prev => ({ ...prev, subType: 'red' }))}
                  style={wizardState.subType === 'red' ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
                >🟥 Thẻ Đỏ</button>
              </div>
            )}

            {/* PLAYER LIST */}
            <div className={styles.mobilePlayerList}>
              {(() => {
                const team = wizardState.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
                
                // Determine which list to show based on action
                let listToShow = starters;
                if (wizardState.action === 'sub') {
                  listToShow = wizardState.step === 1 ? starters : bench;
                } else if (wizardState.action === 'motm') {
                  // For MOTM show everyone from both teams
                  const homePlayers = selectedMatch.doiNha?.cauThu || [];
                  const awayPlayers = selectedMatch.doiKhach?.cauThu || [];
                  return [...homePlayers, ...awayPlayers].map(p => (
                    <button key={p.id} className={styles.mobilePlayerItem} onClick={() => handlePlayerSelect(p)}>
                      <div className={styles.mobilePlayerNo}>{p.soAo}</div>
                      <div className={styles.mobilePlayerInfo}>
                        <div className={styles.mobilePlayerName}>{p.ten}</div>
                        <div className={styles.mobilePlayerMeta}>{p.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha?.ten : selectedMatch.doiKhach?.ten}</div>
                      </div>
                    </button>
                  ));
                }

                if (!listToShow || listToShow.length === 0) {
                  return <div className={styles.consoleEmptyRoster}>Không có cầu thủ nào</div>;
                }

                return listToShow.map((player: any) => {
                  const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                  const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                  const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;

                  // Disabled logic
                  const isRedCarded = hasRedCard;
                  const disabled = isRedCarded && wizardState.action !== 'sub'; // Can't score/card red carded, but maybe can sub out? Actually, red carded players usually can't be subbed out. Let's disable them.

                  return (
                    <button 
                      key={player.id} 
                      className={styles.mobilePlayerItem}
                      onClick={() => handlePlayerSelect(player)}
                      disabled={disabled || (isRedCarded && wizardState.action === 'sub')}
                      style={{ opacity: disabled || (isRedCarded && wizardState.action === 'sub') ? 0.5 : 1 }}
                    >
                      <div className={styles.mobilePlayerNo}>{player.soAo}</div>
                      <div className={styles.mobilePlayerInfo}>
                        <div className={styles.mobilePlayerName}>{player.ten}</div>
                        <div className={styles.mobilePlayerBadges}>
                           {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}⚽</span>}
                           {yellowCount > 0 && <span>{yellowCount > 1 ? yellowCount : ''}🟨</span>}
                           {hasRedCard && <span>🟥</span>}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
