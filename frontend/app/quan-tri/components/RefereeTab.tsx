import React, { Fragment } from 'react';
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
  handleActionSelect: (type: string, detail?: string) => void;
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
  pendingSubOut,
  setPendingSubOut,
  handleExecuteSubstitution,
  setActivePlayerParams,
  activePlayerParams,
  customEvents,
  handleStartMatch,
  handleTemporaryPauseToggle,
  handlePauseMatch,
  handleResumeMatch,
  handleFinishMatch,
  handleResetMatch,
  handleDeleteEvent,
  isSelectingSubstitute,
  setIsSelectingSubstitute,
  handleActionSelect,
  getMatchHalfState
}: RefereeTabProps) {
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
          <div className={styles.consoleTopBar}>
            <button className={styles.consoleBackBtn} onClick={() => setSelectedMatchId(null)}>
              ← Danh sách
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

          {/* MAIN FIELD CONTROLLER */}
          <div className={styles.consoleMainArea}>
            {/* LEFT — Home Roster */}
            <div className={styles.consoleSideRoster}>
              <div className={styles.consoleRosterHeader}>
                <TeamLogo logo={selectedMatch.doiNha?.logo} />
                <h3>{selectedMatch.doiNha?.ten}</h3>
                {pendingSubOut && pendingSubOut.teamId === selectedMatch.doiNha.id && (
                  <button className={styles.consoleSubCancelBtn} onClick={() => setPendingSubOut(null)}>Hủy thay người</button>
                )}
              </div>
              <div className={styles.consoleRosterList}>
                {selectedMatch.doiNha?.cauThu?.length === 0 ? (
                  <div className={styles.consoleEmptyRoster}>Chưa có cầu thủ đăng ký</div>
                ) : (
                  (() => {
                    const { starters, bench } = calculateCurrentRoster(selectedMatch.doiNha, selectedMatch.suKien, starterCount);
                    const renderPlayer = (player: any, isBench: boolean) => {
                      const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                      const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                      const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                      const customEventCounts = customEvents.map(evt => ({
                        ...evt,
                        count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                      }));
                      const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                      const isClickable = !hasRedCard && (selectedMatch.trangThai === 'DANG_DIEN_RA' || selectedMatch.trangThai === 'KET_THUC');

                      const isPendingSub = pendingSubOut?.player?.id === player.id;
                      const isOtherPending = pendingSubOut && pendingSubOut.teamId === selectedMatch.doiNha.id && !isPendingSub;
                      const dimClass = isOtherPending && !isBench ? styles.consolePlayerDimmed : '';
                      const highlightClass = pendingSubOut && isBench && pendingSubOut.teamId === selectedMatch.doiNha.id ? styles.consolePlayerHighlighted : '';
                      const benchClass = isBench ? styles.consolePlayerBench : '';

                      const handleClick = () => {
                        if (!isClickable) return;
                        if (pendingSubOut) {
                          if (pendingSubOut.teamId !== selectedMatch.doiNha.id) return;
                          if (isPendingSub) {
                            setPendingSubOut(null); // Cancel
                          } else if (isBench) {
                            handleExecuteSubstitution(player, pendingSubOut.player, pendingSubOut.teamId);
                          }
                        } else {
                          setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiNha.id, player, isBench });
                        }
                      };

                      return (
                        <button
                          key={player.id}
                          className={`${styles.consolePlayerBtn} ${benchClass} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''} ${dimClass} ${highlightClass}`}
                          onClick={handleClick}
                          disabled={!isClickable && !isPendingSub}
                        >
                          <div className={styles.consolePlayerNo}>{player.soAo}</div>
                          <div className={styles.consolePlayerName}>{player.ten || 'Chưa đặt tên'}</div>

                          {/* Action Badges */}
                          <div className={styles.consolePlayerBadges}>
                            {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                            {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.count > 1 ? cEvt.count : ''}{cEvt.icon}</span> : null)}
                            {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                            {hasRedCard && <span>R</span>}
                            {isMotm && <span>MVP</span>}
                          </div>
                        </button>
                      );
                    };
                    return (
                      <>
                        <div className={styles.rosterHeader}>🏟️ ĐỘI HÌNH CHÍNH</div>
                        {starters.map(p => renderPlayer(p, false))}

                        <div className={styles.rosterHeader} style={{ marginTop: '20px', color: '#64748b', borderColor: '#cbd5e1' }}>🔄 CẦU THỦ DỰ BỊ</div>
                        <div className={styles.benchListView}>
                          {bench.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px 12px', margin: 0, gridColumn: '1 / -1' }}>Không có cầu thủ dự bị</p>
                          ) : (
                            bench.map((player: any) => {
                              const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                              const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                              const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                              const customEventCounts = customEvents.map(evt => ({
                                ...evt,
                                count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                              }));
                              const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);

                              return (
                                <div key={player.id} className={styles.benchListRow}>
                                  <span className={styles.benchListNo}>#{player.soAo}</span>
                                  <span className={styles.benchListName}>{player.ten}</span>

                                  <div className={styles.benchListBadges}>
                                    {goalCount > 0 && <span title="Bàn thắng">⚽ {goalCount > 1 ? goalCount : ''}</span>}
                                    {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.icon} {cEvt.count > 1 ? cEvt.count : ''}</span> : null)}
                                    {yellowCount > 0 && <span style={{ background: '#fef08a', color: '#a16207' }} title="Thẻ vàng">🟨 {yellowCount > 1 ? yellowCount : ''}</span>}
                                    {hasRedCard && <span style={{ background: '#fee2e2', color: '#b91c1c' }} title="Thẻ đỏ">🟥</span>}
                                    {isMotm && <span style={{ background: '#faf5ff', color: '#7e22ce' }}>🏅 MVP</span>}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>

            {/* CENTER — Scoreboard + Event Log */}
            <div className={styles.consoleCenterPanel}>
              {/* Score display */}
              <div className={styles.consoleScoreCard}>
                <div className={styles.consoleScoreRow}>
                  <span className={styles.consoleScore}>{selectedMatch.tyNha}</span>
                  <span className={styles.consoleScoreColon}>:</span>
                  <span className={styles.consoleScore}>{selectedMatch.tyKhach}</span>
                </div>
                <div className={styles.consoleTimer}>
                  ⏱️ {formatMatchTime(selectedMatch)}
                </div>

                {/* Sequential Match State Machine Main CTA */}
                <div className={styles.consoleMainCtaWrapper}>
                  {getMatchHalfState(selectedMatch) === '1_not_started' && (
                    <button
                      className={`${styles.consoleMainCta} ${styles.ctaStartH1}`}
                      onClick={() => handleStartMatch(selectedMatch.id)}
                    >
                      🟢 BẮT ĐẦU HIỆP 1
                    </button>
                  )}

                  {getMatchHalfState(selectedMatch) === '1_active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <button
                        className={styles.consoleMainCta}
                        style={{
                          background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb',
                          boxShadow: selectedMatch.dangTamDung ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                        }}
                        onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
                      >
                        {selectedMatch.dangTamDung ? '▶ TIẾP TỤC TRẬN ĐẤU' : '⏸ TẠM DỪNG TRẬN ĐẤU'}
                      </button>
                      <button
                        className={`${styles.consoleMainCta} ${styles.ctaEndH1}`}
                        onClick={() => handlePauseMatch(selectedMatch.id)}
                      >
                        ⏸ KẾT THÚC HIỆP 1
                      </button>
                    </div>
                  )}

                  {getMatchHalfState(selectedMatch) === 'half_time' && (
                    <>
                      <span className={styles.halfTimeOverlayText}>Đang nghỉ giữa hiệp</span>
                      <button
                        className={`${styles.consoleMainCta} ${styles.ctaStartH2}`}
                        onClick={() => handleResumeMatch(selectedMatch.id)}
                      >
                        🟢 BẮT ĐẦU HIỆP 2
                      </button>
                    </>
                  )}

                  {getMatchHalfState(selectedMatch) === '2_active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <button
                        className={styles.consoleMainCta}
                        style={{
                          background: selectedMatch.dangTamDung ? '#10b981' : '#2563eb',
                          boxShadow: selectedMatch.dangTamDung ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                        }}
                        onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}
                      >
                        {selectedMatch.dangTamDung ? '▶ TIẾP TỤC TRẬN ĐẤU' : '⏸ TẠM DỪNG TRẬN ĐẤU'}
                      </button>
                      <button
                        className={`${styles.consoleMainCta} ${styles.ctaEndMatch}`}
                        onClick={() => handleFinishMatch(selectedMatch.id)}
                      >
                        🟥 KẾT THÚC TRẬN ĐẤU
                      </button>
                    </div>
                  )}

                  {getMatchHalfState(selectedMatch) === 'finished' && (
                    <button
                      className={`${styles.consoleMainCta} ${styles.ctaReset}`}
                      onClick={() => handleResetMatch(selectedMatch.id)}
                    >
                      🔄 THIẾT LẬP LẠI TRẬN ĐẤU
                    </button>
                  )}
                </div>
              </div>

              {/* Event Log */}
              <div className={styles.consoleEventLog}>
                <h4>BIÊN NIÊN SỰ KIỆN</h4>
                <div className={styles.eventLogList}>
                  {(!selectedMatch.suKien || selectedMatch.suKien.length === 0) ? (
                    <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>Chưa ghi nhận sự kiện nào trong trận đấu</p>
                  ) : (
                    selectedMatch.suKien.slice().sort((a: any, b: any) => b.phut - a.phut || b.id.localeCompare(a.id)).map((ev: any) => {
                      const pointsLabel = ev.diemCong ? ` (${ev.diemCong > 0 ? '+' : ''}${ev.diemCong}đ)` : '';
                      return (
                        <div key={ev.id} className={styles.eventLogRow}>
                          <span className={styles.eventLogTime}>{ev.phut || 0}'</span>
                          <span className={styles.eventLogText}>
                            {ev.teamId === selectedMatch.doiNha?.id ? '🏠 ' : '✈️ '}
                            <strong>{ev.cauThu?.ten || 'Cầu thủ'}</strong> ({ev.moTa || ev.loai}){pointsLabel}
                          </span>
                          <button
                            className={styles.eventLogDelete}
                            onClick={() => handleDeleteEvent(ev.id, ev.loai, ev.diemCong, ev.isIndividual, ev.cauThuId)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Away Roster */}
            <div className={styles.consoleSideRoster}>
              <div className={styles.consoleRosterHeader}>
                <TeamLogo logo={selectedMatch.doiKhach?.logo} />
                <h3>{selectedMatch.doiKhach?.ten}</h3>
                {pendingSubOut && pendingSubOut.teamId === selectedMatch.doiKhach.id && (
                  <button className={styles.consoleSubCancelBtn} onClick={() => setPendingSubOut(null)}>Hủy thay người</button>
                )}
              </div>
              <div className={styles.consoleRosterList}>
                {selectedMatch.doiKhach?.cauThu?.length === 0 ? (
                  <div className={styles.consoleEmptyRoster}>Chưa có cầu thủ đăng ký</div>
                ) : (
                  (() => {
                    const { starters, bench } = calculateCurrentRoster(selectedMatch.doiKhach, selectedMatch.suKien, starterCount);
                    const renderPlayer = (player: any, isBench: boolean) => {
                      const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                      const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                      const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                      const customEventCounts = customEvents.map(evt => ({
                        ...evt,
                        count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                      }));
                      const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);
                      const isClickable = !hasRedCard && (selectedMatch.trangThai === 'DANG_DIEN_RA' || selectedMatch.trangThai === 'KET_THUC');

                      const isPendingSub = pendingSubOut?.player?.id === player.id;
                      const isOtherPending = pendingSubOut && pendingSubOut.teamId === selectedMatch.doiKhach.id && !isPendingSub;
                      const dimClass = isOtherPending && !isBench ? styles.consolePlayerDimmed : '';
                      const highlightClass = pendingSubOut && isBench && pendingSubOut.teamId === selectedMatch.doiKhach.id ? styles.consolePlayerHighlighted : '';
                      const benchClass = isBench ? styles.consolePlayerBench : '';

                      const handleClick = () => {
                        if (!isClickable) return;
                        if (pendingSubOut) {
                          if (pendingSubOut.teamId !== selectedMatch.doiKhach.id) return;
                          if (isPendingSub) {
                            setPendingSubOut(null); // Cancel
                          } else if (isBench) {
                            handleExecuteSubstitution(player, pendingSubOut.player, pendingSubOut.teamId);
                          }
                        } else {
                          setActivePlayerParams({ matchId: selectedMatch.id, teamId: selectedMatch.doiKhach.id, player, isBench });
                        }
                      };

                      return (
                        <button
                          key={player.id}
                          className={`${styles.consolePlayerBtn} ${benchClass} ${hasRedCard ? styles.consolePlayerRedCarded : ''} ${isClickable ? styles.consolePlayerActive : ''} ${dimClass} ${highlightClass}`}
                          onClick={handleClick}
                          disabled={!isClickable && !isPendingSub}
                        >
                          <div className={styles.consolePlayerNo}>{player.soAo}</div>
                          <div className={styles.consolePlayerName}>{player.ten || 'Chưa đặt tên'}</div>

                          {/* Action Badges */}
                          <div className={styles.consolePlayerBadges}>
                            {goalCount > 0 && <span>{goalCount > 1 ? goalCount : ''}&#x26BD;</span>}
                            {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.count > 1 ? cEvt.count : ''}{cEvt.icon}</span> : null)}
                            {yellowCount > 0 && <span>Y{yellowCount > 1 ? yellowCount : ''}</span>}
                            {hasRedCard && <span>R</span>}
                            {isMotm && <span>MVP</span>}
                          </div>
                        </button>
                      );
                    };
                    return (
                      <>
                        <div className={styles.rosterHeader}>🏟️ ĐỘI HÌNH CHÍNH</div>
                        {starters.map(p => renderPlayer(p, false))}

                        <div className={styles.rosterHeader} style={{ marginTop: '20px', color: '#64748b', borderColor: '#cbd5e1' }}>🔄 CẦU THỦ DỰ BỊ</div>
                        <div className={styles.benchListView}>
                          {bench.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#94a3b8', padding: '8px 12px', margin: 0, gridColumn: '1 / -1' }}>Không có cầu thủ dự bị</p>
                          ) : (
                            bench.map((player: any) => {
                              const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === player.id).length || 0;
                              const hasRedCard = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === player.id) || yellowCount >= 2;
                              const goalCount = selectedMatch.suKien?.filter((ev: any) => ev.loai.startsWith('GOAL_') && ev.loai !== 'GOAL_OG' && ev.cauThuId === player.id).length || 0;
                              const customEventCounts = customEvents.map(evt => ({
                                ...evt,
                                count: selectedMatch.suKien?.filter((ev: any) => ev.loai === `CUSTOM_${evt.id.toUpperCase()}` && ev.cauThuId === player.id).length || 0
                              }));
                              const isMotm = selectedMatch.suKien?.some((ev: any) => ev.loai === 'MOTM' && ev.cauThuId === player.id);

                              return (
                                <div key={player.id} className={styles.benchListRow}>
                                  <span className={styles.benchListNo}>#{player.soAo}</span>
                                  <span className={styles.benchListName}>{player.ten}</span>

                                  <div className={styles.benchListBadges}>
                                    {goalCount > 0 && <span title="Bàn thắng">⚽ {goalCount > 1 ? goalCount : ''}</span>}
                                    {customEventCounts.map((cEvt: any) => cEvt.count > 0 ? <span key={cEvt.id} title={cEvt.name}>{cEvt.icon} {cEvt.count > 1 ? cEvt.count : ''}</span> : null)}
                                    {yellowCount > 0 && <span style={{ background: '#fef08a', color: '#a16207' }} title="Thẻ vàng">🟨 {yellowCount > 1 ? yellowCount : ''}</span>}
                                    {hasRedCard && <span style={{ background: '#fee2e2', color: '#b91c1c' }} title="Thẻ đỏ">🟥</span>}
                                    {isMotm && <span style={{ background: '#faf5ff', color: '#7e22ce' }}>🏅 MVP</span>}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET FOR ACTIONS */}
      {activePlayerParams && selectedMatch && (
        <div className={styles.bottomSheetOverlay} onClick={() => setActivePlayerParams(null)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={styles.bsPlayerNo}>#{activePlayerParams.player.soAo}</span>
                <div>
                  <h3 className={styles.bsPlayerName}>{activePlayerParams.player.ten}</h3>
                  <span className={styles.bsPlayerTeam}>{activePlayerParams.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha?.ten : selectedMatch.doiKhach?.ten}</span>
                </div>
              </div>
              <span className={styles.bsMinuteBadge}>⏱️ Phút {selectedMatch.phut || 0}</span>
            </div>

            {isSelectingSubstitute ? (
              <div className={styles.bottomSheetActionsGrid} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#64748b' }}>Chọn người {activePlayerParams.isBench ? 'được thay ra' : 'vào thay'}</div>
                {(() => {
                  const team = activePlayerParams.teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
                  const { starters, bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
                  const targetList = activePlayerParams.isBench ? starters : bench;

                  return targetList.map((p: any) => (
                    <button
                      key={p.id}
                      className={styles.bsActionCard}
                      onClick={() => {
                        if (activePlayerParams.isBench) {
                          handleExecuteSubstitution(activePlayerParams.player, p, activePlayerParams.teamId);
                        } else {
                          handleExecuteSubstitution(p, activePlayerParams.player, activePlayerParams.teamId);
                        }
                      }}
                      style={{ justifyContent: 'flex-start', padding: '12px' }}
                    >
                      <span style={{ marginRight: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{p.soAo}</span>
                      <span style={{ fontWeight: 600 }}>{p.ten}</span>
                    </button>
                  ));
                })()}
              </div>
            ) : (
              <div className={styles.bottomSheetActionsGrid}>
                {selectedMatch.trangThai === 'KET_THUC' ? (
                  <button
                    className={`${styles.bsActionCard} ${styles.bsMotm}`}
                    onClick={() => handleActionSelect('motm')}
                    style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #c084fc' }}
                  >
                    <span className={styles.bsActionIcon}>🏅</span>
                    <span className={styles.bsActionText} style={{ color: '#7e22ce', fontWeight: 700 }}>Chọn làm cầu thủ xuất sắc nhất (MOTM)</span>
                  </button>
                ) : (
                  <>
                    <button className={`${styles.bsActionCard} ${styles.bsSub}`} onClick={() => setIsSelectingSubstitute(true)}>
                      <span className={styles.bsActionIcon}>🔄</span>
                      <span className={styles.bsActionText}>{activePlayerParams.isBench ? 'Vào sân' : 'Thay ra'}</span>
                    </button>
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

                    {customEvents.map((evt) => (
                      <button key={evt.id} className={`${styles.bsActionCard} ${styles.bsChotDeal}`} onClick={() => handleActionSelect('custom', evt.id)}>
                        <span className={styles.bsActionIcon}>{evt.icon}</span>
                        <span className={styles.bsActionText}>{evt.name} {evt.points ? `(+${evt.points})` : ''}</span>
                      </button>
                    ))}

                    <button className={`${styles.bsActionCard} ${styles.bsYellow}`} onClick={() => handleActionSelect('card', 'yellow')}>
                      <span className={styles.bsActionIcon}>🟨</span>
                      <span className={styles.bsActionText}>Thẻ vàng</span>
                    </button>

                    <button className={`${styles.bsActionCard} ${styles.bsRed}`} onClick={() => handleActionSelect('card', 'red')}>
                      <span className={styles.bsActionIcon}>🟥</span>
                      <span className={styles.bsActionText}>Thẻ đỏ</span>
                    </button>
                  </>
                )}
              </div>
            )}

            <div style={{ padding: '16px 0 8px 0', marginTop: '12px' }}>
              <button className={styles.finishBtn} style={{ width: '100%', margin: 0, background: '#d71920', color: '#ffffff' }} onClick={() => setActivePlayerParams(null)}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
