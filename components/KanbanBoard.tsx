
import React, { useState, useMemo, useRef, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';
import KanbanFilters, { type FiltersState } from './KanbanFilters';
import { type Task, type Column, type Label } from '../types';
import { FilterIcon } from './icons/FilterIcon';
import { PlusIcon } from './icons/PlusIcon';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon';
import { GitLabIcon } from './icons/GitLabIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon';
import { SyncIcon } from './icons/SyncIcon';
import { XMarkIcon } from './icons/XMarkIcon';


interface KanbanBoardProps {
  columns: Column[];
  tasks: Task[];
  allTasks: Task[]; // Use allTasks for filtering context
  labels: Label[];
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onReorderTask: (draggedTaskId: string, targetTaskId: string) => void;
  onDeleteTask: (taskId:string) => void;
  onSelectTask: (task: Task) => void;
  onAddLabel: (id: string, color: string) => Promise<boolean>;
  onNewTask: () => void;
  onManageColumns: () => void;
  onGitLabImport: () => void;
  onImport: () => void;
  onExport: () => void;
  onSyncGitLabTask: (taskId: string) => Promise<void>;
  onSyncAllGitLabTasks: () => Promise<void>;
}

const initialFilters: FiltersState = {
  parentChild: 'all',
  assignee: 'all',
  milestone: 'all',
  startDate: 'all',
  duration: 'all',
  labels: [],
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  columns, 
  tasks,
  allTasks, 
  labels, 
  onUpdateTaskStatus, 
  onReorderTask,
  onDeleteTask, 
  onSelectTask,
  onAddLabel,
  onNewTask,
  onManageColumns,
  onGitLabImport,
  onImport,
  onExport,
  onSyncGitLabTask,
  onSyncAllGitLabTasks
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const dataMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
        setIsDataMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (newFilters: Partial<FiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };
  
  const handleFocusTask = (taskId: string) => {
    setFocusedTaskId(taskId);
  };

  const handleClearFocus = () => {
    setFocusedTaskId(null);
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
        await onSyncAllGitLabTasks();
    } catch(error) {
        console.error("Failed to sync all tasks:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred during sync.");
    } finally {
        setIsSyncingAll(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let tasksToFilter = tasks;
    
    // 1. Apply focus mode filter first if active
    if (focusedTaskId) {
        const baseTask = allTasks.find(t => t.id === focusedTaskId);
        if (baseTask) {
            const familyParentId = baseTask.parentId || baseTask.id;
            const familyTaskIds = new Set(
                allTasks.filter(t => t.id === familyParentId || t.parentId === familyParentId).map(t => t.id)
            );
            tasksToFilter = tasksToFilter.filter(t => familyTaskIds.has(t.id));
        } else {
             // If focused task is not found, clear focus
            setFocusedTaskId(null);
        }
    }
    
    // 2. Apply standard filters
    const UNASSIGNED_KEY = '##UNASSIGNED##';
    const NO_MILESTONE_KEY = '##NO_MILESTONE##';

    return tasksToFilter.filter(task => {
      // Parent/Child filter
      const isChild = !!task.parentId;
      if (filters.parentChild === 'parent' && isChild) return false;
      if (filters.parentChild === 'child' && !isChild) return false;

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === UNASSIGNED_KEY) {
          if (task.assignee) return false;
        } else {
          if (task.assignee !== filters.assignee) return false;
        }
      }

      // Milestone filter
      if (filters.milestone !== 'all') {
        if (filters.milestone === NO_MILESTONE_KEY) {
          if (task.milestone) return false;
        } else {
          if (task.milestone?.title !== filters.milestone) return false;
        }
      }

      // Start date filter
      if (filters.startDate === 'yes' && !task.startDate) {
        return false;
      }
      if (filters.startDate === 'no' && !!task.startDate) {
        return false;
      }
      
      // Duration filter
      const hasValidDuration = task.duration !== undefined && task.duration !== null && task.duration > 0;
      if (filters.duration === 'yes' && !hasValidDuration) {
        return false;
      }
      if (filters.duration === 'no' && hasValidDuration) {
        return false;
      }

      // Labels filter (task must have at least one of the selected labels)
      if (filters.labels.length > 0) {
        if (!task.labels || task.labels.length === 0) return false;
        const taskHasLabel = filters.labels.some(filterLabel => task.labels!.includes(filterLabel));
        if (!taskHasLabel) return false;
      }

      return true;
    });
  }, [tasks, allTasks, filters, focusedTaskId]);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.parentChild !== 'all') count++;
    if (filters.assignee !== 'all') count++;
    if (filters.milestone !== 'all') count++;
    if (filters.startDate !== 'all') count++;
    if (filters.duration !== 'all') count++;
    if (filters.labels.length > 0) count++;
    return count;
  }, [filters]);


  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center gap-4 flex-shrink-0">
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold shadow-md hover:bg-sky-700 transition-colors transform hover:scale-105 active:scale-100"
        >
          <PlusIcon />
          <span>تسک جدید</span>
        </button>

        <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <SyncIcon isSyncing={isSyncingAll} />
              <span>همگام‌سازی همه</span>
            </button>
            <button
              onClick={onManageColumns}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <AdjustmentsIcon />
              <span>مدیریت ستون‌ها</span>
            </button>
            <button
                onClick={() => setShowFilters(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
                aria-expanded={showFilters}
                aria-controls="kanban-filters"
            >
                <FilterIcon />
                <span>فیلترها</span>
                {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                        {activeFilterCount}
                    </span>
                )}
            </button>
            <div className="relative" ref={dataMenuRef}>
                <button
                    onClick={() => setIsDataMenuOpen(prev => !prev)}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="گزینه‌های داده"
                    aria-haspopup="true"
                    aria-expanded={isDataMenuOpen}
                >
                    <EllipsisVerticalIcon />
                </button>
                 {isDataMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 origin-top-left bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-30 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => { onGitLabImport(); setIsDataMenuOpen(false); }}
                        className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <GitLabIcon />
                        <span>وارد کردن از گیت‌لب</span>
                        </button>
                        <button onClick={() => { onImport(); setIsDataMenuOpen(false); }}
                        className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <UploadIcon />
                        <span>بارگذاری فایل...</span>
                        </button>
                        <button onClick={() => { onExport(); setIsDataMenuOpen(false); }}
                        className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <DownloadIcon />
                        <span>دریافت خروجی</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
     
      {showFilters && (
        <div id="kanban-filters" className="flex-shrink-0">
            <KanbanFilters
            allTasks={allTasks}
            availableLabels={labels}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onAddLabel={onAddLabel}
            />
        </div>
      )}

       {focusedTaskId && (
        <div className="p-3 mb-4 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex justify-between items-center border border-sky-200 dark:border-sky-800 shadow-sm transition-all animate-pulse-once">
            <p className="text-sky-800 dark:text-sky-200 font-semibold">
              نمایش متمرکز: فقط تسک‌های مرتبط نمایش داده می‌شوند.
            </p>
            <button
              onClick={handleClearFocus}
              className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <XMarkIcon />
              <span>نمایش همه تسک‌ها</span>
            </button>
          </div>
      )}

      <main className="flex gap-6 overflow-x-auto pb-4 flex-grow min-h-0">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            columnId={column.id}
            title={column.title}
            tasks={filteredTasks.filter((task) => task.status === column.id)}
            allTasks={allTasks}
            labels={labels}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onReorderTask={onReorderTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={onSelectTask}
            onSyncGitLabTask={onSyncGitLabTask}
            onFocusTask={handleFocusTask}
          />
        ))}
      </main>
    </div>
  );
};

export default KanbanBoard;
