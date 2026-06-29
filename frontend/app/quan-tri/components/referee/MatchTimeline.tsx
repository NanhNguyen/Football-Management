import React from 'react';
import { IconTrash } from '../RefereeIcons';

export default function MatchTimeline({
  selectedMatch,
  customEvents,
  onDeleteEvent,
  desktopStyles
}: any) {
  if (!selectedMatch) return null;

  return (
    <div style={{ ...desktopStyles.timelineCard, flex: 1, minHeight: '300px' }}>
      <div style={desktopStyles.timelineHeader}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Nhật ký trận đấu
      </div>
      <div style={desktopStyles.timelineList}>
        {selectedMatch.suKien && selectedMatch.suKien.length > 0 ? (
          [...selectedMatch.suKien].sort((a: any, b: any) => (b.phut || 0) - (a.phut || 0)).map((ev: any) => {
            let icon = '📝';
            let evColor = '#334155';
            if (ev.loai === 'GOAL_NORMAL') { icon = '⚽'; evColor = '#10b981'; }
            else if (ev.loai === 'GOAL_PEN') { icon = '🎯'; evColor = '#3b82f6'; }
            else if (ev.loai === 'GOAL_OG') { icon = '🤡'; evColor = '#f59e0b'; }
            else if (ev.loai === 'THE_VANG') { icon = '🟨'; evColor = '#eab308'; }
            else if (ev.loai === 'THE_DO') { icon = '🟥'; evColor = '#ef4444'; }
            else if (ev.loai === 'SUB') { icon = '🔄'; evColor = '#a78bfa'; }
            else if (ev.loai.startsWith('CUSTOM_')) {
              const code = ev.loai.replace('CUSTOM_', '');
              const customEvt = customEvents?.find((e: any) => e.code === code);
              if (customEvt) { icon = customEvt.icon || '📌'; evColor = '#0ea5e9'; }
            }

            return (
              <div key={ev.id} style={desktopStyles.timelineRow}>
                <div style={desktopStyles.timelineText}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary, #0F766E)', minWidth: '32px' }}>{ev.phut}'</span>
                  <span style={{ fontSize: '14px', marginRight: '4px' }}>{icon}</span>
                  <span style={{ color: evColor }}>{ev.moTa}</span>
                </div>
                <button
                  style={desktopStyles.timelineDeleteBtn}
                  title="Xóa sự kiện"
                  onClick={() => onDeleteEvent(ev.id, ev.loai, ev.cauThuId)}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontStyle: 'italic', padding: '20px 0' }}>
            Chưa có sự kiện nào
          </div>
        )}
      </div>
    </div>
  );
}
