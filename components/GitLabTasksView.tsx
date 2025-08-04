import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GitLabIcon } from './icons/GitLabIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import MoveToKanbanModal from './MoveToKanbanModal';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import GitLabTaskFilters, { type FiltersState, UNASSIGNED_KEY, NO_MILESTONE_KEY } from './GitLabTaskFilters';
import { type Column, type Task, type Label } from '../types';
import { FilterIcon } from './icons/FilterIcon';

// Define types for GitLab data
interface GitLabIssue {
    id: number;
    iid: number;
    title: string;
    description: string | null;
    web_url: string;
    assignee: { name: string } | null;
    assignees: { name: string }[];
    labels: string[];
    created_at: string;
    closed_at: string | null;
    state: 'opened' | 'closed';
    time_stats: {
        time_estimate: number;
        total_time_spent: number;
    };
    milestone: {
        title: string;
        due_date: string;
    } | null;
}

interface GitLabProject {
    id: number;
    name: string;
    web_url: string;
    issues: GitLabIssue[];
}

interface GitLabGroup {
    id: number;
    name: string;
    web_url: string;
    projects: GitLabProject[];
}

interface GitLabTasksViewProps {
    columns: Column[];
    allTasks: Task[];
    onAddTaskFromGitLab: (issue: GitLabIssue, projectId: number, columnId: string, parentId?: string) => Promise<boolean>;
}

const initialFilters: FiltersState = {
    assignee: 'all',
    milestone: 'all',
    labels: [],
};

