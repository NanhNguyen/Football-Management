import React from 'react';
import TeamLogo from '@/components/TeamLogo';

export default function ScoreBoard({
  selectedMatch,
  isLive,
  displayTime,
  halfState,
  desktopStyles
}: any) {
  if (!selectedMatch) return null;

  return (
    <div style={{ ...desktopStyles.scoreboardCard, position: 'relative' }}>
      <div style={desktopStyles.roundHeader}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        {selectedMatch.vong}
      </div>

      <div style={desktopStyles.timerText(isLive)}>
        {isLive && <span className="live-dot" style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', display: 'inline-block' }}></span>}
        {displayTime} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted, #94a3b8)' }}>({halfState})</span>
      </div>

      <div style={desktopStyles.scoreboardTeamsRow}>
        <div style={desktopStyles.scoreboardTeamCode('right')}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Đội nhà</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <TeamLogo logo={selectedMatch.doiNha?.logo} logoUrl={selectedMatch.doiNha?.logoUrl} teamName={selectedMatch.doiNha?.ten} style={{ width: 64, height: 64 }} />
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)', textAlign: 'center', maxWidth: '140px', wordWrap: 'break-word', lineHeight: 1.2 }}>
              {selectedMatch.doiNha?.ten}
            </div>
          </div>
        </div>

        <div style={desktopStyles.scoreboardBigScore}>
          <span style={{ color: selectedMatch.tyNha > selectedMatch.tyKhach ? 'var(--color-primary, #0F766E)' : 'var(--color-text-heading, #0F172A)' }}>{selectedMatch.tyNha ?? 0}</span>
          <span style={{ margin: '0 12px', color: 'var(--color-border, #cbd5e1)' }}>-</span>
          <span style={{ color: selectedMatch.tyKhach > selectedMatch.tyNha ? 'var(--color-primary, #0F766E)' : 'var(--color-text-heading, #0F172A)' }}>{selectedMatch.tyKhach ?? 0}</span>
        </div>

        {selectedMatch.trangThai === 'KET_THUC' && (
          <div style={{
            position: 'absolute', top: '160px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--color-surface-container, #f1f5f9)', color: 'var(--color-text-secondary, #475569)',
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', border: '1px solid var(--color-border, #e2e8f0)', zIndex: 10
          }}>
            Kết thúc
          </div>
        )}

        <div style={desktopStyles.scoreboardTeamCode('left')}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Đội khách</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <TeamLogo logo={selectedMatch.doiKhach?.logo} logoUrl={selectedMatch.doiKhach?.logoUrl} teamName={selectedMatch.doiKhach?.ten} style={{ width: 64, height: 64 }} />
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)', textAlign: 'center', maxWidth: '140px', wordWrap: 'break-word', lineHeight: 1.2 }}>
              {selectedMatch.doiKhach?.ten}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
