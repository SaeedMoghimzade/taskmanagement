
import React, { useMemo } from 'react';
import { type Task, type Label } from '../types';
import MultiSelectDropdown from './MultiSelectDropdown';
import { XMarkIcon } from './icons/XMarkIcon';

export interface FiltersState {
  parentChild: 'all' | 'parent' | 'child';
  assignee: string; // 'all' or assignee name
  milestone: string; // 'all' or milestone title
  startDate: 'all' | 'yes' | 'no';
  duration: 'all' | 'yes' | 'no';
  labels: string[];
}

interface KanbanFiltersProps {
  allTasks: Task[];
  availableLabels: Label[];
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  onClearFilters: () => void;
  onAddLabel?: (id: string, color: string) => Promise<boolean>;
}

const UNASSIGNED_KEY = '##UNASSIGNED##';
const NO_MILESTONE_KEY = '##NO_MILESTONE##';

const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  allTasks,
  availableLabels,
  filters,
  onFilterChange,
  onClearFilters,
  onAddLabel
}) => {
  const { uniqueAssignees, uniqueMilestones } = useMemo(() => {
    const assignees = new Set<string>();
    const milestones = new Set<string>();
    let hasUnassigned = false;
    let hasNoMilestone = false;

    allTasks.forEach(task => {
      if (task.assignee) {
        assignees.add(task.assignee);
      } else {
        hasUnassigned = true;
      }
      if (task.milestone?.title) {
        milestones.add(task.milestone.title);
      } else {
        hasNoMilestone = true;
      }
    });

    const sortedAssignees = Array.from(assignees).sort();
    if (hasUnassigned) {
      sortedAssignees.unshift(UNASSIGNED_KEY);
    }
    const sortedMilestones = Array.from(milestones).sort();
    if (hasNoMilestone) {
      sortedMilestones.unshift(NO_MILESTONE_KEY);
    }
    
    return {
      uniqueAssignees: sortedAssignees,
      uniqueMilestones: sortedMilestones,
    };
  }, [allTasks]);

  return (
    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl mb-6 border border-slate-200 dark:border-slate-800 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        {/* Parent/Child Filter */}
        <div>
          <label htmlFor="parent-child-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع تسک</label>
          <select
            id="parent-child-filter"
            value={filters.parentChild}
            onChange={e => onFilterChange({ parentChild: e.target.value as FiltersState['parentChild'] })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه تسک‌ها</option>
            <option value="parent">تسک‌های اصلی</option>
            <option value="child">زیرتسک‌ها</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label htmlFor="assignee-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">واگذار شده به</label>
          <select
            id="assignee-filter"
            value={filters.assignee}
            onChange={e => onFilterChange({ assignee: e.target.value })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            {uniqueAssignees.map(name => {
              if (name === UNASSIGNED_KEY) {
                return <option key={name} value={name}>واگذار نشده</option>
              }
              return <option key={name} value={name}>{name}</option>
            })}
          </select>
        </div>

        {/* Milestone Filter */}
        <div>
          <label htmlFor="milestone-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مایل‌استون (اسپرینت)</label>
          <select
            id="milestone-filter"
            value={filters.milestone}
            onChange={e => onFilterChange({ milestone: e.target.value })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            {uniqueMilestones.map(title => {
              if (title === NO_MILESTONE_KEY) {
                return <option key={title} value={title}>بدون مایل‌استون</option>
              }
              return <option key={title} value={title}>{title}</option>
            })}
          </select>
        </div>
        
        {/* Start Date Filter */}
        <div>
          <label htmlFor="start-date-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تاریخ شروع</label>
          <select
            id="start-date-filter"
            value={filters.startDate}
            onChange={e => onFilterChange({ startDate: e.target.value as 'all' | 'yes' | 'no' })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            <option value="yes">دارد</option>
            <option value="no">ندارد</option>
          </select>
        </div>

        {/* Duration Filter */}
        <div>
          <label htmlFor="duration-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مدت زمان</label>
          <select
            id="duration-filter"
            value={filters.duration}
            onChange={e => onFilterChange({ duration: e.target.value as 'all' | 'yes' | 'no' })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            <option value="yes">دارد</option>
            <option value="no">ندارد</option>
          </select>
        </div>


        {/* Label Filter */}
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">فیلتر بر اساس لیبل</label>
          <MultiSelectDropdown
            availableLabels={availableLabels}
            selectedLabels={filters.labels}
            onLabelChange={selected => onFilterChange({ labels: selected })}
            onAddLabel={onAddLabel}
            creatable={!!onAddLabel}
          />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700 flex justify-end">
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900 rounded-lg transition-colors border border-rose-200 dark:border-rose-800 text-sm font-semibold"
        >
          <XMarkIcon />
          <span>پاک کردن فیلترها</span>
        </button>
      </div>
    </div>
  );
};

export default KanbanFilters;
