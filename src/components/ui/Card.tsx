import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`
        bg-white dark:bg-slate-800/95 backdrop-blur-sm 
        rounded-2xl 
        border border-slate-200/70 dark:border-slate-700/70 
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] 
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
