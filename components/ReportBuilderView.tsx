import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type Task, type Label, type Column } from '../types';

declare global {
  interface Window {
    Chart: any;
  }
}

type ChartType = 'bar' | 'pie' | 'line';
type Dimension = 'status' | 'assignee' | 'milestone' | 'has_parent' | 'labels' | 'creation_month' | 'completion_month';
type Metric = 'count' | 'sum_duration' | 'sum_timeSpent';

interface ReportConfig {
  chartType: ChartType;
  dimension: Dimension | '';
  metric: Metric | '';
  segment: Dimension | 'none';
}

interface ChartRenderData {
    type: ChartType;
    data: any;
    options: any;
}

const DIMENSIONS: { value: Dimension; name: string }[] = [
  { value: 'status', name: 'وضعیت' },
  { value: 'assignee', name: 'مسئول' },
  { value: 'milestone', name: 'مایل‌استون' },
  { value: 'has_parent', name: 'والد/فرزند' },
  { value: 'labels', name: 'لیبل‌ها' },
  { value: 'creation_month', name: 'ماه ساخت' },
  { value: 'completion_month', name: 'ماه اتمام' },
];

const METRICS: { value: Metric; name: string; validCharts: ChartType[] }[] = [
  { value: 'count', name: 'تعداد تسک‌ها', validCharts: ['bar', 'pie', 'line'] },
  { value: 'sum_duration', name: 'مجموع مدت زمان (روز)', validCharts: ['bar', 'line'] },
  { value: 'sum_timeSpent', name: 'مجموع زمان سپری‌شده (ساعت)', validCharts: ['bar', 'line'] },
];

const COLOR_PALETTE = [
  'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(249, 115, 22, 0.7)',
  'rgba(245, 158, 11, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)',
  'rgba(99, 102, 241, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(217, 70, 239, 0.7)',
  'rgba(244, 63, 94, 0.7)', 'rgba(20, 184, 166, 0.7)', 'rgba(217, 119, 6, 0.7)'
];

interface ReportsViewProps {
  tasks: Task[];
  labels: Label[];
  columns: Column[];
  theme: 'light' | 'dark';
}

