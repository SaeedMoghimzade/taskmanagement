
import React, { useState, useMemo } from 'react';
import { type Task, type Label, type Column } from '../types';
import TaskStatusChart from './charts/TaskStatusChart';
import AssigneeWorkloadChart from './charts/AssigneeWorkloadChart';
import LabelUsageChart from './charts/LabelUsageChart';
import AssigneeTimeChart from './charts/AssigneeTimeChart';
import KanbanFilters, { type FiltersState } from './KanbanFilters';
import { FilterIcon } from './icons/FilterIcon';


interface ReportsViewProps {
  tasks: Task[];
  labels: Label[];
  columns: Column[];
  theme: 'light' | 'dark';
}

const initialFilters: FiltersState = {
  parentChild: 'all',
  assignee: 'all',
  milestone: 'all',
  startDate: 'all',
  duration: 'all',
  labels: [],
};

const ReportsView: React.FC<ReportsViewProps> = ({ tasks, labels, columns, theme }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FiltersState>(initialFilters);

    const handleFilterChange = (newFilters: Partial<FiltersState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
    };

    const filteredTasks = useMemo(() => {
        const UNASSIGNED_KEY = '##UNASSIGNED##';
        const NO_MILESTONE_KEY = '##NO_MILESTONE##';

        return tasks.filter(task => {
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
    }, [tasks, filters]);
    
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
    
    if (tasks.length === 0) {
        return (
            <div className="flex justify-center items-center h-[50vh] bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xl text-slate-600 dark:text-slate-400">داده‌ای برای نمایش گزارش وجود ندارد.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="flex justify-between items-center flex-shrink-0">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">گزارش‌ها</h1>
                <button
                    onClick={() => setShowFilters(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
                    aria-expanded={showFilters}
                    aria-controls="reports-filters"
                >
                    <FilterIcon />
                    <span>فیلترها</span>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </header>
            
            {showFilters && (
                 <div id="reports-filters">
                    <KanbanFilters
                        allTasks={tasks}
                        availableLabels={labels}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            )}

            {filteredTasks.length === 0 && activeFilterCount > 0 ? (
                 <div className="flex justify-center items-center h-[40vh] bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xl text-slate-600 dark:text-slate-400">هیچ تسکی با فیلترهای اعمال شده مطابقت ندارد.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <TaskStatusChart tasks={filteredTasks} columns={columns} theme={theme} />
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <AssigneeWorkloadChart tasks={filteredTasks} theme={theme} />
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <LabelUsageChart tasks={filteredTasks} labels={labels} theme={theme} />
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <AssigneeTimeChart tasks={filteredTasks} theme={theme} />
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsView;
