import React from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'base' | 'lowest' | 'low' | 'high' | 'highest' | 'bright';
  glass?: boolean;
}

export function Surface({ 
  level = 'base', 
  glass = false, 
  className = '', 
  children, 
  ...props 
}: SurfaceProps) {
  const levelMap = {
    base: 'bg-surface',
    lowest: 'bg-surface-container-lowest',
    low: 'bg-surface-container-low',
    high: 'bg-surface-container-high',
    highest: 'bg-surface-container-highest',
    bright: 'bg-surface-bright',
  };

  const glassClasses = glass 
    ? 'bg-opacity-85 backdrop-blur-[20px]' 
    : '';

  return (
    <div 
      className={`${levelMap[level]} ${glassClasses} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
