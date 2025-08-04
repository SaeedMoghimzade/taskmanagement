
import React, { useState } from 'react';
import { type Column, type Task } from '../types';

interface GitLabIssue {
    id: number;
    iid: number;
    title: string;
    web_url: string;
    assignee: { name:string } | null;
    labels: string[];
}

interface MoveToKanbanModalProps {
    issue: GitLabIssue;
    columns: Column[];
    allTasks: Task[];
    onClose: () => void;
    onConfirm: (columnId: string, parentId?: string) => void;
}

const MoveToKanbanModal: React.FC<MoveToKanbanModalProps> = ({ issue, columns, allTasks, onClose, onConfirm }) => {
    const [selectedColumn, setSelectedColumn] = useState<string>(columns.length > 0 ? columns[0].id : '');
    const [selectedParent, setSelectedParent] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedColumn) {
            alert("لطفا یک ستون را انتخاب کنید.");
            return;
        }
        onConfirm(selectedColumn, selectedParent || undefined);
    };

    return (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-task-title"
        >
            <div
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md my-8"
              onClick={(e) => e.stopPropagation()}
            >
                <h2 id="move-task-title" className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">انتقال تسک به کانبان</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    تسک «<strong className="font-semibold">{issue.title}</strong>» به کدام ستون منتقل شود؟
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="target-column" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">ستون مقصد</label>
                        <select
                            id="target-column"
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                            required
                        >
                            {columns.map(col => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="parent-task" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تسک والد (اختیاری)</label>
                        <select
                            id="parent-task"
                            value={selectedParent}
                            onChange={(e) => setSelectedParent(e.target.value)}
                            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        >
                            <option value="">هیچکدام</option>
                            {allTasks.map(task => (
                                <option key={task.id} value={task.id}>{task.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">لغو</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700">انتقال تسک</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoveToKanbanModal;