const GitLabTasksView: React.FC<GitLabTasksViewProps> = ({ columns, allTasks, onAddTaskFromGitLab }) => {
    // State for UI control
    const [configSaved, setConfigSaved] = useState(() => !!localStorage.getItem('gitlabToken'));
    
    // State for data fetching
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<GitLabGroup[]>([]);
    
    // State for UI interaction
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
    const [selectedIssue, setSelectedIssue] = useState<{issue: GitLabIssue, projectId: number} | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FiltersState>(initialFilters);

    const fetchAllPages = async (url: string, token: string) => {
        let results: any[] = [];
        let nextPage: string | number | null = 1;
        while (nextPage) {
            const fullUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${nextPage}`;
            const response = await fetch(fullUrl, { headers: { 'PRIVATE-TOKEN': token } });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`خطا در دریافت از ${url}: ${errorData.message || response.statusText}`);
            }
            
            const pageData = await response.json();
            results = results.concat(pageData);
            
            const nextPageHeader = response.headers.get('x-next-page');
            nextPage = nextPageHeader ? parseInt(nextPageHeader, 10) : null;
        }
        return results;
    };

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('gitlabToken');
        const gitlabUrl = localStorage.getItem('gitlabUrl');

        if (!configSaved || !token || !gitlabUrl) return;

        setIsLoading(true);
        setError(null);
        setData([]);

        try {
            const baseUrl = gitlabUrl.replace(/\/$/, '');
            
            const groups = await fetchAllPages(`${baseUrl}/api/v4/groups?min_access_level=10`, token);

            const groupsWithData: GitLabGroup[] = await Promise.all(
                groups.map(async (group): Promise<GitLabGroup> => {
                    const projects = await fetchAllPages(`${baseUrl}/api/v4/groups/${group.id}/projects?min_access_level=10&archived=false`, token);
                    
                    const projectsWithIssues: GitLabProject[] = await Promise.all(
                        projects.map(async (project): Promise<GitLabProject> => {
                            const issues = await fetchAllPages(`${baseUrl}/api/v4/projects/${project.id}/issues?state=opened`, token);
                            return {
                                id: project.id,
                                name: project.name,
                                web_url: project.web_url,
                                issues: issues.map((i): GitLabIssue => ({
                                    id: i.id,
                                    iid: i.iid,
                                    title: i.title,
                                    description: i.description,
                                    web_url: i.web_url,
                                    assignee: i.assignee,
                                    assignees: i.assignees,
                                    labels: i.labels,
                                    created_at: i.created_at,
                                    closed_at: i.closed_at,
                                    state: i.state,
                                    time_stats: i.time_stats,
                                    milestone: i.milestone,
                                }))
                            };
                        })
                    );
                    
                    const filteredProjects = projectsWithIssues.filter(p => p.issues.length > 0);

                    return {
                        id: group.id,
                        name: group.name,
                        web_url: group.web_url,
                        projects: filteredProjects,
                    };
                })
            );

            const finalData = groupsWithData.filter(g => g.projects.length > 0);
            setData(finalData);

        } catch (err: any) {
            setError(err.message || 'یک خطای ناشناخته رخ داد.');
        } finally {
            setIsLoading(false);
        }
    }, [configSaved]);

    useEffect(() => {
        // This effect re-checks if config is saved, e.g., after user sets it in profile and comes back.
        const newConfigSaved = !!localStorage.getItem('gitlabToken');
        if(newConfigSaved !== configSaved) {
            setConfigSaved(newConfigSaved);
        }
        if (newConfigSaved) {
            fetchData();
        }
    }, [configSaved, fetchData]);

    const { filterOptions, filteredData, activeFilterCount } = useMemo(() => {
        const assignees = new Set<string>();
        const milestones = new Set<string>();
        const labels = new Set<string>();
        let hasUnassigned = false;
        let hasNoMilestone = false;
        
        data.forEach(group => {
            group.projects.forEach(project => {
                project.issues.forEach(issue => {
                    const issueAssignees = issue.assignees?.map(a => a.name) || (issue.assignee ? [issue.assignee.name] : []);
                    if (issueAssignees.length > 0) {
                        issueAssignees.forEach(name => assignees.add(name));
                    } else {
                        hasUnassigned = true;
                    }

                    if (issue.milestone?.title) {
                        milestones.add(issue.milestone.title);
                    } else {
                        hasNoMilestone = true;
                    }
                    issue.labels?.forEach(label => labels.add(label));
                });
            });
        });
        
        const sortedAssignees = Array.from(assignees).sort();
        if (hasUnassigned) {
            sortedAssignees.unshift(UNASSIGNED_KEY);
        }
        
        const sortedMilestones = Array.from(milestones).sort();
        if (hasNoMilestone) {
            sortedMilestones.unshift(NO_MILESTONE_KEY);
        }
        
        const availableLabels: Label[] = Array.from(labels).sort().map(l => ({ id: l, color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-400' }));
        const options = {
            assignees: sortedAssignees,
            milestones: sortedMilestones,
            labels: availableLabels,
        };

        const isFilterActive = filters.assignee !== 'all' || filters.milestone !== 'all' || filters.labels.length > 0;
        
        const filtered = !isFilterActive ? data : data.map(group => ({
            ...group,
            projects: group.projects.map(project => ({
                ...project,
                issues: project.issues.filter(issue => {
                    let assigneeMatch;
                    if (filters.assignee === 'all') {
                        assigneeMatch = true;
                    } else if (filters.assignee === UNASSIGNED_KEY) {
                        assigneeMatch = !issue.assignee && (!issue.assignees || issue.assignees.length === 0);
                    } else {
                        const issueAssignees = issue.assignees?.map(a => a.name) || (issue.assignee ? [issue.assignee.name] : []);
                        assigneeMatch = issueAssignees.includes(filters.assignee as string);
                    }

                    let milestoneMatch;
                    if (filters.milestone === 'all') {
                        milestoneMatch = true;
                    } else if (filters.milestone === NO_MILESTONE_KEY) {
                        milestoneMatch = !issue.milestone;
                    } else {
                        milestoneMatch = issue.milestone?.title === filters.milestone;
                    }

                    const labelsMatch = filters.labels.length === 0 || (issue.labels && filters.labels.some(filterLabel => issue.labels.includes(filterLabel)));
                    return assigneeMatch && milestoneMatch && labelsMatch;
                }),
            })).filter(project => project.issues.length > 0),
        })).filter(group => group.projects.length > 0);

        let count = 0;
        if (filters.assignee !== 'all') count++;
        if (filters.milestone !== 'all') count++;
        if (filters.labels.length > 0) count++;

        return { filterOptions: options, filteredData: filtered, activeFilterCount: count };
    }, [data, filters]);
    
    const handleFilterChange = (newFilters: Partial<FiltersState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
    };

    const handleConfirmMove = async (columnId: string, parentId?: string) => {
        if (!selectedIssue) return;
        const success = await onAddTaskFromGitLab(selectedIssue.issue, selectedIssue.projectId, columnId, parentId);
        if (!success) {
            alert(`تسک «${selectedIssue.issue.title}» از قبل در تخته کانبان شما وجود دارد.`);
        }
        setSelectedIssue(null);
    };

    const toggleGroup = (groupId: number) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) newSet.delete(groupId);
            else newSet.add(groupId);
            return newSet;
        });
    };
    
    const toggleProject = (projectId: number) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) newSet.delete(projectId);
            else newSet.add(projectId);
            return newSet;
        });
    };

    if (!configSaved) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-full max-w-lg bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg text-center">
                    <div className="w-16 h-16 mx-auto bg-sky-100 dark:bg-sky-900/50 text-sky-500 dark:text-sky-400 rounded-full flex items-center justify-center mb-4">
                        <GitLabIcon />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">اتصال به گیت‌لب</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        برای مشاهده تسک‌های گیت‌لب، لطفا ابتدا اطلاعات اتصال (آدرس و توکن) را در صفحه پروفایل خود تنظیم و ذخیره کنید.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">تسک‌های گیت‌لب</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(prev => !prev)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
                        aria-expanded={showFilters}
                    >
                        <FilterIcon />
                        <span>فیلترها</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button onClick={fetchData} disabled={isLoading} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                        {isLoading ? 'در حال بارگذاری...' : 'بارگذاری مجدد'}
                    </button>
                </div>
            </header>
            
            {showFilters && (
                <GitLabTaskFilters
                    filters={filters}
                    availableAssignees={filterOptions.assignees}
                    availableMilestones={filterOptions.milestones}
                    availableLabels={filterOptions.labels}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            )}

            <main className="flex-grow overflow-y-auto bg-slate-100/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {isLoading && filteredData.length === 0 && (
                     <div className="flex justify-center items-center h-full gap-4">
                        <svg className="animate-spin h-8 w-8 text-sky-600 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xl text-slate-700 dark:text-slate-300">در حال دریافت داده‌ها از گیت‌لب...</span>
                    </div>
                )}
                {error && <p className="text-center text-red-500 p-4">{error}</p>}
                {!isLoading && data.length > 0 && filteredData.length === 0 && !error && <p className="text-center text-slate-500 p-4">هیچ تسکی با فیلترهای اعمال شده یافت نشد.</p>}
                {!isLoading && data.length === 0 && !error && <p className="text-center text-slate-500 p-4">هیچ گروه یا پروژه‌ای با تسک‌های باز یافت نشد.</p>}

                <div className="space-y-4">
                    {filteredData.map(group => (
                        <div key={group.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                           <button onClick={() => toggleGroup(group.id)} className="w-full flex justify-between items-center p-4 text-right">
                               <div className="flex items-center gap-3">
                                   {expandedGroups.has(group.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                   <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{group.name}</h2>
                               </div>
                               <span className="text-sm font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">{group.projects.reduce((acc, p) => acc + p.issues.length, 0)}</span>
                           </button>
                           {expandedGroups.has(group.id) && (
                               <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
                                   {group.projects.map(project => (
                                       <div key={project.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700/50">
                                            <button onClick={() => toggleProject(project.id)} className="w-full flex justify-between items-center p-3 text-right">
                                                <div className="flex items-center gap-2">
                                                    {expandedProjects.has(project.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{project.name}</h3>
                                                </div>
                                                <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{project.issues.length}</span>
                                            </button>
                                            {expandedProjects.has(project.id) && (
                                                <div className="border-t border-slate-200 dark:border-slate-700/50 p-3 space-y-2">
                                                    {project.issues.map(issue => (
                                                        <div key={issue.id} className="p-3 rounded-lg bg-white dark:bg-slate-700/50 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <a href={issue.web_url} target="_blank" rel="noopener noreferrer" className="flex-grow hover:text-sky-500 transition-colors">
                                                                    <p className="font-medium text-slate-800 dark:text-slate-100">{issue.title} <span className="text-slate-400">#{issue.iid}</span></p>
                                                                </a>
                                                                <button 
                                                                    onClick={() => setSelectedIssue({ issue, projectId: project.id })}
                                                                    className="ml-2 p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 rounded-full hover:bg-sky-100 dark:hover:bg-slate-600 transition-colors flex-shrink-0" 
                                                                    title="افزودن به تخته کانبان"
                                                                >
                                                                    <PlusCircleIcon />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {issue.labels.map(label => <span key={label} className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">{label}</span>)}
                                                                </div>
                                                                {(issue.assignee || issue.assignees?.[0]) && <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{issue.assignee?.name || issue.assignees?.[0]?.name}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>
                    ))}
                </div>
            </main>
            {selectedIssue && (
                <MoveToKanbanModal
                    issue={selectedIssue.issue}
                    columns={columns}
                    allTasks={allTasks}
                    onClose={() => setSelectedIssue(null)}
                    onConfirm={handleConfirmMove}
                />
            )}
        </div>
    );
};

export default GitLabTasksView;