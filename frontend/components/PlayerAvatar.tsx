import React from 'react';

interface PlayerAvatarProps {
  avatarUrl?: string;
  playerName?: string;
  soAo?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PlayerAvatar({
  avatarUrl,
  playerName = 'Cầu thủ',
  soAo,
  className,
  style
}: PlayerAvatarProps) {
  const isImg = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'));

  if (isImg) {
    return (
      <img
        src={avatarUrl}
        alt={playerName}
        className={className || "w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style
        }}
      />
    );
  }

  return (
    <div
      className={className || ""}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0', // Light gray background (slate-200)
        border: '1px solid #cbd5e1', // Slate-300 border
        color: '#475569', // Slate-600 text
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        flexShrink: 0,
        boxSizing: 'border-box',
        ...style
      }}
    >
      {soAo !== undefined ? soAo : ''}
    </div>
  );
}
