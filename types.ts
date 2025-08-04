
export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface Label {
  id: string;
  color: string;
}

export interface Milestone {
  title: string;
  dueDate?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // Changed from ColumnId to string
  creationDate: string;
  order: number;
  assignee?: string;
  labels?: string[];
  startDate?: string;
  duration?: number;
  timeSpent?: number; // in seconds
  completionDate?: string;
  parentId?: string;
  milestone?: Milestone;
  gitlabUrl?: string;
}
