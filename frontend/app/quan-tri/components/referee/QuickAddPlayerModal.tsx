import React from 'react';

export default function QuickAddPlayerModal({
  isOpen,
  teamName,
  name,
  jerseyNumber,
  isSaving,
  onClose,
  onNameChange,
  onJerseyNumberChange,
  onSave
}: {
  isOpen: boolean;
  teamName: string;
  name: string;
  jerseyNumber: string;
  isSaving: boolean;
  onClose: () => void;
  onNameChange: (val: string) => void;
  onJerseyNumberChange: (val: string) => void;
  onSave: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '360px',
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '16px', padding: '24px',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading, #0f172a)' }}>
            Thêm nhanh cầu thủ
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #94a3b8)', marginTop: '4px' }}>
            {teamName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary, #475569)' }}>Số áo</label>
            <input
              type="number"
              placeholder="Ví dụ: 10"
              value={jerseyNumber}
              onChange={e => onJerseyNumberChange(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border, #cbd5e1)',
                fontSize: '14px', outline: 'none', background: 'var(--color-surface-container, #f8fafc)',
                color: 'var(--color-text, #0f172a)'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary, #475569)' }}>Tên cầu thủ</label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border, #cbd5e1)',
                fontSize: '14px', outline: 'none', background: 'var(--color-surface-container, #f8fafc)',
                color: 'var(--color-text, #0f172a)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', background: 'var(--color-surface-container, #f1f5f9)',
                color: 'var(--color-text-secondary, #475569)', border: 'none', borderRadius: '8px',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !name || !jerseyNumber}
              style={{
                flex: 1, padding: '10px', background: 'var(--color-primary, #0F766E)',
                color: '#ffffff', border: 'none', borderRadius: '8px',
                fontWeight: 600, fontSize: '13px', cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: (isSaving || !name || !jerseyNumber) ? 0.7 : 1
              }}
            >
              {isSaving ? 'Đang lưu...' : '💾 Lưu lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
