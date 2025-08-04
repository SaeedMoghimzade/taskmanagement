

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { type Task, type Label } from '../../types';
import CustomChartLegend from './CustomChartLegend';

declare global {
  interface Window {
    Chart: any;
  }
}

interface ChartProps {
  tasks: Task[];
  labels: Label[];
  theme: 'light' | 'dark';
}

const LabelUsageChart: React.FC<ChartProps> = ({ tasks, labels: availableLabels, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

    const { sortedLabels, colorMap } = useMemo(() => {
        const labelCounts: { [key: string]: number } = {};
        availableLabels.forEach(l => labelCounts[l.id] = 0);

        tasks.forEach(task => {
            task.labels?.forEach(labelId => {
                if (labelCounts.hasOwnProperty(labelId)) {
                    labelCounts[labelId]++;
                }
            });
        });
        
        const sorted = Object.entries(labelCounts)
          .sort((a, b) => b[1] - a[1])
          .filter(entry => entry[1] > 0);
        
        const colorPalette = [
            'rgba(139, 92, 246, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(245, 158, 11, 0.7)',
            'rgba(99, 102, 241, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(217, 70, 239, 0.7)',
            'rgba(244, 63, 94, 0.7)'
        ];

        const map = new Map<string, string>();
        sorted.forEach(([name], i) => {
            map.set(name, colorPalette[i % colorPalette.length]);
        });

        return { sortedLabels: sorted, colorMap: map };
    }, [tasks, availableLabels]);

    useEffect(() => {
        if (!canvasRef.current || typeof window.Chart === 'undefined') return;

        const visibleLabels = sortedLabels.filter(entry => !hiddenItems.has(entry[0]));

        const chartLabels = visibleLabels.map(entry => entry[0]);
        const chartValues = visibleLabels.map(entry => entry[1]);

        const backgroundColors = visibleLabels.map(entry => colorMap.get(entry[0])!);
        const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));

        const chartData = {
            labels: chartLabels,
            datasets: [{
                label: 'تعداد استفاده',
                data: chartValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 5,
            }]
        };

        const textColor = theme === 'dark' ? '#cbd5e1' : '#334155';
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: { family: 'Vazirmatn, sans-serif' }
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Vazirmatn, sans-serif' },
                        stepSize: 1,
                    },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    bodyFont: { family: 'Vazirmatn, sans-serif' },
                    titleFont: { family: 'Vazirmatn, sans-serif' },
                }
            }
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        chartRef.current = new window.Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: chartOptions,
        });

        return () => chartRef.current?.destroy();
    }, [sortedLabels, colorMap, theme, hiddenItems]);

    const handleLegendClick = (label: string) => {
        setHiddenItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(label)) {
                newSet.delete(label);
            } else {
                newSet.add(label);
            }
            return newSet;
        });
    };

    const legendItems = sortedLabels.map(([name]) => ({
        text: name,
        color: colorMap.get(name) || '#ccc',
        isHidden: hiddenItems.has(name)
    }));

    return (
        <div>
            <h2 className="text-center text-lg sm:text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                میزان استفاده از لیبل‌ها
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_224px] gap-6" style={{ height: '60vh', minHeight: '400px' }}>
                <div className="h-full relative min-w-0">
                    <canvas ref={canvasRef}></canvas>
                </div>
                {legendItems.length > 0 && (
                    <div className="w-full md:w-auto flex-shrink-0">
                        <CustomChartLegend
                            items={legendItems}
                            onItemClick={handleLegendClick}
                            title="لیبل‌ها"
                            maxHeight="calc(60vh - 40px)"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default LabelUsageChart;