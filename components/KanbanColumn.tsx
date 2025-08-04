
import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { type Task, type Label } from '../types';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  tasks: Task[];
  allTasks: Task[];
  labels: Label[];
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onReorderTask: (draggedTaskId: string, targetTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onSyncGitLabTask: (taskId: string) => Promise<void>;
  onFocusTask: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
    columnId, 
    title, 
    tasks, 
    allTasks, 
    labels, 
    onUpdateTaskStatus, 
    onReorderTask,
    onDeleteTask, 
    onSelectTask,
    onSyncGitLabTask,
    onFocusTask
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const draggedTaskId = e.dataTransfer.getData('draggedTaskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId') as string;
    if (!draggedTaskId) return;

    const targetCardElement = (e.target as HTMLElement).closest('[data-task-id]');
    
    // Case 1: Reordering within the same column
    if (targetCardElement && sourceColumnId === columnId) {
        const targetTaskId = targetCardElement.getAttribute('data-task-id');
        if (targetTaskId && draggedTaskId !== targetTaskId) {
            onReorderTask(draggedTaskId, targetTaskId);
        }
        return;
    }
    
    // Case 2: Moving from another column to this one
    if (sourceColumnId !== columnId) {
        onUpdateTaskStatus(draggedTaskId, columnId);
    }
  };
  
  const sortedTasks = tasks.sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex flex-col flex-shrink-0 w-80"
    >
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col gap-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 shadow-lg border border-slate-200/80 dark:border-slate-800 h-full transition-all duration-300 border-t-4 border-t-slate-400 dark:border-t-slate-600 ${isDraggingOver ? 'bg-slate-200/80 dark:bg-slate-800/70' : ''}`}
            >
            <div className="p-4 flex-shrink-0">
                <div className={`flex items-center justify-between pb-2`}>
                <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">{title}</h2>
                <span className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-sm font-semibold px-2.5 py-1 rounded-full">
                    {tasks.length}
                </span>
                </div>
            </div>
             <div className="flex flex-col gap-4 flex-grow px-4 pb-4 overflow-y-auto">
                {sortedTasks.map((task) => (
                    <KanbanCard key={task.id} task={task} allTasks={allTasks} labels={labels} onDeleteTask={onDeleteTask} onSelectTask={onSelectTask} onSyncGitLabTask={onSyncGitLabTask} onFocusTask={onFocusTask} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default KanbanColumn;
