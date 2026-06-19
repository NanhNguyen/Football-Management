import React, { Fragment } from 'react';

interface SchedulerTabProps {
  styles: any;
  setIsSchedulerConfigOpen: (val: boolean) => void;
  scheduleUniqueRounds: string[];
  scheduleFilterVong: string;
  setScheduleFilterVong: (val: string) => void;
  setIsAddingMatch: (val: boolean) => void;
  filteredAndSortedScheduleMatches: any[];
  handleInlineUpdateMatch: (id: string, field: string, value: string) => void;
  handleDeleteMatch: (id: string) => void;
  handleEditMatch: (match: any) => void;
  liveMatches: any[];
  handleClearDraftSchedule: () => void;
}

export default function SchedulerTab({
  styles,
  setIsSchedulerConfigOpen,
  scheduleUniqueRounds,
  scheduleFilterVong,
  setScheduleFilterVong,
  setIsAddingMatch,
  filteredAndSortedScheduleMatches,
  handleInlineUpdateMatch,
  handleDeleteMatch,
  handleEditMatch,
  liveMatches,
  handleClearDraftSchedule
}: SchedulerTabProps) {

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

  const getRoundDateRange = () => {
    const roundMatches = filteredAndSortedScheduleMatches.filter(m => {
      if (scheduleFilterVong === 'all') return true;
      const { vong } = parseVongDetails(m.vong);
      return vong === scheduleFilterVong;
    });

    const dates = roundMatches
      .map(m => m.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) return 'Chưa xếp lịch';
    if (dates.length === 1) {
      return formatDateLabel(dates[0]);
    }
    return `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`;
  };

  const handlePrevRound = () => {
    if (scheduleUniqueRounds.length === 0) return;
    const idx = scheduleUniqueRounds.indexOf(scheduleFilterVong);
    if (idx > 0) {
      setScheduleFilterVong(scheduleUniqueRounds[idx - 1]);
    }
  };

  const handleNextRound = () => {
    if (scheduleUniqueRounds.length === 0) return;
    const idx = scheduleUniqueRounds.indexOf(scheduleFilterVong);
    if (idx < scheduleUniqueRounds.length - 1 && idx !== -1) {
      setScheduleFilterVong(scheduleUniqueRounds[idx + 1]);
    }
  };

  return (
    <div className={`${styles.content} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className={styles.pageTitle}>Smart Scheduler</h2>
          <p className={styles.pageDesc}>Trung tâm điều khiển lịch thông minh tự động</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={styles.deleteBtnCompact}
            style={{ padding: '8px 16px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
            onClick={handleClearDraftSchedule}
            title="Xóa nhanh toàn bộ các trận đấu nháp/chưa diễn ra của giải đấu này"
          >
            🗑️ Xóa lịch
          </button>
          <button
            className={styles.editBtnCompact}
            style={{ padding: '8px 16px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsSchedulerConfigOpen(true)}
            title="Thiết lập tham số (ngày bắt đầu, thời gian, sân thi đấu...) và chạy thuật toán xếp lịch tự động"
          >
            ⚙️ Cấu hình & Sinh lịch
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Round Switcher and Dropdown Strip */}
        {scheduleUniqueRounds.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 0 28px 0',
            padding: '20px',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border-light, #e2e8f0)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
            gap: '16px'
          }}>
            {/* Filter Dropdown on Top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Chọn nhanh vòng:</span>
              <select
                value={scheduleFilterVong}
                onChange={(e) => setScheduleFilterVong(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                  background: '#0E1421',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {scheduleUniqueRounds.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Switcher Strip below */}
            {(() => {
              const currentIdx = scheduleUniqueRounds.indexOf(scheduleFilterVong);
              const isFirstRound = currentIdx <= 0;
              const isLastRound = currentIdx >= scheduleUniqueRounds.length - 1 || currentIdx === -1;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <button
                    onClick={handlePrevRound}
                    disabled={isFirstRound}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '1px solid #1e293b',
                      background: '#141C2A',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFirstRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      opacity: isFirstRound ? 0.5 : 1
                    }}
                    title="Vòng trước"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isFirstRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div style={{ textAlign: 'center', minWidth: '160px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                      {scheduleFilterVong === 'NONE' ? 'Không có vòng đấu' : scheduleFilterVong}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginTop: '4px' }}>
                      {getRoundDateRange()}
                    </div>
                  </div>
                  <button
                    onClick={handleNextRound}
                    disabled={isLastRound}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '1px solid #1e293b',
                      background: '#141C2A',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isLastRound ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      opacity: isLastRound ? 0.5 : 1
                    }}
                    title="Vòng sau"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLastRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Khu vực Danh sách Lịch */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Danh sách Lịch đề xuất</h3>
            <button
              className={styles.editBtnCompact}
              onClick={() => setIsAddingMatch(true)}
              title="Tạo thủ công một trận đấu mới và thêm vào danh sách lịch thi đấu đề xuất"
            >
              + Thêm trận thủ công
            </button>
          </div>

          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                <th>Thời gian</th>
                <th>Trận đấu</th>
                <th>Sân</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedScheduleMatches.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    {liveMatches.length === 0 ? 'Chưa có lịch thi đấu. Hãy cấu hình và bấm Sinh lịch đề xuất.' : 'Không tìm thấy trận đấu nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                Object.entries(
                  filteredAndSortedScheduleMatches.reduce((acc: any, m: any) => {
                    const { vong } = parseVongDetails(m.vong);
                    const v = vong || 'Không rõ vòng';
                    if (!acc[v]) acc[v] = [];
                    acc[v].push(m);
                    return acc;
                  }, {})
                ).map(([vongName, matches]: any) => (
                  <Fragment key={vongName}>
                    <tr>
                      <td colSpan={6} style={{ background: '#141C2A', padding: '12px 16px', fontWeight: 700, color: '#cbd5e1', borderBottom: '2px solid #1e293b', borderTop: 'none' }}>
                        {vongName}
                      </td>
                    </tr>
                    {matches.map((m: any, idx: number) => (
                      <tr key={m.id} style={{ transition: 'background-color 0.2s' }}>
                        <td style={{ textAlign: 'center', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="date"
                              value={m.date}
                              onChange={(e) => handleInlineUpdateMatch(m.id, 'ngay', e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '13px', outline: 'none', background: '#0E1421', color: '#cbd5e1' }}
                              title="Nhấp để thay đổi ngày diễn ra trận đấu"
                            />
                            <input
                              type="time"
                              value={m.time}
                              onChange={(e) => handleInlineUpdateMatch(m.id, 'gio', e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '13px', outline: 'none', background: '#0E1421', color: '#cbd5e1' }}
                              title="Nhấp để thay đổi thời gian (giờ) diễn ra trận đấu"
                            />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiNha?.ten || '???'}</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>vs</span>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiKhach?.ten || '???'}</span>
                            {m.doiNha?.bang && (
                              <span style={{ fontSize: '11px', color: 'var(--color-primary, #00d4b8)', background: 'rgba(0, 212, 184, 0.15)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', fontWeight: 700 }}>
                                Bảng {m.doiNha.bang}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={m.san || ''}
                            onChange={(e) => handleInlineUpdateMatch(m.id, 'san', e.target.value)}
                            placeholder="Tên sân"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '13px', outline: 'none', width: '100%', minWidth: '150px', background: '#0E1421', color: '#cbd5e1' }}
                            title="Nhấp để thay đổi sân thi đấu"
                          />
                        </td>
                        <td>
                          {m.trangThai === 'DRAFT' ? (
                            <span className={`${styles.statusBadge} ${styles.badgeWarning}`} title="Lịch dự thảo - Chỉ quản trị viên nhìn thấy và có thể sửa đổi">Draft</span>
                          ) : (
                            <span className={`${styles.statusBadge} ${styles.badgeSuccess}`} title="Đã phát hành chính thức cho người xem">Đã lên lịch</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className={styles.editBtnCompact}
                              style={{ padding: '6px', fontSize: '12px', height: 'auto', minHeight: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleEditMatch(m)}
                              title="Chỉnh sửa chi tiết trận đấu"
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.deleteBtnCompact}
                              style={{ padding: '6px', fontSize: '12px', height: 'auto', minHeight: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleDeleteMatch(m.id)}
                              title="Xóa trận đấu này khỏi lịch thi đấu đề xuất"
                            >
                              ❌
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
