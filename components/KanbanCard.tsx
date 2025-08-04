
import React, { useState } from 'react';
import { type Task, type Label } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckIcon } from './icons/CheckIcon';
import { UserIcon } from './icons/UserIcon';
import { SubtaskIcon } from './icons/SubtaskIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { StopwatchIcon } from './icons/StopwatchIcon';
import { FlagIcon } from './icons/FlagIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { SyncIcon } from './icons/SyncIcon';
import { FamilyTreeIcon } from './icons/FamilyTreeIcon';

interface KanbanCardProps {
  task: Task;
  allTasks: Task[];
  labels: Label[];
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onSyncGitLabTask: (taskId: string) => Promise<void>;
  onFocusTask: (taskId: string) => void;
}

const getLabelStyle = (labelId: string, availableLabels: Label[]): string => {
  const label = availableLabels.find(l => l.id === labelId);
  return label ? label.color : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-400'; // Fallback
};

const formatTimeSpent = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0د';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(`${h}س`);
    if (m > 0) parts.push(`${m}د`);
    return parts.join(' ');
};


const KanbanCard: React.FC<KanbanCardProps> = ({ task, allTasks, labels, onDeleteTask, onSelectTask, onSyncGitLabTask, onFocusTask }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('draggedTaskId', task.id);
    e.dataTransfer.setData('sourceColumnId', task.status);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocusTask(task.id);
  };
  
  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
        await onSyncGitLabTask(task.id);
    } catch (error) {
        console.error("Sync failed on card:", error);
        alert(error instanceof Error ? error.message : `همگام‌سازی تسک «${task.title}» ناموفق بود.`);
    } finally {
        setIsSyncing(false);
    }
  };

  const children = allTasks.filter(t => t.parentId === task.id);
  const isParent = children.length > 0;
  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : undefined;
  
  const getTotalTimeSpent = (taskId: string, allTasks: Task[]): number => {
    const currentTask = allTasks.find(t => t.id === taskId);
    if (!currentTask) return 0;
    
    const childrenOfTask = allTasks.filter(t => t.parentId === taskId);
    const childrenTime = childrenOfTask.reduce((total, child) => total + getTotalTimeSpent(child.id, allTasks), 0);
    
    return (currentTask.timeSpent || 0) + childrenTime;
  };

  const displayTimeSpent = isParent ? getTotalTimeSpent(task.id, allTasks) : task.timeSpent;

  const hasMetaInfo = task.creationDate || task.startDate || task.duration != null || (displayTimeSpent != null && displayTimeSpent > 0) || task.completionDate || task.assignee || task.milestone;
  const hasFooterContent = isParent || (task.labels && task.labels.length > 0);


  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelectTask(task)}
      data-task-id={task.id}
      className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer active:cursor-grabbing transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-sky-500/10 group flex flex-col gap-3 ${task.parentId ? 'ml-4 border-l-4 border-l-sky-500/50' : ''}`}
    >
      <div className="flex justify-end items-center min-h-[28px]">
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
                onClick={handleFocus}
                className="text-slate-400 hover:text-purple-500 dark:text-slate-500 dark:hover:text-purple-400 transition-colors p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"
                aria-label="نمایش متمرکز"
                title="نمایش متمرکز تسک‌های مرتبط"
            >
                <FamilyTreeIcon />
            </button>
          {task.gitlabUrl && (
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full disabled:cursor-wait"
                aria-label="همگام‌سازی با گیت‌لب"
                title="همگام‌سازی با گیت‌لب"
            >
                <SyncIcon isSyncing={isSyncing} />
            </button>
          )}
          {task.gitlabUrl && (
            <a
              href={task.gitlabUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400 transition-colors p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"
              aria-label="مشاهده در گیت‌لب"
              title="مشاهده در گیت‌لب"
            >
              <ExternalLinkIcon />
            </a>
          )}
          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"
            aria-label="حذف تسک"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      
      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 break-words -mt-2">{task.title}</h3>
      
      {parentTask && (
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            فرزندِ: <span className="font-semibold">{parentTask.title}</span>
        </p>
      )}

      <p className="text-slate-600 dark:text-slate-300 text-sm break-words">
        {task.description && task.description.length > 100 
          ? `${task.description.substring(0, 100)}...` 
          : task.description}
      </p>
      
      {hasMetaInfo && (
        <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
              {task.creationDate && (
                <div className="flex items-center gap-1.5" title="تاریخ ثبت">
                  <CalendarPlusIcon />
                  <span>{new Date(task.creationDate).toLocaleDateString('fa-IR')}</span>
                </div>
              )}
              {task.startDate && (
                  <div className="flex items-center gap-1.5" title="تاریخ شروع">
                  <CalendarIcon />
                  <span>{new Date(task.startDate).toLocaleDateString('fa-IR')}</span>
                  </div>
              )}
              {typeof task.duration === 'number' && task.duration > 0 && (
                  <div className="flex items-center gap-1.5" title="زمان مورد نیاز">
                  <ClockIcon />
                  <span>{task.duration} روز</span>
                  </div>
              )}
              {displayTimeSpent != null && displayTimeSpent > 0 && (
                  <div className="flex items-center gap-1.5" title={isParent ? "زمان سپری شده (مجموع والد و فرزندان)" : "زمان سپری شده"}>
                    <StopwatchIcon />
                    <span>{formatTimeSpent(displayTimeSpent)}</span>
                  </div>
              )}
              {task.completionDate && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" title="تاریخ انجام">
                  <CheckIcon />
                  <span>{new Date(task.completionDate).toLocaleDateString('fa-IR')}</span>
                  </div>
              )}
            </div>
            {task.assignee && (
                <div className="flex items-center gap-1.5 mt-2" title="واگذار شده به">
                    <UserIcon />
                    <span>{task.assignee}</span>
                </div>
            )}
            {task.milestone && (
              <div className="flex items-center gap-1.5 mt-2 text-indigo-600 dark:text-indigo-400" title={`مایل‌استون: ${task.milestone.title}`}>
                  <FlagIcon />
                  <span className="font-semibold">{task.milestone.title}</span>
                  {task.milestone.dueDate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          (تا: {new Date(task.milestone.dueDate).toLocaleDateString('fa-IR')})
                      </span>
                  )}
              </div>
            )}
        </div>
      )}

      {hasFooterContent && (
        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-4">
            {isParent && (
                <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        <SubtaskIcon />
                        <span>تسک‌های فرزند</span>
                    </h4>
                    <ul className="space-y-1">
                        {children.map(child => (
                            <li key={child.id}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelectTask(child); }}
                                    className="w-full flex items-center gap-2.5 text-right p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title={`مشاهده تسک: ${child.title}`}
                                >
                                    <span 
                                        className={`h-2 w-2 rounded-full flex-shrink-0 ${child.completionDate ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                        title={`وضعیت: ${child.status}`}
                                    ></span>
                                    <span className="text-sm truncate">{child.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {task.labels.map((labelId) => (
                        <span
                            key={labelId}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getLabelStyle(labelId, labels)}`}
                        >
                            {labelId}
                        </span>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
