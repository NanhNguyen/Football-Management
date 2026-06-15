import React from 'react';
import { SoccerBallIcon } from './AppIcons';

export default function TeamLogo({ 
  logo, 
  logoUrl,
  teamName,
  className, 
  alt = 'Logo', 
  fallback = <SoccerBallIcon size={16} />, 
  style 
}: { 
  logo?: string, 
  logoUrl?: string,
  teamName?: string,
  className?: string, 
  alt?: string, 
  fallback?: React.ReactNode, 
  style?: React.CSSProperties 
}) {
  const finalLogo = logoUrl || logo;
  const isImg = finalLogo && (finalLogo.startsWith('http') || finalLogo.startsWith('/'));
  
  if (isImg) {
    return (
      <img 
        src={finalLogo} 
        alt={alt} 
        className={className || "w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200"} 
        style={{
          width: '1em',
          height: '1em',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style
        }} 
      />
    );
  }

  // Get up to 2 initials from teamName
  const getInitials = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  if (teamName) {
    let fontSizeStyle: string | number = '0.42em';
    if (style?.width) {
      const w = style.width;
      if (typeof w === 'number') {
        fontSizeStyle = `${w * 0.4}px`;
      } else if (typeof w === 'string' && w.endsWith('px')) {
        const num = parseFloat(w);
        if (!isNaN(num)) {
          fontSizeStyle = `${num * 0.4}px`;
        }
      }
    }

    return (
      <div 
        className={className || ""}
        style={{
          width: '1em',
          height: '1em',
          minWidth: '100%',
          minHeight: '100%',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary, #0F766E)',
          color: '#ffffff',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: fontSizeStyle,
          textTransform: 'uppercase',
          border: '1px solid var(--color-primary-dark, #115E59)',
          boxSizing: 'border-box',
          lineHeight: 1,
          userSelect: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          ...style
        }}
      >
        {getInitials(teamName)}
      </div>
    );
  }
  
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {fallback}
    </span>
  );
}
