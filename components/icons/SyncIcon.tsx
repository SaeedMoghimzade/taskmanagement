import React from 'react';

interface SyncIconProps {
  isSyncing: boolean;
}

export const SyncIcon: React.FC<SyncIconProps> = ({ isSyncing }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.542 8.542A7.5 7.5 0 0118.5 10.5v1.5a7.5 7.5 0 01-7.5 7.5h-1.5a7.5 7.5 0 01-7.5-7.5v-1.5a7.489 7.489 0 012.042-5.042"
    />
  </svg>
);
