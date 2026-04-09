import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  as: Component = 'button',
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-br from-primary to-primary-container text-white border-none',
    secondary: 'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low',
    tertiary: 'bg-transparent border-none text-on-secondary-container hover:underline',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-3 py-1.5 text-sm rounded-DEFAULT',
    lg: 'px-4 py-2 text-base rounded-lg',
    xl: 'px-6 py-3 text-lg rounded-xl',
  };

  return (
    <Component 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </Component>
  );
}
