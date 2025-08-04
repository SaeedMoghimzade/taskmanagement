import React, { useState, useEffect, useRef } from 'react';
import { GitLabIcon } from './icons/GitLabIcon';
import { UserIcon } from './icons/UserIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface ConfirmationState {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
}

const ProfileView: React.FC = () => {
    const [username, setUsername] = useState('');
    const [gitlabUrl, setGitlabUrl] = useState('');
    const [token, setToken] = useState('');
    const [defaultProjectIds, setDefaultProjectIds] = useState('');
    const [message, setMessage] = useState('');
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setUsername(localStorage.getItem('username') || '');
        setGitlabUrl(localStorage.getItem('gitlabUrl') || 'https://gitlab.com');
        setToken(localStorage.getItem('gitlabToken') || '');
        setDefaultProjectIds(localStorage.getItem('gitlabProjectIds') || '');
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('username', username.trim());
        localStorage.setItem('gitlabUrl', gitlabUrl.trim());
        localStorage.setItem('gitlabToken', token.trim());
        localStorage.setItem('gitlabProjectIds', defaultProjectIds.trim());
        
        window.dispatchEvent(new Event('profileUpdated'));

        setMessage('تنظیمات با موفقیت ذخیره شد.');
        setTimeout(() => {
            setMessage('');
        }, 3000);
    };

    const handleClear = () => {
        setConfirmation({
            isOpen: true,
            message: "آیا از حذف نام کاربری و اطلاعات اتصال گیت‌لب مطمئن هستید؟ این عمل قابل بازگشت نیست.",
            onConfirm: () => {
                localStorage.removeItem('username');
                localStorage.removeItem('gitlabUrl');
                localStorage.removeItem('gitlabToken');
                localStorage.removeItem('gitlabProjectIds');
                
                setUsername('');
                setGitlabUrl('https://gitlab.com');
                setToken('');
                setDefaultProjectIds('');

                window.dispatchEvent(new Event('profileUpdated'));
                
                setMessage('اطلاعات پاک شد.');
                setTimeout(() => setMessage(''), 3000);
                setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
            },
        });
    };

    const handleDownload = () => {
        const settings = {
            username: localStorage.getItem('username') || '',
            gitlabUrl: localStorage.getItem('gitlabUrl') || '',
            gitlabToken: localStorage.getItem('gitlabToken') || '',
            gitlabProjectIds: localStorage.getItem('gitlabProjectIds') || '',
        };
        const dataStr = JSON.stringify(settings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        link.download = `kanban-profile-settings-${today}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error('محتوای فایل قابل خواندن نیست.');
                }
                const data = JSON.parse(result);

                // Basic validation
                if (
                    typeof data.username !== 'string' ||
                    typeof data.gitlabUrl !== 'string' ||
                    typeof data.gitlabToken !== 'string' ||
                    typeof data.gitlabProjectIds !== 'string'
                ) {
                    throw new Error('فایل JSON معتبر نیست یا فیلدهای لازم را ندارد.');
                }
                
                setConfirmation({
                    isOpen: true,
                    message: "آیا مطمئن هستید؟ با بارگذاری فایل، تمام تنظیمات پروفایل فعلی شما با محتوای این فایل جایگزین خواهد شد.",
                    onConfirm: () => {
                        setUsername(data.username);
                        setGitlabUrl(data.gitlabUrl);
                        setToken(data.gitlabToken);
                        setDefaultProjectIds(data.gitlabProjectIds);
                        
                        localStorage.setItem('username', data.username);
                        localStorage.setItem('gitlabUrl', data.gitlabUrl);
                        localStorage.setItem('gitlabToken', data.gitlabToken);
                        localStorage.setItem('gitlabProjectIds', data.gitlabProjectIds);

                        window.dispatchEvent(new Event('profileUpdated'));

                        setMessage('تنظیمات با موفقیت بارگذاری شد.');
                        setTimeout(() => setMessage(''), 3000);
                        
                        setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
                    },
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته در هنگام پردازش فایل.';
                setMessage(`خطا: ${errorMessage}`);
                setTimeout(() => setMessage(''), 5000);
            } finally {
                if (e.target) e.target.value = '';
            }
        };
        reader.onerror = () => {
             setMessage('خطا در خواندن فایل.');
             setTimeout(() => setMessage(''), 5000);
             if (e.target) e.target.value = '';
        }
        reader.readAsText(file);
    };

  return (
    <>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        confirmText="بله، جایگزین کن"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".json"
      />
      <div className="flex flex-col items-center justify-start pt-8 h-full w-full">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">پروفایل و تنظیمات</h1>
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                  {/* User Info Section */}
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <UserIcon />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">اطلاعات کاربر</h2>
                  </div>
                  <div>
                      <label htmlFor="profile-username" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">نام نمایشی</label>
                      <input
                          type="text" 
                          id="profile-username" 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          placeholder="نام شما که در نوار کناری نمایش داده می‌شود"
                      />
                  </div>

                  {/* GitLab Section */}
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <GitLabIcon />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">اتصال به گیت‌لب</h2>
                  </div>
                  <div>
                      <label htmlFor="profile-gitlab-url" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">آدرس گیت‌لب</label>
                      <input
                          type="text" 
                          id="profile-gitlab-url" 
                          value={gitlabUrl} 
                          onChange={(e) => setGitlabUrl(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left dir-ltr"
                      />
                  </div>
                  <div>
                      <label htmlFor="profile-access-token" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">توکن دسترسی شخصی</label>
                      <input
                          type="password" 
                          id="profile-access-token" 
                          value={token} 
                          onChange={(e) => setToken(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left dir-ltr"
                          placeholder="برای تغییر، توکن جدید را وارد کنید"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          توکن باید دسترسی <code className="bg-slate-200 dark:bg-slate-700 rounded p-0.5 text-xs">read_api</code> داشته باشد. این اطلاعات فقط در مرورگر شما ذخیره می‌شود.
                      </p>
                  </div>
                  <div>
                      <label htmlFor="profile-project-ids" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">شناسه‌های پروژه پیش‌فرض</label>
                      <input
                          type="text"
                          id="profile-project-ids"
                          value={defaultProjectIds}
                          onChange={(e) => setDefaultProjectIds(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left dir-ltr"
                          placeholder="شناسه‌ها را با کاما جدا کنید. مثال: 123,456"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          این شناسه‌ها به صورت پیش‌فرض در پنجره وارد کردن از گیت‌لب قرار می‌گیرند.
                      </p>
                  </div>

                  <div className="flex justify-between items-center gap-4 mt-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
                            title="بارگذاری تنظیمات از فایل"
                        >
                            <UploadIcon />
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
                            title="دانلود تنظیمات در فایل"
                        >
                            <DownloadIcon />
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-rose-900/50 dark:hover:bg-rose-900 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
                            title="پاک کردن همه اطلاعات پروفایل"
                        >
                            <TrashIcon />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                          {message && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold transition-opacity duration-300">{message}</span>}
                          <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700">ذخیره</button>
                      </div>
                  </div>
              </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileView;
