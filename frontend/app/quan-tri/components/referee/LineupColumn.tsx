import React from 'react';
import TeamLogo from '@/components/TeamLogo';

export default function LineupColumn({
  team,
  isHome,
  events,
  starterCount,
  activePlayerPopover,
  activeActionMenu,
  calculateCurrentRoster,
  onActionClick,
  onSetActivePlayerPopover,
  onSetActiveActionMenu,
  onOpenQuickAdd,
  onOpenPcSub,
  desktopStyles,
  isMobile
}: any) {
  if (!team) return null;

  const { starters, bench } = calculateCurrentRoster(team, events, starterCount);

  const getPositionTag = (viTri: string) => {
    if (!viTri) return null;
    let bgColor = '#475569';
    if (viTri === 'GK') bgColor = '#eab308';
    else if (viTri === 'DF' || viTri === 'HV') bgColor = '#3b82f6';
    else if (viTri === 'MF' || viTri === 'TV') bgColor = '#22c55e';
    else if (viTri === 'FW' || viTri === 'TĐ') bgColor = '#ef4444';
    return (
      <span style={{
        background: bgColor, color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 4px',
        borderRadius: '3px', marginLeft: 'auto', textTransform: 'uppercase'
      }}>
        {viTri}
      </span>
    );
  };

  const getYellowCards = (playerId: string) => events?.filter((e: any) => e.loai === 'THE_VANG' && e.cauThuId === playerId).length || 0;
  const isRedCarded = (playerId: string) => events?.some((e: any) => e.loai === 'THE_DO' && e.cauThuId === playerId) || getYellowCards(playerId) >= 2;
  const getGoals = (playerId: string) => events?.filter((e: any) => e.loai === 'GOAL_NORMAL' && e.cauThuId === playerId).length || 0;
  const getOwnGoals = (playerId: string) => events?.filter((e: any) => e.loai === 'GOAL_OG' && e.cauThuId === playerId).length || 0;

  return (
    <div style={desktopStyles.columnHomeAway}>
      <div style={desktopStyles.card}>
        <div style={{ ...desktopStyles.cardTitle, justifyContent: isHome ? 'flex-start' : 'flex-end' }}>
          {isHome ? <><TeamLogo logo={team.logo} logoUrl={team.logoUrl} teamName={team.ten} style={{ width: 28, height: 28 }} /> {team.ten}</> : <>{team.ten} <TeamLogo logo={team.logo} logoUrl={team.logoUrl} teamName={team.ten} style={{ width: 28, height: 28 }} /></>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={desktopStyles.lineupSectionTitle}>Đội hình chính ({starters.length})</div>
          <button
            onClick={() => onOpenQuickAdd(team.id)}
            style={{
              background: 'none', border: '1px solid var(--color-border, #e2e8f0)', color: 'var(--color-primary, #0F766E)',
              fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            + Thêm
          </button>
        </div>

        <div style={desktopStyles.startersGrid}>
          {starters.map((p: any) => {
            const isPopoverOpen = activePlayerPopover === p.id;
            const yellowCount = getYellowCards(p.id);
            const redCard = isRedCarded(p.id);
            const goals = getGoals(p.id);
            const ogs = getOwnGoals(p.id);

            return (
              <div key={p.id} style={{ position: 'relative', width: '100%' }}>
                <button
                  style={desktopStyles.playerButton(isPopoverOpen, redCard)}
                  onClick={() => onSetActivePlayerPopover(isPopoverOpen ? null : p.id)}
                  disabled={redCard}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', minWidth: '22px', textAlign: 'left', paddingTop: '1px' }}>
                    {p.soAo}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>
                      {p.ten}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {yellowCount === 1 && !redCard && <span style={{ fontSize: '12px', background: '#eab308', width: '10px', height: '14px', borderRadius: '2px', display: 'inline-block' }} />}
                      {redCard && <span style={{ fontSize: '12px', background: '#ef4444', width: '10px', height: '14px', borderRadius: '2px', display: 'inline-block' }} />}
                      {goals > 0 && Array.from({ length: goals }).map((_, i) => <span key={i} style={{ fontSize: '12px' }}>⚽</span>)}
                      {ogs > 0 && Array.from({ length: ogs }).map((_, i) => <span key={i} style={{ fontSize: '12px', opacity: 0.7 }}>🤡</span>)}
                    </div>
                  </div>
                  {getPositionTag(p.viTri)}
                </button>

                {isPopoverOpen && (
                  <div style={desktopStyles.popover(isHome)}>
                    <div style={{ padding: '8px 12px', background: 'var(--color-surface-container, #f8fafc)', borderBottom: '1px solid var(--color-border-light, #f1f5f9)', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>#{p.soAo} {p.ten}</span>
                      <button onClick={(e) => { e.stopPropagation(); onSetActivePlayerPopover(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                    </div>
                    {activeActionMenu === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button style={desktopStyles.popoverActionBtn('#10b981', '#059669')} onClick={() => onActionClick('goal', undefined, { teamId: team.id, player: p })}>⚽ Ghi bàn</button>
                        <button style={desktopStyles.popoverActionBtn('#3b82f6', '#2563eb')} onClick={() => onActionClick('goal', 'pen', { teamId: team.id, player: p })}>🎯 Penalty</button>
                        <button style={desktopStyles.popoverActionBtn('#f59e0b', '#d97706')} onClick={() => onActionClick('goal', 'og', { teamId: team.id, player: p })}>🤡 Phản lưới</button>
                        <button style={{ ...desktopStyles.popoverActionBtn('#f1f5f9', '#e2e8f0'), color: '#64748b' }} onClick={(e) => { e.stopPropagation(); onSetActiveActionMenu(null); }}>← Trở lại</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button style={desktopStyles.popoverActionBtn('#0F766E', '#0f766e')} onClick={(e) => { e.stopPropagation(); onSetActiveActionMenu(p.id); }}>⚽ Ghi bàn...</button>
                        <button style={desktopStyles.popoverActionBtn('#a78bfa', '#8b5cf6')} onClick={() => onOpenPcSub(team.id, p)}>🔄 Thay người</button>
                        <div style={{ display: 'flex' }}>
                          <button style={{ ...desktopStyles.popoverActionBtn('#eab308', '#ca8a04'), flex: 1, borderRight: '1px solid rgba(255,255,255,0.2)' }} onClick={() => onActionClick('card', 'yellow', { teamId: team.id, player: p })}>🟨</button>
                          <button style={{ ...desktopStyles.popoverActionBtn('#ef4444', '#dc2626'), flex: 1 }} onClick={() => onActionClick('card', 'red', { teamId: team.id, player: p })}>🟥</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {bench.length > 0 ? (
          <div style={desktopStyles.benchGrid}>
            <div style={desktopStyles.lineupSectionTitle}>Dự bị ({bench.length})</div>
            {bench.map((p: any) => (
              <div key={p.id} style={desktopStyles.benchPlayerBox}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', minWidth: '30px', flexShrink: 0, paddingTop: '1px', textAlign: 'left' }}>#{p.soAo}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#d8e4ff', flex: 1, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4, textAlign: 'left' }}>{p.ten}</span>
                {getPositionTag(p.viTri)}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', padding: '12px 0' }}>Chưa có cầu thủ dự bị</div>
          </div>
        )}
      </div>
    </div>
  );
}
