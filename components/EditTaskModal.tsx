
import React, { useState, useEffect, useMemo } from 'react';
import { type Task, type Label } from '../types';
import { SubtaskIcon } from './icons/SubtaskIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { StopwatchIcon } from './icons/StopwatchIcon';
import MultiSelectDropdown from './MultiSelectDropdown';
import { FlagIcon } from './icons/FlagIcon';
import { GitLabIcon } from './icons/GitLabIcon';


interface EditTaskModalProps {
  onClose: () => void;
  onUpdateTask: (taskId: string, title: string, description: string, assignee: string, labels: string[], parentId?: string, startDate?: string, duration?: number) => void;
  onDeleteTask: (taskId: string) => void;
  task: Task;
  allTasks: Task[];
  availableLabels: Label[];
  onAddLabel: (id: string, color: string) => Promise<boolean>;
  onSelectTask: (task: Task) => void;
}

const formatTimeSpent = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0د';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(`${h}س`);
    if (m > 0) parts.push(`${m}د`);
    return parts.join(' ');
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({ onClose, onUpdateTask, onDeleteTask, task, allTasks, availableLabels, onAddLabel, onSelectTask }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [parentId, setParentId] = useState(task.parentId || '');
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [duration, setDuration] = useState<number | ''>(task.duration ?? '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignee(task.assignee || '');
      setParentId(task.parentId || '');
      setStartDate(task.startDate || '');
      setDuration(task.duration ?? '');
      setSelectedLabels(task.labels || []);
    }
  }, [task]);
  
  const { potentialParents, childTasks } = useMemo(() => {
    const getDescendantIds = (taskId: string): string[] => {
      const children = allTasks.filter(t => t.parentId === taskId);
      return children.flatMap(child => [child.id, ...getDescendantIds(child.id)]);
    };
    
    const descendantIds = new Set(getDescendantIds(task.id));
    const potentialParents = allTasks.filter(p => p.id !== task.id && !descendantIds.has(p.id));
    const childTasks = allTasks.filter(t => t.parentId === task.id);
    
    return { potentialParents, childTasks };
  }, [task.id, allTasks]);

  const isParent = childTasks.length > 0;

  const getTotalTimeSpent = (taskId: string, allTasks: Task[]): number => {
    const currentTask = allTasks.find(t => t.id === taskId);
    if (!currentTask) return 0;

    const childrenOfTask = allTasks.filter(t => t.parentId === taskId);
    const childrenTime = childrenOfTask.reduce((total, child) => total + getTotalTimeSpent(child.id, allTasks), 0);

    return (currentTask.timeSpent || 0) + childrenTime;
  };

  const displayTimeSpent = isParent ? getTotalTimeSpent(task.id, allTasks) : task.timeSpent;
  const timeSpentLabel = isParent ? "مجموع سپری شده:" : "سپری شده:";


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTask(task.id, title.trim(), description.trim(), assignee.trim(), selectedLabels, parentId || undefined, startDate || undefined, duration === '' ? undefined : Number(duration));
    }
  };

  const handleDelete = () => {
    onDeleteTask(task.id);
  }
  
  const handleSelectChild = (childTask: Task) => {
      onSelectTask(childTask); // Seamlessly switch to the child task
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto"
      onClick={onClose} aria-modal="true" role="dialog"
    >
      <div
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ویرایش تسک</h2>
                {task.gitlabUrl && (
                  <a
                    href={task.gitlabUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600 font-semibold text-sm"
                  >
                    <GitLabIcon />
                    <span>گیت‌لب</span>
                  </a>
              )}
            </div>
            
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-900/70 rounded-lg text-sm flex flex-wrap gap-x-6 gap-y-2 border border-slate-200 dark:border-slate-700">
                {task.creationDate && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title="تاریخ ثبت">
                        <CalendarPlusIcon />
                        <strong className="font-semibold">ثبت:</strong>
                        <span>{new Date(task.creationDate).toLocaleDateString('fa-IR')}</span>
                    </div>
                )}
                {displayTimeSpent != null && displayTimeSpent > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title={isParent ? "زمان سپری شده (مجموع والد و فرزندان)" : "زمان سپری شده"}>
                        <StopwatchIcon />
                        <strong className="font-semibold">{timeSpentLabel}</strong>
                        <span>{formatTimeSpent(displayTimeSpent)}</span>
                    </div>
                )}
                {task.milestone && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" title={`مایل‌استون: ${task.milestone.title}`}>
                      <FlagIcon />
                      <strong className="font-semibold">مایل‌استون:</strong>
                      <span className="truncate">{task.milestone.title}</span>
                      {task.milestone.dueDate && (
                          <span className="text-xs mr-1">
                              (تا: {new Date(task.milestone.dueDate).toLocaleDateString('fa-IR')})
                          </span>
                      )}
                  </div>
                )}
            </div>

            <form id="edit-task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="edit-title" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">عنوان</label>
                <input
                  type="text" id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  required autoFocus
                />
              </div>
              <div>
                <label htmlFor="edit-parent" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تسک والد</label>
                <select
                  id="edit-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                >
                    <option value="">هیچکدام</option>
                    {potentialParents.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">توضیحات</label>
                <textarea
                  id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 h-28 resize-none transition-all"
                ></textarea>
              </div>
              <div>
                <label htmlFor="edit-assignee" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">واگذار شده به</label>
                <input
                  type="text" id="edit-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  placeholder="نام شخص"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-startDate" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تاریخ شروع</label>
                  <input type="date" id="edit-startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-duration" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">مدت زمان (روز)</label>
                  <input type="number" id="edit-duration" value={duration} min="0"
                    onChange={(e) => setDuration(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                    placeholder="مثلا: ۳"
                    className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">لیبل‌ها</label>
                 <MultiSelectDropdown
                  availableLabels={availableLabels}
                  selectedLabels={selectedLabels}
                  onLabelChange={setSelectedLabels}
                  onAddLabel={onAddLabel}
                />
              </div>
              
              {childTasks.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <h3 className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2 font-semibold">
                    <SubtaskIcon />
                    <span>تسک‌های فرزند ({childTasks.length})</span>
                  </h3>
                  <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2">
                    {childTasks.map(child => (
                        <li key={child.id}>
                           <button
                              type="button"
                              onClick={() => handleSelectChild(child)}
                              className="w-full flex items-center gap-2 text-right p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                           >
                             <span className={`h-2 w-2 rounded-full flex-shrink-0 ${child.completionDate ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                             <span>{child.title}</span>
                           </button>
                        </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
        </div>

        <div className="px-8 py-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center gap-4">
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
                  >
                    حذف تسک
                </button>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">لغو</button>
                    <button type="submit" form="edit-task-form" className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700">ذخیره</button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default EditTaskModal;
