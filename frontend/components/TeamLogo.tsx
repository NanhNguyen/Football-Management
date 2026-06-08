import React from 'react';
import { SoccerBallIcon } from './AppIcons';

export default function TeamLogo({ 
  logo, 
  className, 
  alt = 'Logo', 
  fallback = <SoccerBallIcon size={16} />, 
  style 
}: { 
  logo?: string, 
  className?: string, 
  alt?: string, 
  fallback?: React.ReactNode, 
  style?: React.CSSProperties 
}) {
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
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {logo || fallback}
    </span>
  );
}
