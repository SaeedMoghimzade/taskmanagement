import { type Column, type Label } from './types';

export const INITIAL_COLUMNS: Column[] = [
  { id: 'انجام نشده', title: 'انجام نشده', order: 0 },
  { id: 'در حال انجام', title: 'در حال انجام', order: 1 },
  { id: 'بازبینی', title: 'بازبینی', order: 2 },
  { id: 'انجام شده', title: 'انجام شده', order: 3 },
];

const LABEL_COLORS = {
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200 border border-sky-500/30',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/70 dark:text-fuchsia-200 border border-fuchsia-500/30',
    lime: 'bg-lime-100 text-lime-800 dark:bg-lime-900/70 dark:text-lime-200 border border-lime-500/30',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-500/30',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-200 border border-violet-500/30',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200 border border-rose-500/30',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200 border border-red-500/30',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200 border border-teal-500/30',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-200 border border-orange-500/30',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200 border border-indigo-500/30',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/70 dark:text-pink-200 border border-pink-500/30',
    gray: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-500/30',
  };
  
export const INITIAL_LABELS: Label[] = [
    { id: 'رابط کاربری', color: LABEL_COLORS.sky },
    { id: 'طراحی', color: LABEL_COLORS.fuchsia },
    { id: 'بک‌اند', color: LABEL_COLORS.lime },
    { id: 'ویژگی جدید', color: LABEL_COLORS.amber },
    { id: 'DevOps', color: LABEL_COLORS.violet },
    { id: 'مستندات', color: LABEL_COLORS.rose },
    { id: 'باگ', color: LABEL_COLORS.red },
    { id: 'تست', color: LABEL_COLORS.teal },
  ];
  
export const LABEL_COLOR_PALETTE: { name: string, class: string }[] = [
    { name: 'آبی آسمانی', class: LABEL_COLORS.sky },
    { name: 'سرخابی', class: LABEL_COLORS.fuchsia },
    { name: 'لیمویی', class: LABEL_COLORS.lime },
    { name: 'کهربایی', class: LABEL_COLORS.amber },
    { name: 'بنفش', class: LABEL_COLORS.violet },
    { name: 'رز', class: LABEL_COLORS.rose },
    { name: 'قرمز', class: LABEL_COLORS.red },
    { name: 'سبز دودی', class: LABEL_COLORS.teal },
    { name: 'نارنجی', class: LABEL_COLORS.orange },
    { name: 'ایندیگو', class: LABEL_COLORS.indigo },
    { name: 'صورتی', class: LABEL_COLORS.pink },
    { name: 'خاکستری', class: LABEL_COLORS.gray },
];
