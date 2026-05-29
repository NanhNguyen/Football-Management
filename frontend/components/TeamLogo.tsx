import React from 'react';

export default function TeamLogo({ logo, className, alt = 'Logo', fallback = '⚽', style }: { logo?: string, className?: string, alt?: string, fallback?: string, style?: React.CSSProperties }) {
  const isImg = logo && (logo.startsWith('http') || logo.startsWith('/'));
  
  if (isImg) {
    return (
      <img 
        src={logo} 
        alt={alt} 
        className={className} 
        style={{ ...style, width: '1em', height: '1em', objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }} 
      />
    );
  }
  
  return (
    <span className={className} style={style}>
      {logo || fallback}
    </span>
  );
}
