import React from 'react';
import { IconSwap } from '../RefereeIcons';

export default function ActionWizardModal({
  isOpen,
  teamId,
  subOutPlayer,
  subInPlayerId,
  minute,
  selectedMatch,
  starterCount,
  calculateCurrentRoster,
  onClose,
  onSubInPlayerChange,
  onMinuteChange,
  onConfirm
}: {
  isOpen: boolean;
  teamId: string;
  subOutPlayer: any;
  subInPlayerId: string;
  minute: string;
  selectedMatch: any;
  starterCount: number;
  calculateCurrentRoster: (team: any, events: any[], limit: number) => { starters: any[], bench: any[] };
  onClose: () => void;
  onSubInPlayerChange: (id: string) => void;
  onMinuteChange: (val: string) => void;
  onConfirm: (subInPlayer: any) => void;
}) {
  if (!isOpen || !selectedMatch) return null;

  const team = teamId === selectedMatch.doiNha?.id ? selectedMatch.doiNha : selectedMatch.doiKhach;
  const isHome = teamId === selectedMatch.doiNha?.id;
  const { bench } = calculateCurrentRoster(team, selectedMatch.suKien, starterCount);
  const subInPlayer = bench.find((p: any) => p.id === subInPlayerId);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '760px', background: 'linear-gradient(160deg, #0d1526 0%, #0a1020 100%)',
          border: '1px solid #1e293b', borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#e2e8f0',
          fontFamily: "'Hanken Grotesk', 'Inter', sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 28px 18px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(167,139,250,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconSwap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>Thay người</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {team?.ten} • {isHome ? 'Đội nhà' : 'Đội khách'}
              </div>
            </div>
          </div>
          <button
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #1e293b',
              background: 'transparent', color: '#64748b', fontSize: '18px', lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
            }}
            onClick={onClose}
          >✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '340px' }}>
          <div style={{ padding: '24px 20px 24px 28px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px' }}>▼ Cầu thủ ra sân</div>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#ef4444', flexShrink: 0 }}>
                  {subOutPlayer?.soAo}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{subOutPlayer?.ten}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Đang thi đấu</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontSize: '13px', fontWeight: 600 }}>
                <div style={{ height: '1px', width: '32px', background: 'linear-gradient(90deg, transparent, #a78bfa)' }} />
                <IconSwap size={18} />
                <div style={{ height: '1px', width: '32px', background: 'linear-gradient(90deg, #a78bfa, transparent)' }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#10b981', textTransform: 'uppercase', marginBottom: '10px' }}>▲ Cầu thủ vào sân</div>
              <div style={{ padding: '16px', borderRadius: '12px', background: subInPlayer ? 'rgba(16,185,129,0.08)' : 'rgba(30,41,59,0.3)', border: subInPlayer ? '1px solid rgba(16,185,129,0.3)' : '1px dashed rgba(100,116,139,0.4)', display: 'flex', alignItems: 'center', gap: '14px', minHeight: '76px', transition: 'all 0.2s' }}>
                {subInPlayer ? (
                  <>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>
                      {subInPlayer.soAo}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{subInPlayer.ten}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Dự bị → Vào sân</div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#475569', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>← Chọn cầu thủ bên phải</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Phút thi đấu</label>
              <input
                type="number" min="1" max="120"
                placeholder={selectedMatch.trangThai === 'DANG_DIEN_RA' ? String(selectedMatch.phut || 0) : 'VD: 65'}
                style={{ width: '100%', padding: '10px 14px', background: '#080c14', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '14px', color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                value={minute}
                onChange={e => onMinuteChange(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '24px 28px 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Danh sách dự bị — {team?.ten}</div>
            {bench.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '320px', paddingRight: '4px' }}>
                {bench.map((p: any) => {
                  const isSelected = p.id === subInPlayerId;
                  const yellowCount = selectedMatch.suKien?.filter((ev: any) => ev.loai === 'THE_VANG' && ev.cauThuId === p.id).length || 0;
                  const isRedCarded = selectedMatch.suKien?.some((ev: any) => ev.loai === 'THE_DO' && ev.cauThuId === p.id) || yellowCount >= 2;
                  return (
                    <button
                      key={p.id} disabled={isRedCarded} type="button"
                      onClick={() => onSubInPlayerChange(p.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px',
                        border: isSelected ? '1.5px solid #a78bfa' : '1px solid #1e293b',
                        background: isRedCarded ? 'transparent' : isSelected ? 'rgba(167,139,250,0.1)' : 'rgba(20,29,47,0.8)',
                        color: isRedCarded ? '#334155' : isSelected ? '#a78bfa' : '#cbd5e1', cursor: isRedCarded ? 'not-allowed' : 'pointer',
                        opacity: isRedCarded ? 0.45 : 1, textAlign: 'left', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 0 0 3px rgba(167,139,250,0.12)' : 'none'
                      }}
                    >
                      <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: isSelected ? 'rgba(167,139,250,0.2)' : '#0a1020', border: isSelected ? '1.5px solid rgba(167,139,250,0.5)' : '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: isSelected ? '#a78bfa' : '#94a3b8', flexShrink: 0, transition: 'all 0.15s' }}>{p.soAo}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ten}</span>
                      {isRedCarded && <span style={{ fontSize: '14px' }}>🟥</span>}
                      {isSelected && !isRedCarded && <span style={{ fontSize: '14px', color: '#a78bfa' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '32px', background: 'rgba(20,29,47,0.3)', borderRadius: '12px', border: '1px dashed #1e293b' }}>Không có cầu thủ dự bị<br />nào khả dụng.</div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '12px', color: '#475569' }}>
            {subInPlayer ? <span style={{ color: '#10b981' }}>✓ Đã chọn: #{subInPlayer.soAo} {subInPlayer.ten}</span> : 'Vui lòng chọn cầu thủ vào sân'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={onClose}
            >Hủy bỏ</button>
            <button
              type="button" disabled={!subInPlayerId}
              style={{ padding: '9px 24px', borderRadius: '10px', border: 'none', background: subInPlayerId ? '#a78bfa' : '#1e293b', color: subInPlayerId ? '#080C10' : '#475569', fontSize: '13px', fontWeight: 700, cursor: subInPlayerId ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => onConfirm(subInPlayer)}
            >
              <IconSwap size={14} /> Xác nhận thay người
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
