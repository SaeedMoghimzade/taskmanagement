import React, { useState, useEffect, useMemo } from 'react';
import { type Task, type Label } from '../types';
import { LABEL_COLOR_PALETTE } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { SubtaskIcon } from './icons/SubtaskIcon';


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

const EditTaskModal: React.FC<EditTaskModalProps> = ({ onClose, onUpdateTask, onDeleteTask, task, allTasks, availableLabels, onAddLabel, onSelectTask }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [parentId, setParentId] = useState(task.parentId || '');
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [duration, setDuration] = useState<number | ''>(task.duration ?? '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_PALETTE[0].class);

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

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleCreateNewLabel = async () => {
    if (!newLabelName.trim()) {
      alert("نام لیبل نمی‌تواند خالی باشد.");
      return;
    }
    const success = await onAddLabel(newLabelName.trim(), newLabelColor);
    if(success) {
      handleLabelToggle(newLabelName.trim());
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_PALETTE[0].class);
      setIsCreatingLabel(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTask(task.id, title.trim(), description.trim(), assignee.trim(), selectedLabels, parentId || undefined, startDate || undefined, duration === '' ? undefined : Number(duration));
    }
  };

  const handleDelete = () => {
    onDeleteTask(task.id);
    onClose();
  }
  
  const handleSelectChild = (childTask: Task) => {
      onClose(); // Close current modal
      onSelectTask(childTask); // Open child modal
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
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">ویرایش تسک</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex flex-wrap gap-2">
              {availableLabels.map(label => {
                const isSelected = selectedLabels.includes(label.id);
                return (
                  <button type="button" key={label.id} onClick={() => handleLabelToggle(label.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${label.color} ${
                      isSelected ? `ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800 ring-sky-500` : `opacity-80 hover:opacity-100`
                    }`}
                  >{label.id}</button>
                );
              })}
              {!isCreatingLabel && (
                <button type="button" onClick={() => setIsCreatingLabel(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-colors border-2 border-dashed border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-500 dark:hover:border-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <PlusIcon />
                  <span>لیبل جدید</span>
                </button>
              )}
            </div>
          </div>
          {isCreatingLabel && (
             <div className="p-4 bg-slate-100 dark:bg-slate-900/70 rounded-lg flex flex-col gap-4 border border-slate-200 dark:border-slate-700">
              <input type="text" placeholder="نام لیبل جدید..." value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
              <div>
                <span className="block text-slate-600 dark:text-slate-400 text-sm mb-2">انتخاب رنگ</span>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {LABEL_COLOR_PALETTE.map(color => (
                    <button type="button" key={color.class} onClick={() => setNewLabelColor(color.class)}
                      className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newLabelColor === color.class ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-sky-500' : 'border-transparent'}`}
                      aria-label={color.name}
                    ></button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingLabel(false)} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm border border-slate-300 dark:border-slate-600">لغو</button>
                <button type="button" onClick={handleCreateNewLabel} className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm">افزودن لیبل</button>
              </div>
            </div>
          )}

          {childTasks.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2 font-semibold">
                <SubtaskIcon />
                <span>تسک‌های فرزند ({childTasks.length})</span>
              </h3>
              <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2">
                {childTasks.map(child => (
                    <li key={child.id} className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer" onClick={() => handleSelectChild(child)}>
                      - {child.title}
                    </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center gap-4 mt-4">
            <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
              >
                حذف تسک
            </button>
            <div className="flex items-center gap-4">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">لغو</button>
                <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700">ذخیره</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
