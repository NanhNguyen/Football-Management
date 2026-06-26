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
  setIsPostponeModalOpen: (val: boolean) => void;
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
  handleClearDraftSchedule,
  setIsPostponeModalOpen
}: SchedulerTabProps) {
  const [editingMatchId, setEditingMatchId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState({ date: '', time: '', san: '' });

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
      <style>{`
        .schedule-row {
          transition: background-color 0.12s ease;
        }
        .schedule-row:hover {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .action-btn-edit {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .action-btn-edit:hover {
          background: rgba(167,139,250,0.15);
          color: #a78bfa;
          border-color: rgba(167,139,250,0.3);
        }
        .action-btn-delete {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          color: rgba(239,68,68,0.5);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .action-btn-delete:hover {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          border-color: rgba(239,68,68,0.35);
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className={styles.pageTitle}>Smart Scheduler</h2>
          <p className={styles.pageDesc}>Trung tâm điều khiển lịch thông minh tự động</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={styles.deleteBtnCompact}
            style={{ padding: '8px 16px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e11d48', color: '#ffffff', border: 'none' }}
            onClick={() => setIsPostponeModalOpen(true)}
            title="Hoãn toàn bộ ngày thi đấu (Freeze Matchday) do mưa bão, sự cố"
          >
            ❄️ Hoãn ngày thi đấu
          </button>
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
        {(() => {
          const poolMatches = filteredAndSortedScheduleMatches.filter(m => m.trangThai === 'POSTPONED' && !m.date);
          if (poolMatches.length > 0) {
            return (
              <div style={{ marginBottom: '32px', background: 'var(--color-surface, #0E1421)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--color-surface-sidebar, #0A0F18)', borderBottom: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-heading, #E8F4F8)' }}>📦 Kho chờ xếp lịch ({poolMatches.length})</h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #A0B4C8)' }}>Trận hoãn chưa xếp ngày</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {poolMatches.map(m => (
                    <div key={m.id} style={{ border: '1px dashed var(--color-border, rgba(167, 139, 250, 0.3))', background: 'var(--color-surface-container, #0A0F18)', padding: '12px', borderRadius: '8px', width: '250px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #A0B4C8)', marginBottom: '8px', fontWeight: 600 }}>{m.vong}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-heading, #E8F4F8)' }}>
                        <span style={{ fontWeight: 600 }}>{m.doiNhaTen}</span>
                        <span style={{ color: 'var(--color-text-muted, #4A6070)', fontSize: '12px' }}>vs</span>
                        <span style={{ fontWeight: 600 }}>{m.doiKhachTen}</span>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        {/* A minimal hint for DND or manual edit */}
                        <button 
                          onClick={() => handleEditMatch(m)}
                          style={{ width: '100%', padding: '6px', fontSize: '12px', background: 'var(--color-surface-hover, #141C2A)', border: '1px solid var(--color-border, rgba(167, 139, 250, 0.15))', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-primary, #a78bfa)' }}
                        >
                          Xếp lịch thủ công
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

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

          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '180px', padding: '10px 16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Thời gian</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Trận đấu</th>
                <th style={{ width: '160px', padding: '10px 16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Sân</th>
                <th style={{ width: '120px', padding: '10px 16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ width: '80px', padding: '10px 16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedScheduleMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
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
                      <td colSpan={5} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {vongName} &nbsp;&middot;&nbsp; {matches.length} trận
                      </td>
                    </tr>
                    {matches.map((m: any) => {
                      const isEditing = editingMatchId === m.id;
                      const isUnknownSan = !m.san || m.san.toLowerCase().includes('chưa xác định');
                      
                      let statusStyle = { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', text: 'Đã lên lịch', dot: false };
                      if (m.trangThai === 'LIVE') {
                        statusStyle = { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', text: 'Đang đá', dot: true };
                      } else if (m.trangThai === 'FINISHED') {
                        statusStyle = { bg: 'rgba(16,217,138,0.12)', color: '#10d98a', text: '✓ Kết thúc', dot: false };
                      } else if (m.trangThai === 'POSTPONED') {
                        statusStyle = { bg: 'rgba(239,68,68,0.12)', color: '#f87171', text: 'Hoãn', dot: false };
                      } else if (m.trangThai === 'CANCELLED') {
                        statusStyle = { bg: 'rgba(239,68,68,0.12)', color: '#f87171', text: 'Hủy', dot: false };
                      }

                      return (
                        <tr key={m.id} className="schedule-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                  type="date"
                                  value={editData.date}
                                  onChange={(e) => setEditData({...editData, date: e.target.value})}
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '12px', outline: 'none', background: '#0E1421', color: '#cbd5e1', width: '110px' }}
                                />
                                <input
                                  type="time"
                                  value={editData.time}
                                  onChange={(e) => setEditData({...editData, time: e.target.value})}
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '12px', outline: 'none', background: '#0E1421', color: '#cbd5e1', width: '70px' }}
                                />
                              </div>
                            ) : (
                              <div style={{ fontSize: '13px', color: '#d8e4ff', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                {(() => {
                                  if (!m.date) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>Chưa xác định</span>;
                                  const d = new Date(m.date);
                                  if (isNaN(d.getTime())) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>Chưa xác định</span>;
                                  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                  const dayName = days[d.getDay()];
                                  const isWeekend = dayName === 'T7' || dayName === 'CN';
                                  const day = String(d.getDate()).padStart(2, '0');
                                  const month = String(d.getMonth() + 1).padStart(2, '0');
                                  const year = d.getFullYear();
                                  const formattedDate = `${day}/${month}/${year}`;
                                  const time = m.time || '--:--';
                                  return (
                                    <>
                                      <span style={{
                                        display: 'inline-block',
                                        marginRight: '6px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        background: isWeekend ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)',
                                        color: isWeekend ? '#a78bfa' : 'rgba(255,255,255,0.5)'
                                      }}>
                                        {dayName}
                                      </span>
                                      {formattedDate} &middot; {time}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiNha?.ten || '???'}</span>
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 600 }}>vs</span>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiKhach?.ten || '???'}</span>
                              {m.doiNha?.bang && (
                                <span style={{ fontSize: '11px', color: 'var(--color-primary, #a78bfa)', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 700 }}>
                                  Bảng {m.doiNha.bang}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.san}
                                onChange={(e) => setEditData({...editData, san: e.target.value})}
                                placeholder="Tên sân"
                                style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '12px', outline: 'none', width: '100%', background: '#0E1421', color: '#cbd5e1' }}
                              />
                            ) : (
                              isUnknownSan ? (
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>–</span>
                              ) : (
                                <span style={{ color: '#d8e4ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '10px' }}>📍</span> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{m.san}</span>
                                </span>
                              )
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                            <span style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '5px',
                              padding: '3px 10px',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {statusStyle.dot && <span className="animate-pulse">●</span>}
                              {statusStyle.text}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => {
                                    if (editData.date !== m.date) handleInlineUpdateMatch(m.id, 'ngay', editData.date);
                                    if (editData.time !== m.time) handleInlineUpdateMatch(m.id, 'gio', editData.time);
                                    if (editData.san !== m.san) handleInlineUpdateMatch(m.id, 'san', editData.san);
                                    setEditingMatchId(null);
                                  }}
                                  style={{ background: 'rgba(16,217,138,0.12)', color: '#10d98a', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingMatchId(null)}
                                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  className="action-btn-edit"
                                  title="Chỉnh sửa"
                                  onClick={() => {
                                    setEditingMatchId(m.id);
                                    setEditData({ date: m.date || '', time: m.time || '', san: m.san || '' });
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button
                                  className="action-btn-delete"
                                  title="Xóa trận"
                                  onClick={() => {
                                    if (window.confirm('Bạn có chắc chắn muốn xóa trận đấu này?')) {
                                      handleDeleteMatch(m.id);
                                    }
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
