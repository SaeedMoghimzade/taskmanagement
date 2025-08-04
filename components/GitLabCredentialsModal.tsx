

import React from 'react';

interface GitLabCredentialsModalProps {
  onClose: () => void;
}

const GitLabCredentialsModal: React.FC<GitLabCredentialsModalProps> = ({ onClose }) => {

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">اتصال به گیت‌لب ناموفق بود</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          اطلاعات اتصال به گیت‌لب یافت نشد. لطفا ابتدا آن‌ها را در صفحه پروفایل خود تنظیم و ذخیره کنید.
        </p>
        <div className="flex justify-end gap-4 mt-4">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700"
            >
                متوجه شدم
            </button>
        </div>
      </div>
    </div>
  );
};

export default GitLabCredentialsModal;
