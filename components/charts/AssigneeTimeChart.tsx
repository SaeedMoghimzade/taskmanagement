

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { type Task } from '../../types';
import CustomChartLegend from './CustomChartLegend';

declare global {
  interface Window {
    Chart: any;
  }
}

interface ChartProps {
  tasks: Task[];
  theme: 'light' | 'dark';
}

const AssigneeTimeChart: React.FC<ChartProps> = ({ tasks, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);
    const [hiddenAssignees, setHiddenAssignees] = useState<Set<string>>(new Set());
    const [datasetVisibility, setDatasetVisibility] = useState({
        estimated: true,
        spent: true,
    });

    const sortedAssignees = useMemo(() => {
        interface AssigneeStats {
            estimatedHours: number;
            spentHours: number;
        }
        const statsByAssignee: Map<string, AssigneeStats> = new Map();

        tasks.forEach(task => {
            const assignee = task.assignee || 'واگذار نشده';
            if (!statsByAssignee.has(assignee)) {
                statsByAssignee.set(assignee, { estimatedHours: 0, spentHours: 0 });
            }
            const stats = statsByAssignee.get(assignee)!;
            if (task.duration && task.duration > 0) {
                // Assuming 8 hours per day for duration
                stats.estimatedHours += task.duration * 8;
            }
            if (task.timeSpent && task.timeSpent > 0) {
                // timeSpent is in seconds, convert to hours
                stats.spentHours += task.timeSpent / 3600;
            }
        });

        return Array.from(statsByAssignee.entries()).sort((a, b) => {
            const totalA = a[1].estimatedHours + a[1].spentHours;
            const totalB = b[1].estimatedHours + b[1].spentHours;
            return totalB - totalA;
        });
    }, [tasks]);

    useEffect(() => {
        if (!canvasRef.current || typeof window.Chart === 'undefined') return;
        
        const visibleAssignees = sortedAssignees.filter(entry => !hiddenAssignees.has(entry[0]));
        
        const chartLabels = visibleAssignees.map(entry => entry[0]);
        const estimatedData = visibleAssignees.map(entry => entry[1].estimatedHours.toFixed(2));
        const spentData = visibleAssignees.map(entry => entry[1].spentHours.toFixed(2));

        const chartData = {
            labels: chartLabels,
            datasets: [
                {
                    label: 'زمان تخمینی (ساعت)',
                    data: estimatedData,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)', // sky-400
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hidden: !datasetVisibility.estimated,
                },
                {
                    label: 'زمان سپری شده (ساعت)',
                    data: spentData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)', // emerald-500
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hidden: !datasetVisibility.spent,
                }
            ]
        };

        const textColor = theme === 'dark' ? '#cbd5e1' : '#334155';
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: textColor, font: { family: 'Vazirmatn, sans-serif' } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, font: { family: 'Vazirmatn, sans-serif' } },
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'ساعت',
                        color: textColor,
                        font: { family: 'Vazirmatn, sans-serif', size: 12 },
                    }
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    bodyFont: { family: 'Vazirmatn, sans-serif' },
                    titleFont: { family: 'Vazirmatn, sans-serif' },
                    callbacks: {
                        label: function(context: any) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `${context.parsed.y} ساعت`;
                            }
                            return label;
                        }
                    }
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
    }, [sortedAssignees, theme, hiddenAssignees, datasetVisibility]);

    const handleAssigneeLegendClick = (name: string) => {
        setHiddenAssignees(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    const handleDatasetLegendClick = (label: string) => {
        if (label === 'زمان تخمینی (ساعت)') {
            setDatasetVisibility(prev => ({ ...prev, estimated: !prev.estimated }));
        } else if (label === 'زمان سپری شده (ساعت)') {
            setDatasetVisibility(prev => ({ ...prev, spent: !prev.spent }));
        }
    };

    const assigneeLegendItems = sortedAssignees.map(([name]) => ({
        text: name,
        color: 'rgba(100, 116, 139, 0.7)', // slate-500
        isHidden: hiddenAssignees.has(name)
    }));

    const datasetLegendItems = [
        {
            text: 'زمان تخمینی (ساعت)',
            color: 'rgba(56, 189, 248, 0.6)', // sky-400
            isHidden: !datasetVisibility.estimated
        },
        {
            text: 'زمان سپری شده (ساعت)',
            color: 'rgba(16, 185, 129, 0.6)', // emerald-500
            isHidden: !datasetVisibility.spent
        }
    ];

    return (
        <div>
            <h2 className="text-center text-lg sm:text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                مقایسه زمان تخمینی و سپری شده افراد
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_256px] gap-6" style={{ height: '60vh', minHeight: '400px' }}>
                <div className="h-full relative min-w-0">
                    <canvas ref={canvasRef}></canvas>
                </div>
                <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-4">
                    <CustomChartLegend
                        items={datasetLegendItems}
                        onItemClick={handleDatasetLegendClick}
                        title="نوع داده"
                    />
                    {assigneeLegendItems.length > 0 && (
                        <CustomChartLegend
                            items={assigneeLegendItems}
                            onItemClick={handleAssigneeLegendClick}
                            title="مسئول تسک"
                            maxHeight="calc(60vh - 180px)"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssigneeTimeChart;