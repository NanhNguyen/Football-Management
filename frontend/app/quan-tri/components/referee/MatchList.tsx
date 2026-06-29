import React from 'react';
import { getDisplayTime } from '@/lib/api';
import TeamLogo from '@/components/TeamLogo';

export default function MatchList({
  uniqueRounds,
  refereeFilterVong,
  setRefereeFilterVong,
  refereeFilterBang,
  setRefereeFilterBang,
  uniqueGroups,
  filteredAndSortedRefereeMatches,
  selectedMatchId,
  setSelectedMatchId
}: any) {
  const currentIdx = uniqueRounds.indexOf(refereeFilterVong);
  const isFirstRound = currentIdx <= 0;
  const isLastRound = currentIdx >= uniqueRounds.length - 1 || currentIdx === -1;

  const handlePrevRound = () => {
    if (!isFirstRound) setRefereeFilterVong(uniqueRounds[currentIdx - 1]);
  };

  const handleNextRound = () => {
    if (!isLastRound) setRefereeFilterVong(uniqueRounds[currentIdx + 1]);
  };

  const isKnockoutActive = refereeFilterVong !== 'NONE' && (
    refereeFilterVong.toLowerCase().includes('1/8') ||
    refereeFilterVong.toLowerCase().includes('tứ kết') ||
    refereeFilterVong.toLowerCase().includes('bán kết') ||
    refereeFilterVong.toLowerCase().includes('hạng ba') ||
    refereeFilterVong.toLowerCase().includes('chung kết')
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {uniqueRounds.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          margin: '0 0 16px 0', padding: '14px 20px', background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Chọn nhanh vòng:</span>
            <select
              value={refereeFilterVong}
              onChange={(e) => setRefereeFilterVong(e.target.value)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--color-border, #1e293b)',
                background: 'var(--color-surface, #141C2A)', fontSize: '13px', fontWeight: 600,
                color: 'var(--color-text, #f8fafc)', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {uniqueRounds.map((r: string) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={handlePrevRound} disabled={isFirstRound}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '1px solid var(--color-border, #1e293b)',
                background: 'var(--color-surface, #141C2A)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isFirstRound ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', outline: 'none', opacity: isFirstRound ? 0.5 : 1
              }}
              title="Vòng trước"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isFirstRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary, #10b981)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {refereeFilterVong === 'NONE' ? 'Chưa chọn vòng' : refereeFilterVong}
              </div>
            </div>

            <button
              onClick={handleNextRound} disabled={isLastRound}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '1px solid var(--color-border, #1e293b)',
                background: 'var(--color-surface, #141C2A)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLastRound ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', outline: 'none', opacity: isLastRound ? 0.5 : 1
              }}
              title="Vòng sau"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLastRound ? 'var(--color-text-muted, #475569)' : 'var(--color-text, #f8fafc)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {!isKnockoutActive && uniqueGroups.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setRefereeFilterBang('all')}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                  border: refereeFilterBang === 'all' ? '1px solid var(--color-primary, #10b981)' : '1px solid var(--color-border, #1e293b)',
                  background: refereeFilterBang === 'all' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: refereeFilterBang === 'all' ? 'var(--color-primary, #10b981)' : 'var(--color-text-muted, #94a3b8)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >Tất cả bảng</button>
              {uniqueGroups.map((g: string) => (
                <button
                  key={g} onClick={() => setRefereeFilterBang(g)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                    border: refereeFilterBang === g ? '1px solid var(--color-primary, #10b981)' : '1px solid var(--color-border, #1e293b)',
                    background: refereeFilterBang === g ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: refereeFilterBang === g ? 'var(--color-primary, #10b981)' : 'var(--color-text-muted, #94a3b8)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >{g}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredAndSortedRefereeMatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-surface, #141C2A)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>Không có trận đấu nào trong vòng/bảng này.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredAndSortedRefereeMatches.map((m: any) => {
            const dateObj = m.batDauLuc || m.date ? new Date(m.batDauLuc || m.date) : null;
            const timeStr = m.time || (dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chưa xếp giờ');
            let isLive = m.trangThai === 'DANG_DIEN_RA';
            let statusText = isLive ? "Đang trực tiếp" : m.trangThai === 'KET_THUC' ? "Đã kết thúc" : timeStr;
            let statusColor = isLive ? '#EF4444' : m.trangThai === 'KET_THUC' ? '#10b981' : '#94a3b8';
            let bgStyle = isLive
              ? { background: 'linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent)', borderLeft: '4px solid #EF4444' }
              : { background: 'var(--color-surface, #ffffff)', borderLeft: '4px solid transparent' };
            const isSelected = selectedMatchId === m.id;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                style={{
                  ...bgStyle,
                  display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: '12px', cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary, #0F766E)' : '1px solid var(--color-border-light, #f1f5f9)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(15, 118, 110, 0.1)' : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor, padding: '2px 6px', background: isLive ? 'rgba(239, 68, 68, 0.1)' : m.trangThai === 'KET_THUC' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {statusText}
                    </span>
                    {isLive && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="live-dot" style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                        {getDisplayTime(m.phut, m.hiep)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 600 }}>
                    {m.vong}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                    <TeamLogo logo={m.doiNha?.logo} logoUrl={m.doiNha?.logoUrl} teamName={m.doiNha?.ten} style={{ width: 24, height: 24 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.doiNha?.ten || '???'}
                    </span>
                  </div>
                  <div style={{ padding: '0 12px', fontSize: '16px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)' }}>
                    {m.tyNha ?? '-'} : {m.tyKhach ?? '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                      {m.doiKhach?.ten || '???'}
                    </span>
                    <TeamLogo logo={m.doiKhach?.logo} logoUrl={m.doiKhach?.logoUrl} teamName={m.doiKhach?.ten} style={{ width: 24, height: 24 }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
