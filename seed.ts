import { type Task } from './types';

const today = new Date();
const toISO = (date: Date) => date.toISOString().split('T')[0];

export const INITIAL_TASKS: Task[] = [];