const ReportBuilderView: React.FC<ReportsViewProps> = ({ tasks, columns, theme }) => {
  const [config, setConfig] = useState<ReportConfig>({
    chartType: 'bar',
    dimension: '',
    metric: '',
    segment: 'none',
  });
  const [chartRenderData, setChartRenderData] = useState<ChartRenderData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const columnMap = useMemo(() => new Map(columns.map(c => [c.id, c.title])), [columns]);

  const getDimensionValue = useCallback((task: Task, dimension: Dimension): string[] => {
    switch (dimension) {
        case 'status': return [columnMap.get(task.status) || task.status];
        case 'assignee': return [task.assignee || 'واگذار نشده'];
        case 'milestone': return [task.milestone?.title || 'بدون مایل‌استون'];
        case 'has_parent': return [task.parentId ? 'فرزند' : 'والد'];
        case 'labels': return task.labels && task.labels.length > 0 ? task.labels : ['بدون لیبل'];
        case 'creation_month': 
            return task.creationDate ? [new Date(task.creationDate).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })] : ['نامشخص'];
        case 'completion_month':
            return task.completionDate ? [new Date(task.completionDate).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })] : ['نامشخص'];
        default: return ['نامشخص'];
    }
  }, [columnMap]);

  const handleConfigChange = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
      const newConfig = { ...config, [key]: value };
      if (key === 'chartType' && value === 'pie' && (config.metric === 'sum_duration' || config.metric === 'sum_timeSpent')) {
          newConfig.metric = 'count';
      }
      if (key === 'dimension' && value === newConfig.segment) {
        newConfig.segment = 'none';
      }
      setConfig(newConfig);
  };
  
  const filteredMetrics = useMemo(() => {
      return METRICS.filter(m => m.validCharts.includes(config.chartType));
  }, [config.chartType]);

  const handleGenerateChart = useCallback(() => {
    const { chartType, dimension, metric, segment } = config;

    if (dimension === '' || metric === '') {
        alert("لطفا بعد اصلی و سنجه را انتخاب کنید.");
        return;
    }

    const data = new Map<string, any>();

    for (const task of tasks) {
        const primaryDimValues = getDimensionValue(task, dimension);

        let metricValue = 0;
        switch (metric) {
            case 'sum_duration':
                metricValue = task.duration || 0;
                break;
            case 'sum_timeSpent':
                metricValue = (task.timeSpent || 0) / 3600; // to hours
                break;
            default: // 'count'
                metricValue = 1;
                break;
        }

        if (metricValue === 0 && metric !== 'count') {
            continue;
        }

        for (const primaryKey of primaryDimValues) {
            if (segment !== 'none') {
                if (!data.has(primaryKey)) {
                    data.set(primaryKey, new Map<string, number>());
                }
                const segmentMap = data.get(primaryKey) as Map<string, number>;
                const segmentKeys = getDimensionValue(task, segment);
                for (const segmentKey of segmentKeys) {
                    segmentMap.set(segmentKey, (segmentMap.get(segmentKey) || 0) + metricValue);
                }
            } else {
                data.set(primaryKey, (data.get(primaryKey) || 0) + metricValue);
            }
        }
    }

    if (data.size === 0) {
        alert("هیچ داده‌ای مطابق با فیلترهای شما برای ساخت گزارش یافت نشد.");
        setChartRenderData(null);
        return;
    }

    const labels = Array.from(data.keys()).sort();
    let datasets;

    if (segment !== 'none') {
        const allSegmentKeys = new Set<string>();
        for (const segmentMap of data.values()) {
            for (const key of (segmentMap as Map<string, number>).keys()) {
                allSegmentKeys.add(key);
            }
        }
        const sortedSegmentKeys = Array.from(allSegmentKeys).sort();

        datasets = sortedSegmentKeys.map((segKey, i) => ({
            label: segKey,
            data: labels.map(l => (data.get(l) as Map<string, number>).get(segKey) || 0),
            backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length],
        }));
    } else {
        datasets = [{
            label: METRICS.find(m => m.value === metric)?.name || 'مقدار',
            data: labels.map(l => data.get(l)),
            backgroundColor: chartType === 'pie' ? labels.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]) : COLOR_PALETTE[0],
        }];
    }
    
    if (datasets.length === 0 || datasets.every(d => d.data.every(val => val === 0))) {
        alert("هیچ داده‌ای برای دسته‌های انتخاب شده یافت نشد.");
        setChartRenderData(null);
        return;
    }

    const textColor = theme === 'dark' ? '#cbd5e1' : '#334155';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: (chartType !== 'pie') ? {
            x: { stacked: segment !== 'none', ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: gridColor } },
            y: { stacked: segment !== 'none', ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: gridColor } }
        } : {},
        plugins: {
            legend: { position: 'top', labels: { color: textColor, font: { family: 'Vazirmatn' } } },
            title: { display: true, text: 'نمودار سفارشی شما', color: textColor, font: { family: 'Vazirmatn', size: 18, weight: 'bold' }, padding: { bottom: 20 } },
            tooltip: { bodyFont: { family: 'Vazirmatn' }, titleFont: { family: 'Vazirmatn' } }
        }
    };
    
    setChartRenderData({ type: chartType, data: { labels, datasets }, options });
  }, [config, tasks, theme, getDimensionValue]);
  
  useEffect(() => {
    if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
    }
    if (chartRenderData && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            try {
                chartRef.current = new window.Chart(ctx, {
                    type: chartRenderData.type,
                    data: chartRenderData.data,
                    options: chartRenderData.options,
                });
            } catch (error) {
                console.error("Chart.js failed to render:", error);
                setChartRenderData(null);
            }
        }
    }
    return () => {
        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }
    };
  }, [chartRenderData]);


  if (tasks.length === 0) {
    return (
        <div className="flex justify-center items-center h-[50vh] bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xl text-slate-600 dark:text-slate-400">ابتدا چند تسک بسازید تا بتوانید گزارش تهیه کنید.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">گزارش ساز سفارشی</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg flex flex-col gap-4 h-fit">
                <h2 className="text-lg font-bold">تنظیمات نمودار</h2>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع نمودار</label>
                    <select value={config.chartType} onChange={(e) => handleConfigChange('chartType', e.target.value as ChartType)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
                        <option value="bar">میله‌ای</option>
                        <option value="pie">دایره‌ای</option>
                        <option value="line">خطی</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بعد اصلی (محور X)</label>
                    <select value={config.dimension} onChange={(e) => handleConfigChange('dimension', e.target.value as Dimension)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
                        <option value="" disabled>انتخاب کنید...</option>
                        {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سنجه (محور Y)</label>
                    <select value={config.metric} onChange={(e) => handleConfigChange('metric', e.target.value as Metric)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
                        <option value="" disabled>انتخاب کنید...</option>
                        {filteredMetrics.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تفکیک بر اساس (اختیاری)</label>
                    <select value={config.segment} onChange={(e) => handleConfigChange('segment', e.target.value as ReportConfig['segment'])} disabled={config.chartType === 'pie'} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-50">
                        <option value="none">بدون تفکیک</option>
                        {DIMENSIONS.filter(d => d.value !== config.dimension).map(d => <option key={d.value} value={d.value}>{d.name}</option>)}
                    </select>
                </div>

                <button
                    onClick={handleGenerateChart}
                    disabled={!config.dimension || !config.metric}
                    className="w-full mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold shadow-md hover:bg-sky-700 transition-colors transform hover:scale-105 active:scale-100 disabled:bg-sky-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                    تولید نمودار
                </button>
            </div>
            
            <div className="lg:col-span-3 p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg min-h-[60vh]">
                {chartRenderData ? (
                     <div className="w-full h-full">
                        <canvas ref={canvasRef}></canvas>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-xl text-slate-500 dark:text-slate-400 text-center">برای شروع، گزینه‌های مورد نظر خود را انتخاب کرده و دکمه «تولید نمودار» را بزنید.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ReportBuilderView;
