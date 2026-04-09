import React from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  level?: 'display-lg' | 'headline' | 'title-sm' | 'body' | 'label-sm';
  as?: React.ElementType;
}

export function Typography({ 
  level = 'body', 
  as: Component = 'span', 
  className = '', 
  children,
  ...props
}: TypographyProps) {
  const styles = {
    'display-lg': 'font-manrope text-[3.5rem] leading-tight font-bold',
    'headline': 'font-manrope text-2xl font-bold',
    'title-sm': 'font-inter text-base font-semibold tracking-tight',
    'body': 'font-inter text-sm leading-relaxed',
    'label-sm': 'font-jakarta text-[0.6875rem] uppercase tracking-wider font-medium',
  };

  return (
    <Component className={`${styles[level]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
