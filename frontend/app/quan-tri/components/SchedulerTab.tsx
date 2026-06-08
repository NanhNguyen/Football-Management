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
        {/* Khu vực Danh sách Lịch */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Danh sách Lịch đề xuất</h3>
              {scheduleUniqueRounds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Lọc theo vòng:</span>
                  <select
                    value={scheduleFilterVong}
                    onChange={(e) => setScheduleFilterVong(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1e293b',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Tất cả các vòng</option>
                    {scheduleUniqueRounds.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
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
                    const v = m.vong || 'Không rõ vòng';
                    if (!acc[v]) acc[v] = [];
                    acc[v].push(m);
                    return acc;
                  }, {})
                ).map(([vong, matches]: any) => (
                  <Fragment key={vong}>
                    <tr>
                      <td colSpan={6} style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', borderTop: 'none' }}>
                        {vong}
                      </td>
                    </tr>
                    {matches.map((m: any, idx: number) => (
                      <tr key={m.id} style={{ transition: 'background-color 0.2s' }}>
                        <td style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="date"
                              value={m.date}
                              onChange={(e) => handleInlineUpdateMatch(m.id, 'ngay', e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                              title="Nhấp để thay đổi ngày diễn ra trận đấu"
                            />
                            <input
                              type="time"
                              value={m.time}
                              onChange={(e) => handleInlineUpdateMatch(m.id, 'gio', e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                              title="Nhấp để thay đổi thời gian (giờ) diễn ra trận đấu"
                            />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiNha?.ten || '???'}</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>vs</span>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.doiKhach?.ten || '???'}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={m.san || ''}
                            onChange={(e) => handleInlineUpdateMatch(m.id, 'san', e.target.value)}
                            placeholder="Tên sân"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', width: '100%', minWidth: '150px', background: '#fff' }}
                            title="Nhấp để thay đổi sân thi đấu"
                          />
                        </td>
                        <td>
                          {m.trangThai === 'DRAFT' ? (
                            <span className={`${styles.statusBadge}`} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }} title="Lịch dự thảo - Chỉ quản trị viên nhìn thấy và có thể sửa đổi">Draft</span>
                          ) : (
                            <span className={`${styles.statusBadge}`} style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }} title="Đã phát hành chính thức cho người xem">Đã lên lịch</span>
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
