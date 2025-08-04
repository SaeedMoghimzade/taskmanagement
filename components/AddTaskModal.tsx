import React, { useState } from 'react';
import { type Label, type Task } from '../types';
import MultiSelectDropdown from './MultiSelectDropdown';

interface AddTaskModalProps {
  onClose: () => void;
  onAddTask: (title: string, description: string, assignee: string, labels: string[], parentId?: string, startDate?: string, duration?: number) => void;
  availableLabels: Label[];
  allTasks: Task[];
  onAddLabel: (id: string, color: string) => Promise<boolean>;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAddTask, availableLabels, allTasks, onAddLabel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [parentId, setParentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask(title.trim(), description.trim(), assignee.trim(), selectedLabels, parentId || undefined, startDate || undefined, duration === '' ? undefined : Number(duration));
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">ساخت تسک جدید</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="title" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">عنوان</label>
            <input
              type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              required autoFocus
            />
          </div>
          <div>
            <label htmlFor="parent" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تسک والد (اختیاری)</label>
            <select
              id="parent" value={parentId} onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            >
              <option value="">هیچکدام</option>
              {allTasks.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">توضیحات</label>
            <textarea
              id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 h-28 resize-none transition-all"
            ></textarea>
          </div>
          <div>
            <label htmlFor="assignee" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">واگذار شده به</label>
            <input
              type="text" id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="نام شخص"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تاریخ شروع</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">مدت زمان (روز)</label>
              <input type="number" id="duration" value={duration} min="0"
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

          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">لغو</button>
            <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700">افزودن</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
