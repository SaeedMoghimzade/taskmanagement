import React from 'react';
import { type Label } from '../types';
import MultiSelectDropdown from './MultiSelectDropdown';
import { XMarkIcon } from './icons/XMarkIcon';

export const UNASSIGNED_KEY = '##UNASSIGNED##';
export const NO_MILESTONE_KEY = '##NO_MILESTONE##';

export interface FiltersState {
  assignee: string | 'all';
  milestone: string | 'all';
  labels: string[];
}

interface GitLabTaskFiltersProps {
  availableAssignees: string[];
  availableMilestones: string[];
  availableLabels: Label[];
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  onClearFilters: () => void;
}

const GitLabTaskFilters: React.FC<GitLabTaskFiltersProps> = ({
  availableAssignees,
  availableMilestones,
  availableLabels,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl mb-6 border border-slate-200 dark:border-slate-800 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        
        <div>
          <label htmlFor="gitlab-assignee-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">واگذار شده به</label>
          <select
            id="gitlab-assignee-filter"
            value={filters.assignee}
            onChange={e => onFilterChange({ assignee: e.target.value })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            {availableAssignees.map(name => {
              if (name === UNASSIGNED_KEY) {
                return <option key={name} value={name}>واگذار نشده</option>;
              }
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
        </div>

        <div>
          <label htmlFor="gitlab-milestone-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مایل‌استون</label>
          <select
            id="gitlab-milestone-filter"
            value={filters.milestone}
            onChange={e => onFilterChange({ milestone: e.target.value })}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
          >
            <option value="all">همه</option>
            {availableMilestones.map(title => {
                if (title === NO_MILESTONE_KEY) {
                    return <option key={title} value={title}>بدون مایل‌استون</option>;
                }
                return <option key={title} value={title}>{title}</option>;
            })}
          </select>
        </div>
        
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">فیلتر بر اساس لیبل</label>
          <MultiSelectDropdown
            availableLabels={availableLabels}
            selectedLabels={filters.labels}
            onLabelChange={selected => onFilterChange({ labels: selected })}
            creatable={false}
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

export default GitLabTaskFilters;