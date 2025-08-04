import React from 'react';

interface IconProps {
  size?: 'sm' | 'md';
}

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
};
