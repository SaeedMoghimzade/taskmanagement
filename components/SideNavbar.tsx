import React, { useState, useEffect } from 'react';
import { KanbanIcon } from './icons/KanbanIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { LogoIcon } from './icons/LogoIcon';
import { TreeIcon } from './icons/TreeIcon';
import { BuilderIcon } from './icons/BuilderIcon';
import { AIAssistantIcon } from './icons/AIAssistantIcon';
import { GitLabIcon } from './icons/GitLabIcon';
import { ProfileIcon } from './icons/ProfileIcon';

type View = 'kanban' | 'timeline' | 'reports' | 'tree' | 'report-builder' | 'ai-assistant' | 'gitlab-tasks' | 'profile';

interface SideNavbarProps {
  view: View;
  setView: (view: View) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, isExpanded, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full h-14 px-5 text-lg font-semibold rounded-xl transition-all duration-200 overflow-hidden ${
      isActive
        ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'
    }`}
    aria-pressed={isActive}
  >
    <div className="flex-shrink-0">{icon}</div>
    <span className={`mr-4 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
      {label}
    </span>
  </button>
);

const SideNavbar: React.FC<SideNavbarProps> = ({
  view,
  setView,
  theme,
  toggleTheme,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const updateUsername = () => {
        setUsername(localStorage.getItem('username') || '');
    };

    updateUsername(); // Initial load

    window.addEventListener('profileUpdated', updateUsername);

    return () => {
        window.removeEventListener('profileUpdated', updateUsername);
    };
  }, []);


  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`relative flex flex-col h-full bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-24'
      }`}
    >
      <div className="flex items-center justify-center h-24 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 px-4">
         <div className="flex items-center w-full overflow-hidden">
            <LogoIcon />
            <div className={`flex flex-col mr-3 transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    تسک‌ها
                </span>
                {username && (
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap -mt-1">
                        {username}
                    </span>
                )}
            </div>
         </div>
      </div>

      <nav className="flex-1 flex flex-col gap-3 p-4">
        <NavLink icon={<KanbanIcon />} label="کانبان" isActive={view === 'kanban'} isExpanded={isExpanded} onClick={() => setView('kanban')} />
        <NavLink icon={<TimelineIcon />} label="خط زمانی" isActive={view === 'timeline'} isExpanded={isExpanded} onClick={() => setView('timeline')} />
        <NavLink icon={<ChartBarIcon />} label="گزارش‌ها" isActive={view === 'reports'} isExpanded={isExpanded} onClick={() => setView('reports')} />
        <NavLink icon={<BuilderIcon />} label="گزارش ساز" isActive={view === 'report-builder'} isExpanded={isExpanded} onClick={() => setView('report-builder')} />
        <NavLink icon={<AIAssistantIcon />} label="دستیار هوش مصنوعی" isActive={view === 'ai-assistant'} isExpanded={isExpanded} onClick={() => setView('ai-assistant')} />
        <NavLink icon={<GitLabIcon />} label="تسک‌های گیت‌لب" isActive={view === 'gitlab-tasks'} isExpanded={isExpanded} onClick={() => setView('gitlab-tasks')} />
        <NavLink icon={<TreeIcon />} label="نمای درختی" isActive={view === 'tree'} isExpanded={isExpanded} onClick={() => setView('tree')} />
        
        <div className="flex-grow" />
        
        <NavLink icon={<ProfileIcon />} label="پروفایل" isActive={view === 'profile'} isExpanded={isExpanded} onClick={() => setView('profile')} />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button
            onClick={toggleTheme}
            className={`flex items-center w-full h-14 px-5 text-lg font-semibold rounded-xl transition-all duration-200 overflow-hidden text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200`}
            aria-label="تغییر تم"
        >
            <div className="flex-shrink-0">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </div>
            <span className={`mr-4 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                {theme === 'light' ? 'حالت تاریک' : 'حالت روشن'}
            </span>
        </button>
      </div>
    </aside>
  );
};

export default SideNavbar;