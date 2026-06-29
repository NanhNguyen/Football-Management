import React from 'react';
import { IconPlay, IconPause, IconStop, IconReset } from '../RefereeIcons';

export default function ActionButtons({
  selectedMatch,
  isLive,
  onStartMatch,
  onTemporaryPauseToggle,
  onFinishMatch,
  onResetMatch,
  desktopStyles,
  isMobile
}: any) {
  if (!selectedMatch) return null;

  const getPauseButtonLabel = () => {
    if (selectedMatch.trangThai === 'DANG_DIEN_RA') {
      if (selectedMatch.isPaused) return '▶ Tiếp tục giờ';
      return '⏸ Tạm dừng giờ';
    }
    return '⏸ Tạm dừng giờ';
  };

  return (
    <div style={isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '12px', background: 'var(--color-surface, #ffffff)', borderBottom: '1px solid var(--color-border-light, #f1f5f9)' } : desktopStyles.ctaRow}>
      {!isLive && selectedMatch.trangThai !== 'KET_THUC' && (
        <button style={desktopStyles.ctaButton('#10b981')} onClick={onStartMatch}>
          <IconPlay size={16} /> Bắt đầu trận
        </button>
      )}

      {isLive && (
        <>
          <button style={desktopStyles.ctaButton(selectedMatch.isPaused ? '#3b82f6' : '#f59e0b', 1)} onClick={onTemporaryPauseToggle}>
            {selectedMatch.isPaused ? <IconPlay size={16} /> : <IconPause size={16} />}
            {getPauseButtonLabel()}
          </button>

          <button style={desktopStyles.ctaButton('#1e293b', 1)} onClick={onFinishMatch}>
            <IconStop size={16} /> Kết thúc hiệp/trận
          </button>
        </>
      )}

      {selectedMatch.trangThai === 'KET_THUC' && (
        <button style={desktopStyles.ctaButton('#ef4444')} onClick={onResetMatch}>
          <IconReset size={16} /> Đặt lại trận đấu
        </button>
      )}
    </div>
  );
}
