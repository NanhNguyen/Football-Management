              {/* CENTER COLUMN: BẢNG ĐIỀU KHIỂN & NHẬT KÝ */}
              <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '32px', gap: '24px', maxHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                {/* Scoreboard Visual & Info */}
                <div style={{ ...desktopStyles.scoreboardCard, flexShrink: 0, padding: '24px' }}>
                  {/* Round & Timer (~15%) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={desktopStyles.roundHeader}>
                      <IconMedal size={16} /> {selectedMatch.vong}
                    </div>
                    <div style={desktopStyles.timerText(selectedMatch.trangThai === 'DANG_DIEN_RA')}>
                      <IconTimer size={20} /> {formatMatchTime(selectedMatch)} | {selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : (selectedMatch.trangThai === 'KET_THUC' ? 'KẾT THÚC' : 'CHƯA ĐÁ')}
                    </div>
                  </div>
                  
                  {/* Scoreboard Teams Row (~20%) */}
                  <div style={{ ...desktopStyles.scoreboardTeamsRow, marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#d8e4ff' }}>
                        {selectedMatch.doiNha?.ma || selectedMatch.doiNha?.ten?.toUpperCase()}
                      </span>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} />
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '52px', fontWeight: 800, color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? '#EF4444' : 'var(--color-text-heading, #0F172A)'), letterSpacing: '-2px', padding: '0 16px', lineHeight: 1 }}>
                        {selectedMatch.tyNha} - {selectedMatch.tyKhach}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : (selectedMatch.trangThai === 'KET_THUC' ? 'var(--color-success, #10b981)' : '#64748b') }}>
                          {selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : (selectedMatch.trangThai === 'KET_THUC' ? 'FT' : 'PRE-MATCH')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start', flex: 1 }}>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} />
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#d8e4ff' }}>
                        {selectedMatch.doiKhach?.ma || selectedMatch.doiKhach?.ten?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions (~15%) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
                    {/* Primary Action */}
                    <button 
                      onClick={() => setQuickAddState({ ...quickAddState, isOpen: true, teamId: selectedMatch.doiNha?.id || '' })}
                      style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', color: '#fff', fontWeight: 600, border: 'none', borderRadius: '10px', padding: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'filter 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                      onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      ⚡ NHẬP NHANH SỰ KIỆN
                    </button>

                    {/* Match Controls */}
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      {getMatchHalfState(selectedMatch) === '1_not_started' && (
                        <>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-success, #22C55E)')} onClick={() => handleStartMatch(selectedMatch.id)}>
                            <IconPlay size={18} /> BẮT ĐẦU HIỆP 1
                          </button>
                          {handleDelayMatchSchedule && (
                            <button className="desktop-cta-btn" style={{ ...desktopStyles.ctaButton('var(--color-warning, #F59E0B)'), flex: 0.5 }} onClick={() => setDelayModalState({ isOpen: true, date: selectedMatch.date || '', time: selectedMatch.time || '', strategy: 'single' })}>
                              <IconCalendar size={18} /> LÙI LỊCH
                            </button>
                          )}
                        </>
                      )}
                      {(getMatchHalfState(selectedMatch) === '1_active' || getMatchHalfState(selectedMatch) === '2_active') && (
                        <>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton(selectedMatch.dangTamDung ? 'var(--color-success, #22C55E)' : 'var(--color-primary, #0F766E)')} onClick={() => handleTemporaryPauseToggle(selectedMatch.id)}>
                            {selectedMatch.dangTamDung ? <><IconPlay size={18} /> TIẾP TỤC</> : <><IconPause size={18} /> TẠM DỪNG</>}
                          </button>
                          <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-warning, #F59E0B)')} onClick={() => getMatchHalfState(selectedMatch) === '1_active' ? handlePauseMatch(selectedMatch.id) : handleFinishMatch(selectedMatch.id)}>
                            <IconStop size={18} /> {getMatchHalfState(selectedMatch) === '1_active' ? 'HẾT HIỆP 1' : 'KẾT THÚC'}
                          </button>
                        </>
                      )}
                      {getMatchHalfState(selectedMatch) === 'half_time' && (
                        <button className="desktop-cta-btn" style={desktopStyles.ctaButton('var(--color-success, #22C55E)')} onClick={() => handleResumeMatch(selectedMatch.id)}>
                          <IconPlay size={18} /> BẮT ĐẦU HIỆP 2
                        </button>
                      )}
                    </div>

                    {/* Danger Action */}
                    {selectedMatch.trangThai !== 'SAP_DIEN_RA' && (
                      <button
                        onClick={() => {
                          if (window.confirm("Bạn có chắc muốn thiết lập lại trận đấu này không?\nHành động này không thể hoàn tác.")) {
                            handleResetMatch(selectedMatch.id);
                          }
                        }}
                        style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px', width: '100%', fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '4px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      >
                        THIẾT LẬP LẠI
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline (~50%) */}
                <div style={{ ...desktopStyles.timelineCard, flex: 1, overflowY: 'auto' }}>
                  <div style={desktopStyles.timelineHeader}>
                    <IconEvent size={16} /> Diễn biến trận đấu
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {(!selectedMatch.suKien || selectedMatch.suKien.length === 0) ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', fontSize: '14px' }}>Chưa có sự kiện nào</div>
                    ) : (
                      <div className="ref-timeline-container" style={{ flex: 1 }}>
                        {(() => {
                           const sortedEvents = selectedMatch.suKien ? selectedMatch.suKien.slice().sort((a: any, b: any) => a.phut - b.phut || a.id.localeCompare(b.id)) : [];
                           let homeScore = 0;
                           let awayScore = 0;
                           const eventsWithScores = sortedEvents.map((sk: any) => {
                             const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                             const isOwnGoal = sk.loai === 'GOAL_OG';
                             const isCustom = sk.loai?.startsWith('CUSTOM_');
                             let customScoreImpact: { enabled: boolean; value: number; side: 'own' | 'opponent' } | null = null;

                             if (isCustom) {
                               const code = sk.loai.replace('CUSTOM_', '');
                               const customEvt = customEvents?.find((e: any) => e.code === code);
                               if (customEvt && customEvt.score_impact?.enabled) {
                                 customScoreImpact = {
                                   enabled: true,
                                   value: Number(customEvt.score_impact.value || 0),
                                   side: customEvt.score_impact.side || 'own'
                                 };
                               }
                             }
                             
                             if (isGoal) {
                               const isHomeScorer = sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten;
                               if (isOwnGoal) {
                                 if (isHomeScorer) awayScore++; else homeScore++;
                               } else {
                                 if (isHomeScorer) homeScore++; else awayScore++;
                               }
                             } else if (isCustom && customScoreImpact) {
                               const isHomeScorer = sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten;
                               const value = customScoreImpact.value;
                               const isOwn = customScoreImpact.side === 'own';
                               if (isOwn) {
                                 if (isHomeScorer) homeScore += value; else awayScore += value;
                               } else {
                                 if (isHomeScorer) awayScore += value; else homeScore += value;
                               }
                             }
                             
                             return {
                               ...sk,
                               score: `${homeScore} - ${awayScore}`
                             };
                           });

                          const listItems: any[] = [];
                          let htInserted = false;

                          eventsWithScores.forEach((sk: any) => {
                            if (sk.phut > 45 && !htInserted) {
                              const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                              let htHome = 0;
                              let htAway = 0;
                              goalsBeforeHT.forEach((g: any) => {
                                const isHomeScorer = g.doiId === selectedMatch.doiNha?.id || g.doi?.ten === selectedMatch.doiNha?.ten;
                                const isOG = g.loai === 'GOAL_OG';
                                if (isOG) {
                                  if (isHomeScorer) htAway++; else htHome++;
                                } else {
                                  if (isHomeScorer) htHome++; else htAway++;
                                }
                              });
                              listItems.push({
                                type: 'PERIOD',
                                id: 'ht-row',
                                label: 'HT',
                                score: `${htHome} - ${htAway}`
                              });
                              htInserted = true;
                            }
                            listItems.push({
                              type: 'EVENT',
                              ...sk
                            });
                          });

                          if (!htInserted && (selectedMatch.trangThai === 'KET_THUC' || (selectedMatch.trangThai === 'DANG_DIEN_RA' && selectedMatch.phut > 45))) {
                            const goalsBeforeHT = eventsWithScores.filter((e: any) => e.phut <= 45 && (e.loai?.startsWith('GOAL') || e.loai === 'BAN_THANG'));
                            let htHome = 0;
                            let htAway = 0;
                            goalsBeforeHT.forEach((g: any) => {
                              const isHomeScorer = g.doiId === selectedMatch.doiNha?.id || g.doi?.ten === selectedMatch.doiNha?.ten;
                              const isOG = g.loai === 'GOAL_OG';
                              if (isOG) {
                                if (isHomeScorer) htAway++; else htHome++;
                              } else {
                                if (isHomeScorer) htHome++; else htAway++;
                              }
                            });
                            listItems.push({
                              type: 'PERIOD',
                              id: 'ht-row',
                              label: 'HT',
                              score: `${htHome} - ${htAway}`
                            });
                          }

                          if (selectedMatch.trangThai === 'KET_THUC') {
                            listItems.push({
                              type: 'PERIOD',
                              id: 'ft-row',
                              label: 'FT',
                              score: `${selectedMatch.tyNha ?? 0} - ${selectedMatch.tyKhach ?? 0}`
                            });
                          }

                          const eventIconsMap: Record<string, string> = {
                            'BAN_THANG': '⚽',
                            'GOAL_NORMAL': '⚽',
                            'GOAL_PEN': '⚽',
                            'GOAL_OG': '⚽',
                            'THE_VANG': '🟨',
                            'THE_DO': '🟥',
                            'THAY_NGUOI': '🔄',
                            'SUB': '🔄',
                            'CARD': '🟨',
                          };

                          return listItems.map((item: any) => {
                            if (item.type === 'PERIOD') {
                              return (
                                <div key={item.id} className="ref-timeline-row ref-period-row">
                                  <div className="ref-min-col">{item.label}</div>
                                  <div className="ref-home-col"></div>
                                  <div className="ref-center-col">
                                    <span className="ref-period-score">{item.score}</span>
                                  </div>
                                  <div className="ref-away-col"></div>
                                  <div className="ref-delete-col"></div>
                                </div>
                              );
                            }

                            const sk = item;
                            const isGoal = sk.loai?.startsWith('GOAL') || sk.loai === 'BAN_THANG';
                            const isOwnGoal = sk.loai === 'GOAL_OG';
                            const isSub = sk.loai === 'SUB' || sk.loai === 'THAY_NGUOI';
                            const isCustom = sk.loai?.startsWith('CUSTOM_');
                            let customIcon = '⚡';
                            if (isCustom) {
                              const code = sk.loai.replace('CUSTOM_', '');
                              const customEvt = customEvents?.find((e: any) => e.code === code);
                              customIcon = customEvt?.icon || '📌';
                            }

                            const isHomeTeamEvent = isOwnGoal
                              ? !(sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten)
                              : (sk.doiId === selectedMatch.doiNha?.id || sk.doi?.ten === selectedMatch.doiNha?.ten);

                            let actionDesc = sk.moTa || '';
                            if (sk.cauThu?.ten && actionDesc.startsWith(sk.cauThu.ten)) {
                              actionDesc = actionDesc.substring(sk.cauThu.ten.length).trim();
                              actionDesc = actionDesc.replace(/^[\s—\-\(\)]+/, '').replace(/[\(\)]+$/, '');
                            }

                            const playerDisplay = (
                              <div>
                                <div className="ref-player-name">
                                  {sk.cauThu?.ten || 'Cầu thủ'}
                                  {sk.cauThu?.soAo && <span style={{ color: '#94a3b8', marginLeft: '4px', fontSize: '11px' }}>(#{sk.cauThu.soAo})</span>}
                                </div>
                                {isSub ? (
                                  <div className="ref-player-sub">
                                    <span style={{ color: '#10b981' }}>▲</span> Vào sân
                                    {sk.moTa && (
                                      <span style={{ marginLeft: '4px', color: '#64748b' }}>
                                        (ra: {sk.moTa.replace('Vào sân thay cho ', '')})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  actionDesc && <div className="ref-player-sub">{actionDesc}</div>
                                )}
                              </div>
                            );

                            return (
                              <div key={sk.id} className="ref-timeline-row">
                                <div className="ref-min-col">{sk.phut}&apos;</div>

                                <div className="ref-home-col">
                                  {isHomeTeamEvent && playerDisplay}
                                </div>

                                <div className="ref-center-col">
                                  {isGoal ? (
                                    isHomeTeamEvent ? (
                                      <>
                                        <span>{eventIconsMap[sk.loai] ?? '⚽'}</span>
                                        <span className="ref-score-badge">{sk.score}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="ref-score-badge">{sk.score}</span>
                                        <span>{eventIconsMap[sk.loai] ?? '⚽'}</span>
                                      </>
                                    )
                                  ) : (
                                    <span>{isCustom ? customIcon : (eventIconsMap[sk.loai] ?? '⚡')}</span>
                                  )}
                                </div>

                                <div className="ref-away-col">
                                  {!isHomeTeamEvent && playerDisplay}
                                </div>

                                <div className="ref-delete-col">
                                  <button
                                    className="desktop-undo-btn"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      opacity: 0.7,
                                      transition: 'opacity 0.15s, color 0.15s',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => handleDeleteEvent(sk.id, sk.loai, sk.diemCong, sk.isIndividual, sk.cauThuId)}
                                    title="Xóa sự kiện"
                                  >
                                    <IconTrash size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
