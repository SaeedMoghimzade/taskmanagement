import React, { useEffect, useRef } from 'react';
import { type Task, type Column } from '../../types';

declare global {
  interface Window {
    Chart: any;
  }
}

interface ChartProps {
  tasks: Task[];
  columns: Column[];
  theme: 'light' | 'dark';
}

const COLOR_PALETTE = [
    'rgba(251, 113, 133, 0.7)', // rose-400
    'rgba(56, 189, 248, 0.7)', // sky-400
    'rgba(139, 92, 246, 0.7)',  // violet-500
    'rgba(16, 185, 129, 0.7)', // emerald-500
    'rgba(245, 158, 11, 0.7)', // amber-400
    'rgba(236, 72, 153, 0.7)', // pink-500
];

const TaskStatusChart: React.FC<ChartProps> = ({ tasks, columns, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null); 

    useEffect(() => {
        if (!canvasRef.current || typeof window.Chart === 'undefined') return;
        
        const statusCounts = new Map<string, number>();
        columns.forEach(c => statusCounts.set(c.id, 0));

        tasks.forEach(task => {
            if (statusCounts.has(task.status)) {
                statusCounts.set(task.status, statusCounts.get(task.status)! + 1);
            }
        });

        const sortedColumns = [...columns].sort((a,b) => a.order - b.order);

        const chartData = {
            labels: sortedColumns.map(c => c.title),
            datasets: [{
                data: sortedColumns.map(c => statusCounts.get(c.id) || 0),
                backgroundColor: sortedColumns.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]),
                borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                borderWidth: 3,
            }]
        };

        const textColor = theme === 'dark' ? '#cbd5e1' : '#334155';
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Vazirmatn, sans-serif',
                            size: 14,
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'توزیع وظایف بر اساس وضعیت',
                    color: textColor,
                    font: {
                        family: 'Vazirmatn, sans-serif',
                        size: 18,
                        weight: 'bold',
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                tooltip: {
                    bodyFont: {
                        family: 'Vazirmatn, sans-serif',
                    },
                    titleFont: {
                        family: 'Vazirmatn, sans-serif',
                    },
                }
            }
        };

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new window.Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: chartOptions,
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [tasks, columns, theme]);
    
    return (
        <div style={{ position: 'relative', height: '50vh', minHeight: '400px' }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

export default TaskStatusChart;
