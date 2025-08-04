
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Task } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface TimelineViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

// New type for the flattened list item
type DisplayTaskItem = {
    task: Task;
    depth: number;
    hasChildren: boolean;
};

const MIN_DAY_WIDTH = 50; // حداقل عرض هر روز بر حسب پیکسل
const ROW_HEIGHT = 50; // ارتفاع هر سطر
const TASK_BAR_HEIGHT = 32; // ارتفاع میله نمایش تسک
const INDENT_WIDTH = 24; // میزان تورفتگی برای هر سطح

// توابع کمکی برای کار با تاریخ
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const differenceInDays = (dateLeft: Date, dateRight: Date): number => {
  const utcLeft = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
  const utcRight = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
  return Math.floor((utcLeft - utcRight) / (1000 * 60 * 60 * 24));
};

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onSelectTask }) => {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineGridWidth, setTimelineGridWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        // The timeline grid is the full width of the container minus the task list part (200px)
        const newWidth = entries[0].contentRect.width - 200;
        if (newWidth > 0) {
            setTimelineGridWidth(newWidth);
        }
      }
    });

    if (timelineContainerRef.current) {
      observer.observe(timelineContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const { flatDisplayTasks, minDate, totalDays, allTasksWithTimeline, dayWidth } = useMemo(() => {
    const allTasksWithTimeline = tasks.filter(t => t.startDate && typeof t.duration === 'number' && t.duration > 0);
    
    if (allTasksWithTimeline.length === 0) {
      return { flatDisplayTasks: [], minDate: new Date(), totalDays: 0, allTasksWithTimeline: [], dayWidth: MIN_DAY_WIDTH };
    }
    
    let overallMinDate = new Date(allTasksWithTimeline[0].startDate!);
    let overallMaxDate = new Date('1970-01-01');

    const tasksById = new Map(allTasksWithTimeline.map(t => [t.id, t]));
    const childrenByParentId = new Map<string, Task[]>();

    allTasksWithTimeline.forEach(task => {
        if (task.parentId) {
            if (!childrenByParentId.has(task.parentId)) {
                childrenByParentId.set(task.parentId, []);
            }
            childrenByParentId.get(task.parentId)!.push(task);
        }
        const startDate = new Date(task.startDate!);
        const endDate = addDays(startDate, task.duration!);
        if (endDate > overallMaxDate) overallMaxDate = endDate;
        if (startDate < overallMinDate) overallMinDate = startDate;
    });

    childrenByParentId.forEach(children => children.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()));

    overallMinDate = addDays(overallMinDate, -3);
    overallMaxDate = addDays(overallMaxDate, 3);
    const totalDays = differenceInDays(overallMaxDate, overallMinDate) + 1;

    let dayWidth = MIN_DAY_WIDTH;
    if (timelineGridWidth > 0 && totalDays > 0) {
      const potentialWidth = timelineGridWidth / totalDays;
      dayWidth = Math.max(MIN_DAY_WIDTH, potentialWidth);
    }

    const flatDisplayTasks: DisplayTaskItem[] = [];
    
    const buildListRecursive = (taskIds: string[], depth: number) => {
      taskIds.forEach(id => {
        const task = tasksById.get(id);
        if (!task) return;

        const children = childrenByParentId.get(id) || [];
        const hasChildren = children.length > 0;

        flatDisplayTasks.push({ task, depth, hasChildren });

        if (hasChildren && expandedTaskIds.has(id)) {
          buildListRecursive(children.map(c => c.id), depth + 1);
        }
      });
    };
    
    const topLevelTasks = allTasksWithTimeline
      .filter(t => !t.parentId)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    buildListRecursive(topLevelTasks.map(t => t.id), 0);

    return { flatDisplayTasks, minDate: overallMinDate, totalDays, allTasksWithTimeline, dayWidth };
  }, [tasks, expandedTaskIds, timelineGridWidth]);

  if (allTasksWithTimeline.length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh] bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-xl text-slate-600 dark:text-slate-400">هیچ تسکی با تاریخ شروع و مدت زمان برای نمایش وجود ندارد.</p>
      </div>
    );
  }
  
  const totalGridWidth = 200 + totalDays * dayWidth;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-md shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto relative" ref={timelineContainerRef}>
        <div style={{ width: `${totalGridWidth}px` }}>
          <div className="sticky top-0 z-30">
            <div className="grid grid-cols-[200px_1fr] bg-slate-100 dark:bg-slate-900 shadow-sm">
                <div className="p-2 border-b border-r border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 sticky left-0 z-10 bg-slate-100 dark:bg-slate-900 flex items-center">تسک</div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)` }}>
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const date = addDays(minDate, i);
                    const isToday = differenceInDays(date, new Date()) === 0;
                    return (
                      <div key={i} className={`p-2 border-b border-l border-slate-300 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-400 relative ${isToday ? 'bg-sky-200/60 dark:bg-sky-500/30' : ''}`}>
                        <span className="font-semibold">{date.toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                        <br/>
                        <span>{date.toLocaleDateString('fa-IR', { month: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-[200px_1fr]">
                <div className="sticky left-0 z-20 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  {flatDisplayTasks.map(({ task, depth, hasChildren }) => {
                     const isExpanded = expandedTaskIds.has(task.id);

                    return (
                        <div key={task.id} style={{ height: `${ROW_HEIGHT}px`, paddingRight: `${depth * INDENT_WIDTH}px` }} className={`border-r border-b border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-colors pr-4`}>
                            <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                                {hasChildren && (
                                    <button onClick={() => toggleExpand(task.id)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label={isExpanded ? 'بستن' : 'باز کردن'}>
                                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                    </button>
                                )}
                            </div>
                           <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300" title={task.title}>
                             {task.title}
                           </span>
                        </div>
                    );
                  })}
                </div>

                <div className="relative" style={{ height: `${flatDisplayTasks.length * ROW_HEIGHT}px` }}>
                  {Array.from({ length: totalDays }).map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-slate-200/80 dark:border-slate-700/60" style={{ right: `${i * dayWidth}px`, zIndex: 1 }}></div>
                  ))}
                  {flatDisplayTasks.map(({ task, hasChildren }, index) => {
                    const offset = differenceInDays(new Date(task.startDate!), minDate) * dayWidth;
                    const width = task.duration! * dayWidth - 4;
                    const isExpanded = expandedTaskIds.has(task.id);
                    const isChild = !!task.parentId;
                    
                    return (
                      <div key={task.id} className="absolute w-full border-b border-slate-200/80 dark:border-slate-700/60" style={{ height: `${ROW_HEIGHT}px`, top: `${index * ROW_HEIGHT}px`, zIndex: 2 }}>
                        <div
                          onClick={() => onSelectTask(task)}
                          className={`absolute rounded-lg px-2 text-sm font-semibold text-white flex items-center overflow-hidden shadow-md cursor-pointer hover:ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-sky-400 transition-all duration-200 ${isChild ? 'bg-teal-500 hover:bg-teal-600' : 'bg-sky-500 hover:bg-sky-600'}`}
                          style={{ 
                            height: `${TASK_BAR_HEIGHT}px`,
                            right: `${offset}px`, 
                            width: `${Math.max(0, width)}px`, 
                            top: `${(ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}px`,
                            zIndex: 3
                          }}
                          title={`${task.title}\nمدت: ${task.duration} روز`}
                        >
                            {hasChildren && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
                                    className="ml-2 flex-shrink-0 z-10 p-0.5 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    aria-label={isExpanded ? 'بستن' : 'باز کردن'}
                                >
                                    {isExpanded ? <ChevronDownIcon size="sm" /> : <ChevronRightIcon size="sm" />}
                                </button>
                            )}
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
