
import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

type ImportStep = 'processing' | 'saving' | 'success' | 'error' | null;

interface ImportStatusOverlayProps {
  status: {
    step: ImportStep;
    message: string;
  };
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const ImportStatusOverlay: React.FC<ImportStatusOverlayProps> = ({ status }) => {
  if (!status.step) {
    return null;
  }

  const renderIcon = () => {
    switch (status.step) {
      case 'processing':
      case 'saving':
        return <LoadingSpinner />;
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <XCircleIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex justify-center items-center z-[100]">
      <div className="flex flex-col items-center gap-6 p-8 bg-slate-800/80 rounded-2xl shadow-2xl border border-slate-700 min-w-[300px] text-center">
        <div className="w-16 h-16 flex items-center justify-center">
            {renderIcon()}
        </div>
        <p className="text-xl font-semibold text-slate-100">{status.message}</p>
      </div>
    </div>
  );
};

export default ImportStatusOverlay;
