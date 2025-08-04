





import React, { useState, useEffect, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard';
import TimelineView from './components/TimelineView';
import ReportsView from './components/ReportsView';
import ReportBuilderView from './components/ReportBuilderView';
import TreeView from './components/TreeView';
import AddTaskModal from './components/AddTaskModal';
import EditTaskModal from './components/EditTaskModal';
import ImportStatusOverlay from './components/ImportStatusOverlay';
import ConfirmationModal from './components/ConfirmationModal';
import GitLabImportModal from './components/GitLabImportModal';
import SideNavbar from './components/SideNavbar';
import AIAssistantView from './components/AIAssistantView';
import ManageColumnsModal from './components/ManageColumnsModal';
import GitLabTasksView from './components/GitLabTasksView';
import ProfileView from './components/ProfileView';
import { type Task, type Label, type Column } from './types';
import { INITIAL_COLUMNS, INITIAL_LABELS, LABEL_COLOR_PALETTE } from './constants';
import { getStoredTasks, saveTasks, getStoredLabels, saveLabels, getStoredColumns, saveColumns } from './db';
import { INITIAL_TASKS } from './seed';
import GitLabCredentialsModal from './components/GitLabCredentialsModal';

type View = 'kanban' | 'timeline' | 'reports' | 'tree' | 'report-builder' | 'ai-assistant' | 'gitlab-tasks' | 'profile';
type ImportStep = 'processing' | 'saving' | 'success' | 'error' | null;

interface ConfirmationState {
  isOpen: boolean;
  message: string;
  onConfirm: (() => void) | null;
  confirmText?: string;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('kanban');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [isGitLabModalOpen, setIsGitLabModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ step: ImportStep; message: string }>({ step: null, message: '' });
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: null });
  const [isGitLabCredentialsModalOpen, setIsGitLabCredentialsModalOpen] = useState(false);
  const [pendingSyncAction, setPendingSyncAction] = useState<{ type: 'single'; taskId: string } | { type: 'all' } | null>(null);


  // Load data from IndexedDB on initial mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        let storedTasks = await getStoredTasks();
        let storedColumns = await getStoredColumns();
        
        // Initialize and save default columns if none exist
        if (storedColumns.length === 0) {
            storedColumns = INITIAL_COLUMNS;
            await saveColumns(INITIAL_COLUMNS);
        }
        setColumns(storedColumns);

        // Migration for tasks saved without an 'order' property
        if (storedTasks.length > 0 && typeof storedTasks[0].order === 'undefined') {
            const tasksByStatus: { [key: string]: Task[] } = {};
            storedTasks.forEach(task => {
                if (!tasksByStatus[task.status]) {
                    tasksByStatus[task.status] = [];
                }
                tasksByStatus[task.status]!.push(task);
            });

            const migratedTasks: Task[] = [];
            Object.values(tasksByStatus).forEach(columnTasks => {
                columnTasks?.forEach((task, index) => {
                    migratedTasks.push({ ...task, order: index });
                });
            });
            storedTasks = migratedTasks;
            await saveTasks(storedTasks);
        }

        if (storedTasks.length === 0 && INITIAL_TASKS.length > 0) {
            setTasks(INITIAL_TASKS);
            await saveTasks(INITIAL_TASKS);
        } else {
            setTasks(storedTasks);
        }

        const storedLabels = await getStoredLabels();
        if (storedLabels.length > 0) {
          setLabels(storedLabels);
        } else {
          setLabels(INITIAL_LABELS);
          await saveLabels(INITIAL_LABELS);
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB, falling back to empty state.", error);
        setTasks([]);
        setLabels(INITIAL_LABELS);
        setColumns(INITIAL_COLUMNS);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleAddTask = async (title: string, description: string, assignee: string, labels: string[], parentId?: string, startDate?: string, duration?: number) => {
    if (columns.length === 0) {
        alert("لطفا ابتدا حداقل یک ستون ایجاد کنید.");
        return;
    }
    const firstColumnId = columns[0].id;

    const maxOrderInColumn = tasks
      .filter(t => t.status === firstColumnId)
      .reduce((max, t) => (t.order > max ? t.order : max), -1);
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      creationDate: new Date().toISOString(),
      assignee: assignee || undefined,
      status: firstColumnId,
      order: maxOrderInColumn + 1,
      labels,
      parentId: parentId || undefined,
      startDate,
      duration,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const getDescendants = (id: string): string[] => {
        const children = tasks.filter(t => t.parentId === id);
        return children.flatMap(child => [child.id, ...getDescendants(child.id)]);
    };

    const descendants = getDescendants(taskId);
    
    let confirmMessage = `آیا از حذف تسک «${taskToDelete.title}» اطمینان دارید؟`;
    if (descendants.length > 0) {
        confirmMessage = `این تسک دارای ${descendants.length} تسک فرزند است. آیا از حذف تسک والد و تمام فرزندانش اطمینان دارید؟`;
    }

    setConfirmationState({
        isOpen: true,
        message: confirmMessage,
        confirmText: 'بله، حذف کن',
        onConfirm: async () => {
            const tasksToDeleteIds = new Set([taskId, ...descendants]);
            const updatedTasks = tasks.filter(task => !tasksToDeleteIds.has(task.id));
            setTasks(updatedTasks);
            await saveTasks(updatedTasks);
            if (editingTask && tasksToDeleteIds.has(editingTask.id)) {
                setEditingTask(null);
            }
            setConfirmationState({ isOpen: false, message: '', onConfirm: null });
        }
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) {
        return; // No change needed
    }
    const isDoneColumn = columns[columns.length -1]?.id === newStatus;

    const maxOrderInNewColumn = tasks
        .filter(t => t.status === newStatus)
        .reduce((max, t) => (t.order > max ? t.order : max), -1);

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedTask: Task = { ...task, status: newStatus, order: maxOrderInNewColumn + 1 };
        if (isDoneColumn && !task.completionDate) {
          updatedTask.completionDate = new Date().toISOString();
        } else if (!isDoneColumn) {
          delete updatedTask.completionDate;
        }
        return updatedTask;
      }
      return task;
    });
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const handleReorderTask = async (draggedTaskId: string, targetTaskId: string) => {
    const tasksCopy = [...tasks];
    const draggedTask = tasksCopy.find(t => t.id === draggedTaskId);
    const targetTask = tasksCopy.find(t => t.id === targetTaskId);

    if (!draggedTask || !targetTask || draggedTask.status !== targetTask.status || draggedTask.id === targetTaskId) {
        return;
    }

    const columnId = draggedTask.status;
    const columnTasks = tasksCopy
        .filter(t => t.status === columnId)
        .sort((a, b) => a.order - b.order);

    const draggedIndex = columnTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = columnTasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = columnTasks.splice(draggedIndex, 1);
    columnTasks.splice(targetIndex, 0, removed);

    const reorderedColumnTasksMap = new Map<string, number>();
    columnTasks.forEach((t, index) => reorderedColumnTasksMap.set(t.id, index));

    const updatedTasks = tasksCopy.map(t => {
        if (reorderedColumnTasksMap.has(t.id)) {
            return { ...t, order: reorderedColumnTasksMap.get(t.id)! };
        }
        return t;
    });

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
};

  
  const handleUpdateTask = async (taskId: string, newTitle: string, newDescription: string, newAssignee: string, newLabels: string[], newParentId?: string, newStartDate?: string, newDuration?: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, title: newTitle, description: newDescription, assignee: newAssignee || undefined, labels: newLabels, parentId: newParentId || undefined, startDate: newStartDate, duration: newDuration } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleAddColumn = async (title: string) => {
    const newColumn: Column = {
      id: crypto.randomUUID(),
      title,
      order: columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 0,
    };
    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    await saveColumns(updatedColumns);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 1) {
        alert("شما نمی‌توانید آخرین ستون را حذف کنید.");
        return;
    }
    const columnToDelete = columns.find(c => c.id === columnId);
    const firstColumn = columns[0];
    if (!columnToDelete || !firstColumn || columnToDelete.id === firstColumn.id) {
        alert("امکان حذف این ستون وجود ندارد.");
        return;
    }

    const message = `آیا از حذف ستون «${columnToDelete.title}» مطمئن هستید؟ تمام تسک‌های داخل این ستون به ستون «${firstColumn.title}» منتقل خواهند شد.`;
    
    setConfirmationState({
        isOpen: true,
        message,
        confirmText: "بله، حذف کن",
        onConfirm: async () => {
            const updatedTasks = tasks.map(task => 
                task.status === columnId ? { ...task, status: firstColumn.id } : task
            );
            const updatedColumns = columns.filter(c => c.id !== columnId);

            setTasks(updatedTasks);
            setColumns(updatedColumns);
            
            await saveTasks(updatedTasks);
            await saveColumns(updatedColumns);
            setConfirmationState({ isOpen: false, message: '', onConfirm: null });
        }
    });
  };

  const handleUpdateColumn = async (columnId: string, newTitle: string) => {
    const updatedColumns = columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c);
    setColumns(updatedColumns);
    await saveColumns(updatedColumns);
  };

  const handleReorderColumns = async (reorderedColumns: Column[]) => {
    const updatedColumns = reorderedColumns.map((col, index) => ({...col, order: index}));
    setColumns(updatedColumns);
    await saveColumns(updatedColumns);
  }
  
  const handleSelectTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleAddLabel = async (id: string, color: string): Promise<boolean> => {
    if (labels.some(label => label.id.toLowerCase() === id.toLowerCase())) {
      alert("یک لیبل با این نام از قبل وجود دارد.");
      return false;
    }
    const newLabel: Label = { id, color };
    const updatedLabels = [...labels, newLabel];
    setLabels(updatedLabels);
    await saveLabels(updatedLabels);
    return true;
  };
  
  const handleExportData = () => {
    const dataToExport = {
      tasks,
      labels,
      columns,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.download = `tasks-backup-${today}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const inputTarget = e.target;

    if (!file) {
      if (inputTarget) inputTarget.value = '';
      return;
    }

    const processFile = async () => {
      try {
        setImportStatus({ step: 'processing', message: 'در حال پردازش...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const content = await file.text();
        const data = JSON.parse(content);
        
        if (!data || typeof data !== 'object' || !Array.isArray(data.tasks) || !Array.isArray(data.labels)) {
          throw new Error("ساختار فایل نامعتبر است. باید شامل 'tasks' و 'labels' باشد.");
        }
        
        let importedTasks = data.tasks as Task[];
        const importedLabels = data.labels as Label[];
        const importedColumns = (data.columns as Column[]) || INITIAL_COLUMNS;


        if (importedTasks.length > 0 && typeof importedTasks[0].order === 'undefined') {
            const tasksByStatus: { [key: string]: Task[] } = {};
             importedTasks.forEach(task => {
                if (!tasksByStatus[task.status]) {
                    tasksByStatus[task.status] = [];
                }
                tasksByStatus[task.status]!.push(task);
            });
            const migratedTasks: Task[] = [];
            Object.values(tasksByStatus).forEach(columnTasks => {
                columnTasks?.forEach((task, index) => {
                    migratedTasks.push({ ...task, order: index });
                });
            });
            importedTasks = migratedTasks;
        }


        setImportStatus({ step: 'saving', message: 'در حال ذخیره...' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await saveTasks(importedTasks);
        await saveLabels(importedLabels);
        await saveColumns(importedColumns);

        setTasks(importedTasks);
        setLabels(importedLabels);
        setColumns(importedColumns);

        setImportStatus({ step: 'success', message: 'بارگذاری کامل شد!' });

        setTimeout(() => setImportStatus({ step: null, message: '' }), 2000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته در هنگام پردازش.';
        setImportStatus({ step: 'error', message: `خطا: ${errorMessage}` });
        setTimeout(() => setImportStatus({ step: null, message: '' }), 5000);
      }
    };

    setConfirmationState({
        isOpen: true,
        message: "آیا مطمئن هستید؟ با بارگذاری فایل جدید، تمام داده‌های فعلی شما حذف و با محتوای این فایل جایگزین خواهند شد.",
        onConfirm: () => {
            setConfirmationState({ isOpen: false, message: '', onConfirm: null });
            processFile(); // Execute the import logic
        },
        confirmText: 'بله، جایگزین کن'
    });

    if (inputTarget) {
      inputTarget.value = '';
    }
  };

  const handleGitLabImport = async (newlyImportedTasks: Task[], newlyImportedLabels: Label[]) => {
    const currentTaskIds = new Set(tasks.map(t => t.id));
    const currentLabelIds = new Set(labels.map(l => l.id.toLowerCase()));

    const uniqueNewTasks = newlyImportedTasks.filter(t => !currentTaskIds.has(t.id));
    const uniqueNewLabels = newlyImportedLabels.filter(l => !currentLabelIds.has(l.id.toLowerCase()));
    
    if (uniqueNewTasks.length === 0 && uniqueNewLabels.length === 0) {
        return; // Nothing to update
    }

    const firstColumnId = columns[0]?.id;
    if (!firstColumnId) {
        alert("لطفا قبل از وارد کردن تسک، یک ستون ایجاد کنید.");
        return;
    }

    const maxOrderInColumn = tasks
      .filter(t => t.status === firstColumnId)
      .reduce((max, t) => (t.order > max ? t.order : max), -1);

    let orderCounter = maxOrderInColumn + 1;

    const doneColumnId = columns.find(c => c.title.toLowerCase().includes('انجام شده') || c.title.toLowerCase().includes('done'))?.id || firstColumnId;

    const uniqueNewTasksWithOrder = uniqueNewTasks.map(t => ({
      ...t,
      order: orderCounter++,
      status: t.status === 'انجام شده' ? doneColumnId : firstColumnId,
    }));
    
    const updatedTasks = [...tasks, ...uniqueNewTasksWithOrder];
    const updatedLabels = [...labels, ...uniqueNewLabels];

    setTasks(updatedTasks);
    setLabels(updatedLabels);
    await saveTasks(updatedTasks);
    await saveLabels(updatedLabels);
  };
  
  const handleAddTaskFromGitLab = async (
    issue: any,
    projectId: number,
    columnId: string,
    parentId?: string,
  ): Promise<boolean> => {
    const newTaskId = `gitlab-${projectId}-${issue.iid}`;

    if (tasks.some(t => t.id === newTaskId)) {
        return false;
    }

    const newLabelsToAdd: Label[] = [];
    if (issue.labels && issue.labels.length > 0) {
        const currentLabelIds = new Set(labels.map(l => l.id.toLowerCase()));
        const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
        let colorIndex = labels.length % labelColorPaletteClasses.length;

        issue.labels.forEach((labelId: string) => {
            if (!currentLabelIds.has(labelId.toLowerCase())) {
                const newLabel = {
                    id: labelId,
                    color: labelColorPaletteClasses[colorIndex % labelColorPaletteClasses.length],
                };
                newLabelsToAdd.push(newLabel);
                currentLabelIds.add(labelId.toLowerCase());
                colorIndex++;
            }
        });
    }

    const maxOrderInColumn = tasks
      .filter(t => t.status === columnId)
      .reduce((max, t) => (t.order > max ? t.order : max), -1);

    const durationInDays = issue.time_stats?.time_estimate
      ? Math.ceil(issue.time_stats.time_estimate / (3600 * 8))
      : undefined;

    const milestoneData = issue.milestone
        ? { title: issue.milestone.title, dueDate: issue.milestone.due_date }
        : undefined;
    
    const newTask: Task = {
      id: newTaskId,
      title: issue.title,
      description: issue.description || '',
      status: columnId,
      order: maxOrderInColumn + 1,
      creationDate: issue.created_at,
      assignee: issue.assignees?.[0]?.name || issue.assignee?.name || undefined,
      labels: issue.labels || [],
      startDate: undefined,
      duration: durationInDays,
      timeSpent: issue.time_stats?.total_time_spent || 0,
      completionDate: undefined,
      parentId: parentId,
      milestone: milestoneData,
      gitlabUrl: issue.web_url,
    };
    
    const updatedTasks = [...tasks, newTask];
    const updatedLabels = [...labels, ...newLabelsToAdd];
    
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    if (newLabelsToAdd.length > 0) {
        setLabels(updatedLabels);
        await saveLabels(updatedLabels);
    }
    
    return true;
  };
    
  const handleSyncGitLabTask = async (taskId: string) => {
    const gitlabUrl = localStorage.getItem('gitlabUrl');
    const token = localStorage.getItem('gitlabToken');

    if (!gitlabUrl || !token) {
        setPendingSyncAction({ type: 'single', taskId });
        setIsGitLabCredentialsModalOpen(true);
        return;
    }
    
    const taskToSync = tasks.find(t => t.id === taskId);
    if (!taskToSync) {
        throw new Error("تسک مورد نظر برای همگام‌سازی یافت نشد.");
    }

    const match = taskId.match(/^gitlab-(\d+)-(\d+)$/);
    if (!match) {
        throw new Error("شناسه تسک برای همگام‌سازی با گیت‌لب معتبر نیست.");
    }
    const [, projectId, issueIid] = match;
    
    const baseUrl = gitlabUrl.replace(/\/$/, '');
    const headers = { 'PRIVATE-TOKEN': token };

    const issueResponse = await fetch(`${baseUrl}/api/v4/projects/${projectId}/issues/${issueIid}`, { headers });
    if (!issueResponse.ok) {
        const errorData = await issueResponse.json().catch(() => ({}));
        throw new Error(`خطا در دریافت اطلاعات ایشو: ${errorData.message || issueResponse.statusText}`);
    }
    const issueData = await issueResponse.json();

    let tasksToUpdate = [...tasks];
    let labelsToUpdate = [...labels];
    const newLabelsToAdd = new Map<string, string>();

    const updatesFromGitLab: Partial<Task> = {
        title: issueData.title,
        description: issueData.description || '',
        assignee: issueData.assignees?.[0]?.name || issueData.assignee?.name || undefined,
        labels: issueData.labels || [],
        milestone: issueData.milestone ? { title: issueData.milestone.title, dueDate: issueData.milestone.due_date } : undefined,
        gitlabUrl: issueData.web_url,
    };
    
    if (issueData.time_stats) {
        // Only update if GitLab has a value. A value of 0 means "not set".
        if (issueData.time_stats.time_estimate) {
            updatesFromGitLab.duration = Math.ceil(issueData.time_stats.time_estimate / (3600 * 8));
        }
        if (issueData.time_stats.total_time_spent) {
            updatesFromGitLab.timeSpent = issueData.time_stats.total_time_spent;
        }
    }
    
    let status = taskToSync.status;
    let completionDate = taskToSync.completionDate;

    // Only change status if the issue is closed. Do not change it otherwise.
    if (issueData.state === 'closed') {
        const doneColumn = columns.find(c => c.title.toLowerCase().includes('انجام شده') || c.title.toLowerCase().includes('done'));
        const sortedColumns = [...columns].sort((a,b) => a.order - b.order);
        const firstColumn = sortedColumns[0];
        const targetColumn = doneColumn || firstColumn;
        
        if (targetColumn) {
            status = targetColumn.id;
        }
        completionDate = issueData.closed_at || new Date().toISOString();
    }

    const currentLabelIds = new Set(labels.map(l => l.id.toLowerCase()));
    if (issueData.labels) {
        issueData.labels.forEach((labelId: string) => {
            if (!currentLabelIds.has(labelId.toLowerCase())) {
                const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
                const colorIndex = (labels.length + newLabelsToAdd.size) % labelColorPaletteClasses.length;
                newLabelsToAdd.set(labelId, labelColorPaletteClasses[colorIndex]);
                currentLabelIds.add(labelId.toLowerCase());
            }
        });
    }
    
    if (newLabelsToAdd.size > 0) {
        const newLabelObjects: Label[] = Array.from(newLabelsToAdd.entries()).map(([id, color]) => ({ id, color }));
        labelsToUpdate = [...labelsToUpdate, ...newLabelObjects];
    }
    
    const taskIndex = tasksToUpdate.findIndex(t => t.id === taskId);
    if(taskIndex !== -1) {
        tasksToUpdate[taskIndex] = {
            ...tasksToUpdate[taskIndex],
            ...updatesFromGitLab,
            status,
            completionDate,
        };
    }

    const linksResponse = await fetch(`${baseUrl}/api/v4/projects/${projectId}/issues/${issueIid}/links`, { headers });
    if (linksResponse.ok) {
        const linkedIssuesInfo = await linksResponse.json();
        const existingChildIds = new Set(tasksToUpdate.filter(t => t.parentId === taskId).map(t => t.id));

        const newChildPromises = linkedIssuesInfo
            .filter((link: any) => {
                const childTaskId = `gitlab-${link.project_id}-${link.iid}`;
                return !existingChildIds.has(childTaskId) && !tasksToUpdate.some(t => t.id === childTaskId);
            })
            .map(async (link: any) => {
                try {
                    const childResponse = await fetch(`${baseUrl}/api/v4/projects/${link.project_id}/issues/${link.iid}`, { headers });
                    if (!childResponse.ok) return null;
                    const childIssueData = await childResponse.json();
                    
                    const firstColumnId = columns[0]?.id || 'انجام نشده';
                    const maxOrderInColumn = tasksToUpdate.filter(t => t.status === firstColumnId).reduce((max, t) => (t.order > max ? t.order : max), -1);

                    const doneColumnId = columns.find(c => c.title.toLowerCase().includes('انجام شده') || c.title.toLowerCase().includes('done'))?.id || firstColumnId;
                    const childStatus = childIssueData.state === 'closed' ? doneColumnId : firstColumnId;
                    
                    const newChildTask: Partial<Task> = {
                        id: `gitlab-${childIssueData.project_id}-${childIssueData.iid}`,
                        title: childIssueData.title,
                        description: childIssueData.description || '',
                        status: childStatus,
                        order: maxOrderInColumn + 1,
                        creationDate: childIssueData.created_at,
                        assignee: childIssueData.assignees?.[0]?.name || undefined,
                        labels: childIssueData.labels || [],
                        completionDate: childIssueData.state === 'closed' ? (childIssueData.closed_at || new Date().toISOString()) : undefined,
                        parentId: taskId,
                        milestone: childIssueData.milestone ? { title: childIssueData.milestone.title, dueDate: childIssueData.milestone.due_date } : undefined,
                        gitlabUrl: childIssueData.web_url,
                    };

                    if (childIssueData.time_stats) {
                        if (childIssueData.time_stats.time_estimate) {
                            newChildTask.duration = Math.ceil(childIssueData.time_stats.time_estimate / (3600 * 8));
                        }
                        if (childIssueData.time_stats.total_time_spent) {
                            newChildTask.timeSpent = childIssueData.time_stats.total_time_spent;
                        }
                    }

                    return newChildTask as Task;
                } catch (e) { return null; }
            });
        
        const newChildren = (await Promise.all(newChildPromises)).filter(Boolean) as Task[];
        
        if (newChildren.length > 0) {
            tasksToUpdate.push(...newChildren);
            const allLabelIds = new Set(labelsToUpdate.map(l => l.id.toLowerCase()));
             newChildren.forEach(task => {
                task.labels?.forEach(labelId => {
                    if (!allLabelIds.has(labelId.toLowerCase())) {
                        const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
                        const colorIndex = allLabelIds.size % labelColorPaletteClasses.length;
                        const newLabelObj = { id: labelId, color: labelColorPaletteClasses[colorIndex] };
                        labelsToUpdate.push(newLabelObj);
                        allLabelIds.add(labelId.toLowerCase());
                    }
                });
             });
        }
    }

    setTasks(tasksToUpdate);
    setLabels(labelsToUpdate);

    await saveTasks(tasksToUpdate);
    await saveLabels(labelsToUpdate);
  };
    
  const handleSyncAllGitLabTasks = async () => {
    const gitlabUrl = localStorage.getItem('gitlabUrl');
    const token = localStorage.getItem('gitlabToken');

    if (!gitlabUrl || !token) {
        setPendingSyncAction({ type: 'all' });
        setIsGitLabCredentialsModalOpen(true);
        return;
    }

    const gitlabTasks = tasks.filter(t => t.gitlabUrl && t.id.startsWith('gitlab-'));
    if (gitlabTasks.length === 0) {
      return;
    }

    const headers = { 'PRIVATE-TOKEN': token };
    const baseUrl = gitlabUrl.replace(/\/$/, '');
    let hadErrors = false;

    const taskUpdates = new Map<string, Partial<Task>>();
    const newChildTasks: Task[] = [];
    const newLabelsMap = new Map<string, Label>();

    const syncPromises = gitlabTasks.map(async (task) => {
        try {
            const match = task.id.match(/^gitlab-(\d+)-(\d+)$/);
            if (!match) return;

            const [, projectId, issueIid] = match;
            const issueResponse = await fetch(`${baseUrl}/api/v4/projects/${projectId}/issues/${issueIid}`, { headers });
            if (!issueResponse.ok) throw new Error(`Failed to fetch issue ${issueIid}`);
            const issueData = await issueResponse.json();

            let status = task.status;
            let completionDate = task.completionDate;
            
            // Only change status if the issue is closed. Do not change it otherwise.
            if (issueData.state === 'closed') {
                const doneColumn = columns.find(c => c.title.toLowerCase().includes('انجام شده') || c.title.toLowerCase().includes('done'));
                const sortedColumns = [...columns].sort((a,b) => a.order - b.order);
                const firstColumn = sortedColumns[0];
                const targetColumn = doneColumn || firstColumn;
                if (targetColumn) {
                    status = targetColumn.id;
                }
                completionDate = issueData.closed_at || new Date().toISOString();
            }

            const updatesForThisTask: Partial<Task> = {
                title: issueData.title,
                description: issueData.description || '',
                assignee: issueData.assignees?.[0]?.name || issueData.assignee?.name || undefined,
                labels: issueData.labels || [],
                milestone: issueData.milestone ? { title: issueData.milestone.title, dueDate: issueData.milestone.due_date } : undefined,
                gitlabUrl: issueData.web_url,
                status,
                completionDate,
            };

            if (issueData.time_stats) {
                // Only update if GitLab has a value. A value of 0 means "not set".
                if (issueData.time_stats.time_estimate) {
                    updatesForThisTask.duration = Math.ceil(issueData.time_stats.time_estimate / (3600 * 8));
                }
                if (issueData.time_stats.total_time_spent) {
                    updatesForThisTask.timeSpent = issueData.time_stats.total_time_spent;
                }
            }

            taskUpdates.set(task.id, updatesForThisTask);
            
            const allLabelIds = new Set([...labels.map(l => l.id.toLowerCase()), ...Array.from(newLabelsMap.keys()).map(k => k.toLowerCase())]);
            issueData.labels?.forEach((labelId: string) => {
                if (!allLabelIds.has(labelId.toLowerCase())) {
                    const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
                    const colorIndex = allLabelIds.size % labelColorPaletteClasses.length;
                    const newLabel = { id: labelId, color: labelColorPaletteClasses[colorIndex] };
                    newLabelsMap.set(labelId.toLowerCase(), newLabel);
                    allLabelIds.add(labelId.toLowerCase());
                }
            });

            const linksResponse = await fetch(`${baseUrl}/api/v4/projects/${projectId}/issues/${issueIid}/links`, { headers });
            if (linksResponse.ok) {
                const linkedIssuesInfo = await linksResponse.json();
                const existingTaskIds = new Set(tasks.map(t => t.id));
                
                const childFetchPromises = linkedIssuesInfo
                    .filter((link: any) => !existingTaskIds.has(`gitlab-${link.project_id}-${link.iid}`))
                    .map(async (link: any) => {
                        try {
                            const childResponse = await fetch(`${baseUrl}/api/v4/projects/${link.project_id}/issues/${link.iid}`, { headers });
                            if (!childResponse.ok) return null;
                            const childIssueData = await childResponse.json();
                            
                            const firstColumnId = columns[0]?.id || 'انجام نشده';
                            const doneColumnId = columns.find(c => c.title.toLowerCase().includes('انجام شده') || c.title.toLowerCase().includes('done'))?.id || firstColumnId;
                            const childStatus = childIssueData.state === 'closed' ? doneColumnId : firstColumnId;
                            
                            const newChildTask: Partial<Task> = {
                                id: `gitlab-${childIssueData.project_id}-${childIssueData.iid}`,
                                title: childIssueData.title,
                                description: childIssueData.description || '',
                                status: childStatus,
                                order: 9999, // Re-order later
                                creationDate: childIssueData.created_at,
                                assignee: childIssueData.assignees?.[0]?.name || undefined,
                                labels: childIssueData.labels || [],
                                completionDate: childIssueData.state === 'closed' ? (childIssueData.closed_at || new Date().toISOString()) : undefined,
                                parentId: task.id,
                                milestone: childIssueData.milestone ? { title: childIssueData.milestone.title, dueDate: childIssueData.milestone.due_date } : undefined,
                                gitlabUrl: childIssueData.web_url,
                            };
                            
                            if (childIssueData.time_stats) {
                                if (childIssueData.time_stats.time_estimate) {
                                    newChildTask.duration = Math.ceil(childIssueData.time_stats.time_estimate / (3600 * 8));
                                }
                                if (childIssueData.time_stats.total_time_spent) {
                                    newChildTask.timeSpent = childIssueData.time_stats.total_time_spent;
                                }
                            }

                            (newChildTask as Task).labels?.forEach(labelId => {
                                if (!allLabelIds.has(labelId.toLowerCase())) {
                                    const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
                                    const colorIndex = allLabelIds.size % labelColorPaletteClasses.length;
                                    const newLabel = { id: labelId, color: labelColorPaletteClasses[colorIndex] };
                                    newLabelsMap.set(labelId.toLowerCase(), newLabel);
                                    allLabelIds.add(labelId.toLowerCase());
                                }
                            });
                            return newChildTask as Task;
                        } catch { return null; }
                    });
                
                const children = (await Promise.all(childFetchPromises)).filter(Boolean) as Task[];
                newChildTasks.push(...children);
            }
        } catch (error) {
            console.error(`Error syncing task ${task.id}:`, error);
            hadErrors = true;
        }
    });

    await Promise.all(syncPromises);

    if (hadErrors) {
        alert("همگام‌سازی برخی از تسک‌ها با خطا مواجه شد. لطفا کنسول را برای جزئیات بررسی کنید.");
    }
    
    if (taskUpdates.size === 0 && newChildTasks.length === 0 && newLabelsMap.size === 0) {
      return;
    }
    
    let finalTasks = tasks.map(task => taskUpdates.has(task.id) ? { ...task, ...taskUpdates.get(task.id) } : task);

    if (newChildTasks.length > 0) {
        const tasksByStatus: { [key: string]: Task[] } = {};
        finalTasks.forEach(task => {
            if (!tasksByStatus[task.status]) tasksByStatus[task.status] = [];
            tasksByStatus[task.status].push(task);
        });
        const newChildrenWithOrder = newChildTasks.map(child => {
            if (!tasksByStatus[child.status]) tasksByStatus[child.status] = [];
            const newOrder = tasksByStatus[child.status].length;
            tasksByStatus[child.status].push(child);
            return { ...child, order: newOrder };
        });
        finalTasks.push(...newChildrenWithOrder);
    }
    
    let finalLabels = [...labels];
    if (newLabelsMap.size > 0) {
        finalLabels = [...finalLabels, ...Array.from(newLabelsMap.values())];
    }
    
    setTasks(finalTasks);
    setLabels(finalLabels);
    await saveTasks(finalTasks);
    await saveLabels(finalLabels);
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[80vh] gap-4">
          <svg className="animate-spin h-8 w-8 text-sky-600 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl text-slate-700 dark:text-slate-300">درحال بارگذاری داده‌ها...</span>
        </div>
      );
    }
    
    switch (view) {
      case 'kanban':
        return (
          <KanbanBoard
            columns={columns}
            tasks={tasks}
            allTasks={tasks}
            labels={labels}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onReorderTask={handleReorderTask}
            onDeleteTask={handleDeleteTask}
            onSelectTask={handleSelectTask}
            onAddLabel={handleAddLabel}
            onNewTask={() => setIsModalOpen(true)}
            onManageColumns={() => setIsManageColumnsModalOpen(true)}
            onGitLabImport={() => setIsGitLabModalOpen(true)}
            onImport={handleImportClick}
            onExport={handleExportData}
            onSyncGitLabTask={handleSyncGitLabTask}
            onSyncAllGitLabTasks={handleSyncAllGitLabTasks}
          />
        );
      case 'timeline':
        return <TimelineView tasks={tasks} onSelectTask={handleSelectTask} />;
      case 'reports':
        return <ReportsView tasks={tasks} labels={labels} columns={columns} theme={theme} />;
      case 'report-builder':
        return <ReportBuilderView tasks={tasks} labels={labels} columns={columns} theme={theme} />;
      case 'ai-assistant':
        return <AIAssistantView tasks={tasks} />;
      case 'gitlab-tasks':
        return <GitLabTasksView columns={columns} allTasks={tasks} onAddTaskFromGitLab={handleAddTaskFromGitLab} />;
      case 'tree':
        return <TreeView tasks={tasks} projectName="پروژه اصلی" />;
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-vazirmatn text-slate-800 dark:text-slate-200 transition-colors duration-300">
       <ImportStatusOverlay status={importStatus} />
       <ConfirmationModal
            isOpen={confirmationState.isOpen}
            message={confirmationState.message}
            onConfirm={() => confirmationState.onConfirm?.()}
            onCancel={() => setConfirmationState({ isOpen: false, message: '', onConfirm: null })}
            confirmText={confirmationState.confirmText || "تایید"}
        />
      
      <SideNavbar 
        view={view}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>

      {isModalOpen && (
        <AddTaskModal
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
          availableLabels={labels}
          allTasks={tasks}
          onAddLabel={handleAddLabel}
        />
      )}
      
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          allTasks={tasks}
          onClose={() => setEditingTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          availableLabels={labels}
          onAddLabel={handleAddLabel}
          onSelectTask={handleSelectTask}
        />
      )}
       
      {isManageColumnsModalOpen && (
        <ManageColumnsModal
            isOpen={isManageColumnsModalOpen}
            onClose={() => setIsManageColumnsModalOpen(false)}
            columns={columns}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            onReorderColumns={handleReorderColumns}
        />
      )}
      
      {isGitLabModalOpen && (
        <GitLabImportModal
          onClose={() => setIsGitLabModalOpen(false)}
          onImport={handleGitLabImport}
          existingTasks={tasks}
          existingLabels={labels}
        />
      )}

      {isGitLabCredentialsModalOpen && (
        <GitLabCredentialsModal
            onClose={() => {
                setIsGitLabCredentialsModalOpen(false);
                setPendingSyncAction(null);
            }}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".json"
      />
    </div>
  );
};

export default App;
