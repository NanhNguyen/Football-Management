import React from 'react';
import TeamLogo from '@/components/TeamLogo';

interface TeamDetailViewProps {
  team: any;
  styles: any;
  onBack: () => void;
  onEdit: () => void;
}

export default function TeamDetailView({ team, styles, onBack, onEdit }: TeamDetailViewProps) {
  const chinhThuc = team.cauThu?.filter((p: any) => !p.viTri?.startsWith('Dự bị')) || [];
  const duBi = team.cauThu?.filter((p: any) => p.viTri?.startsWith('Dự bị')) || [];

  const posOrder: Record<string, number> = {
    'Thủ môn': 1, 'GK': 1,
    'Hậu vệ': 2, 'DF': 2,
    'Tiền vệ': 3, 'MF': 3,
    'Tiền đạo': 4, 'FW': 4,
    'Chưa rõ': 99
  };

  const sortPlayers = (list: any[]) => {
    return [...list].sort((a: any, b: any) => {
      const cleanPosA = a.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
      const cleanPosB = b.viTri?.replace('Dự bị - ', '') || 'Chưa rõ';
      return (posOrder[cleanPosA] || 99) - (posOrder[cleanPosB] || 99) || (a.soAo - b.soAo);
    });
  };

  const sortedChinhThuc = sortPlayers(chinhThuc);
  const sortedDuBi = sortPlayers(duBi);

  const getDisplayPos = (pos: string) => {
    if (!pos) return 'Chưa rõ';
    if (pos.startsWith('Dự bị - ')) return pos.replace('Dự bị - ', '') + ' (Dự bị)';
    return pos === 'GK' ? 'Thủ môn' : pos === 'DF' ? 'Hậu vệ' : pos === 'MF' ? 'Tiền vệ' : pos === 'FW' ? 'Tiền đạo' : pos;
  };

  return (
    <div className={`${styles.content} animate-fade-in`} style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0
          }}
        >
          ← Quay lại danh sách đội
        </button>

        <button
          className={styles.addBtn}
          onClick={onEdit}
          style={{ padding: '8px 16px', fontSize: '14px', background: '#3b82f6', borderColor: '#2563eb' }}
        >
          ✏️ Chỉnh sửa thành viên
        </button>
      </div>

      {/* Team Header Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '32px'
        }}
      >
        <div
          style={{
            fontSize: '48px',
            background: '#fff',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <TeamLogo logo={team.logo} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{team.ten}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              Bảng {team.bang || 'A'}
            </span>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
              •
            </span>
            <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
              Tổng số: {team.cauThu?.length || 0} cầu thủ
            </span>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
              •
            </span>
            <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
              🛡️ Chính thức: {chinhThuc.length}
            </span>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
              •
            </span>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
              📋 Dự bị: {duBi.length}
            </span>
          </div>
        </div>
      </div>

      {/* Rosters Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Đội hình chính thức */}
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              color: '#dc2626',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '2px solid #fee2e2',
              paddingBottom: '8px'
            }}
          >
            🛡️ Đội hình chính thức ({chinhThuc.length})
          </h3>
          {chinhThuc.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '16px 0' }}>
              Chưa có cầu thủ chính thức nào được đăng ký.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedChinhThuc.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: '#fee2e2',
                        color: '#ef4444',
                        borderRadius: '50%',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      {p.soAo}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{p.ten}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>
                        {getDisplayPos(p.viTri)}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    ⚽ {p.banThang || 0} bàn
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách dự bị */}
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              color: '#4b5563',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '8px'
            }}
          >
            📋 Danh sách dự bị ({duBi.length})
          </h3>
          {duBi.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '16px 0' }}>
              Chưa có cầu thủ dự bị nào được đăng ký.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedDuBi.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: '#e2e8f0',
                        color: '#475569',
                        borderRadius: '50%',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      {p.soAo}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#334155' }}>{p.ten}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>
                        {getDisplayPos(p.viTri)}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, background: '#fff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    ⚽ {p.banThang || 0} bàn
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
