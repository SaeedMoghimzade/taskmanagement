
import React, { useState, useRef, useEffect } from 'react';
import { type Task, type Label } from '../types';
import { LABEL_COLOR_PALETTE } from '../constants';

interface GitLabImportModalProps {
  onClose: () => void;
  onImport: (tasks: Task[], labels: Label[]) => void;
  existingTasks: Task[];
  existingLabels: Label[];
}

const GitLabImportModal: React.FC<GitLabImportModalProps> = ({ onClose, onImport, existingTasks, existingLabels }) => {
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const gitlabUrl = localStorage.getItem('gitlabUrl');
    const token = localStorage.getItem('gitlabToken');
    if (!gitlabUrl || !token) {
        setConfigError("اطلاعات اتصال به گیت‌لب در پروفایل تنظیم نشده است. لطفا به صفحه پروفایل بروید.");
    }

    const defaultIds = localStorage.getItem('gitlabProjectIds') || '';
    const firstId = defaultIds.split(',')[0]?.trim() || '';
    setProjectId(firstId);
  }, []);

  const taskFromGitLabIssue = (issue: any, projectId: string | number, parentId?: string): Task => {
    const newTaskId = `gitlab-${projectId}-${issue.iid}`;
    
    const durationInDays = issue.time_stats?.time_estimate
      ? Math.ceil(issue.time_stats.time_estimate / (3600 * 8)) // 8-hour workday
      : undefined;

    // Use a placeholder status. App.tsx will determine the correct column.
    let status = (issue.state === 'closed') ? 'انجام شده' : 'انجام نشده';
    let completionDate = (issue.state === 'closed') ? (issue.closed_at || new Date().toISOString()) : undefined;

    const milestoneData = issue.milestone
        ? { title: issue.milestone.title, dueDate: issue.milestone.due_date }
        : undefined;

    return {
        id: newTaskId,
        title: issue.title,
        description: issue.description || '',
        status: status,
        order: 0, // placeholder order, will be reassigned in App.tsx
        creationDate: issue.created_at,
        assignee: issue.assignees?.[0]?.name || undefined,
        labels: issue.labels || [],
        startDate: undefined, // Let user set this manually
        duration: durationInDays,
        timeSpent: issue.time_stats?.total_time_spent || 0,
        completionDate: completionDate,
        parentId: parentId,
        milestone: milestoneData,
        gitlabUrl: issue.web_url,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gitlabUrl = localStorage.getItem('gitlabUrl');
    const token = localStorage.getItem('gitlabToken');

    if (configError || !projectId || !token || !gitlabUrl) {
        setError("لطفا شناسه پروژه را وارد کنید و مطمئن شوید اطلاعات اتصال در پروفایل صحیح است.");
        return;
    }
    
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const fetchAllGitLabIssues = async (): Promise<any[]> => {
          const allIssues: any[] = [];
          let nextPage: string | number | null = 1;
          const perPage = 100;
          const baseUrl = gitlabUrl.replace(/\/$/, '');

          while (nextPage) {
              const endpoint = `${baseUrl}/api/v4/projects/${projectId}/issues?access_token=${token}&state=opened&per_page=${perPage}&page=${nextPage}`;
              const response = await fetch(endpoint);

              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ message: response.statusText }));
                  throw new Error(`خطا در صفحه ${nextPage}: ${errorData.message || 'پاسخ نامعتبر از سرور گیت‌لب'}`);
              }
              
              const issuesOnPage = await response.json();
              if (!Array.isArray(issuesOnPage)) {
                  throw new Error("پاسخ دریافت شده از گیت‌لب یک لیست از ایشوها نیست.");
              }
              
              allIssues.push(...issuesOnPage);
              
              const nextPageHeader = response.headers.get('x-next-page');
              nextPage = nextPageHeader ? parseInt(nextPageHeader, 10) : null;
          }
          return allIssues;
      };

      const mainIssues = await fetchAllGitLabIssues();
      
      const allNewTasks: Task[] = [];
      const allNewLabels = new Set<string>();
      const processedTaskIds = new Set<string>([...existingTasks.map(t => t.id)]);
      const baseUrl = gitlabUrl.replace(/\/$/, '');

      for (const mainIssue of mainIssues) {
          const parentTaskId = `gitlab-${projectId}-${mainIssue.iid}`;
          
          if (!processedTaskIds.has(parentTaskId)) {
              const parentTask = taskFromGitLabIssue(mainIssue, projectId);
              allNewTasks.push(parentTask);
              processedTaskIds.add(parentTaskId);
              mainIssue.labels.forEach((label: string) => allNewLabels.add(label));
          }

          const linksEndpoint = `${baseUrl}/api/v4/projects/${projectId}/issues/${mainIssue.iid}/links?access_token=${token}`;
          const linksResponse = await fetch(linksEndpoint);
          if (!linksResponse.ok) {
              console.warn(`Could not fetch links for issue #${mainIssue.iid}. Skipping.`);
              continue;
          }
          const linkedIssuesInfo = await linksResponse.json();
          if (!Array.isArray(linkedIssuesInfo) || linkedIssuesInfo.length === 0) continue;

          const childIssueDetailsPromises = linkedIssuesInfo.map(async (link: any) => {
              const childEndpoint = `${baseUrl}/api/v4/projects/${link.project_id}/issues/${link.iid}?access_token=${token}`;
              try {
                  const childResponse = await fetch(childEndpoint);
                  if (!childResponse.ok) return null;
                  return await childResponse.json();
              } catch (e) {
                  console.warn(`Failed to fetch linked issue ${link.project_id}/${link.iid}`, e);
                  return null;
              }
          });

          const childIssueDetails = (await Promise.all(childIssueDetailsPromises)).filter(Boolean);
          
          for (const childIssue of childIssueDetails) {
              const childTaskId = `gitlab-${childIssue.project_id}-${childIssue.iid}`;
              if (!processedTaskIds.has(childTaskId)) {
                   const childTask = taskFromGitLabIssue(childIssue, childIssue.project_id, parentTaskId);
                   allNewTasks.push(childTask);
                   processedTaskIds.add(childTaskId);
                   childIssue.labels.forEach((label: string) => allNewLabels.add(label));
              }
          }
      }
      
      const finalLabelsToCreate: Label[] = [];
      const existingLabelIds = new Set(existingLabels.map(l => l.id.toLowerCase()));
      const labelColorPaletteClasses = LABEL_COLOR_PALETTE.map(p => p.class);
      let colorIndex = existingLabels.length % labelColorPaletteClasses.length;

      allNewLabels.forEach(labelId => {
          if (!existingLabelIds.has(labelId.toLowerCase())) {
              finalLabelsToCreate.push({
                  id: labelId,
                  color: labelColorPaletteClasses[colorIndex % labelColorPaletteClasses.length],
              });
              colorIndex++;
          }
      });
      
      const newlyCreatedTasks = allNewTasks.filter(t => !existingTasks.some(et => et.id === t.id));

      if (newlyCreatedTasks.length === 0 && finalLabelsToCreate.length === 0) {
        setSuccessMessage("هیچ ایشو جدید یا لینک‌شده‌ای برای وارد کردن یافت نشد. همه چیز به‌روز است.");
      } else {
        onImport(allNewTasks, finalLabelsToCreate);
        setSuccessMessage(`${newlyCreatedTasks.length} تسک جدید (شامل تسک‌های فرزند) با موفقیت وارد شد!`);
      }

      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'یک خطای ناشناخته رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">وارد کردن از گیت‌لب</h2>
            
            {configError && <div className="bg-amber-100 border border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 px-4 py-3 rounded-lg relative mb-4" role="alert">{configError}</div>}
            
            <form id="gitlab-import-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="project-id" className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">شناسه پروژه</label>
                <input
                  type="text" id="project-id" value={projectId} onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left dir-ltr disabled:opacity-50"
                  placeholder="مثال: 123456"
                  required
                  disabled={!!configError || isLoading}
                />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">شناسه عددی پروژه را در صفحه اصلی پروژه پیدا کنید. می‌توانید پیش‌فرض را در پروفایل تنظیم کنید.</p>
              </div>
              
              {error && <div className="bg-rose-100 border border-rose-400 text-rose-700 dark:text-rose-900/50 dark:text-rose-200 px-4 py-3 rounded-lg relative" role="alert">{error}</div>}
              {successMessage && <div className="bg-emerald-100 border border-emerald-400 text-emerald-700 dark:text-emerald-900/50 dark:text-emerald-200 px-4 py-3 rounded-lg relative" role="alert">{successMessage}</div>}
            </form>
        </div>

        <div className="px-8 py-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-end items-center gap-4">
              <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600 disabled:opacity-50">لغو</button>
              <button type="submit" form="gitlab-import-form" disabled={isLoading || !!configError || !projectId} className="px-6 py-2 bg-sky-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'وارد کردن'
                )}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GitLabImportModal;