import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { type Task, type Label, type Column } from './types';

interface KanbanDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  labels: {
    key: string;
    value: Label;
  };
  columns: {
    key: string;
    value: Column;
  };
}

const DB_NAME = 'kanban-db';
const DB_VERSION = 2; // Incremented version for schema change

let dbPromise: Promise<IDBPDatabase<KanbanDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<KanbanDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('labels')) {
          db.createObjectStore('labels', { keyPath: 'id' });
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains('columns')) {
            db.createObjectStore('columns', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getStoredTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAll('tasks');
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('tasks', 'readwrite');
  await tx.objectStore('tasks').clear();
  await Promise.all(tasks.map(task => tx.objectStore('tasks').put(task)));
  await tx.done;
}

export async function getStoredLabels(): Promise<Label[]> {
  const db = await getDb();
  return db.getAll('labels');
}

export async function saveLabels(labels: Label[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('labels', 'readwrite');
  await tx.objectStore('labels').clear();
  await Promise.all(labels.map(label => tx.objectStore('labels').put(label)));
  await tx.done;
}

export async function getStoredColumns(): Promise<Column[]> {
    const db = await getDb();
    const columns = await db.getAll('columns');
    return columns.sort((a, b) => a.order - b.order);
}

export async function saveColumns(columns: Column[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('columns', 'readwrite');
    await tx.objectStore('columns').clear();
    await Promise.all(columns.map(column => tx.objectStore('columns').put(column)));
    await tx.done;
}
