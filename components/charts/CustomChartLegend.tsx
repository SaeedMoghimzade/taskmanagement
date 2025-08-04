
import React from 'react';

interface LegendItem {
  text: string;
  color: string;
  isHidden: boolean;
}

interface CustomChartLegendProps {
  items: LegendItem[];
  onItemClick: (text: string) => void;
  title?: string;
  maxHeight?: string;
}

const CustomChartLegend: React.FC<CustomChartLegendProps> = ({ items, onItemClick, title, maxHeight = '400px' }) => {
  return (
    <div className="flex flex-col">
      {title && <h4 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400">{title}</h4>}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 overflow-y-auto" style={{ maxHeight }}>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.text}>
              <button
                onClick={() => onItemClick(item.text)}
                className={`w-full flex items-center gap-3 p-1.5 rounded-md text-sm text-right transition-colors ${
                  item.isHidden
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                aria-pressed={!item.isHidden}
              >
                <span
                  className="h-4 w-4 rounded-sm flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: item.isHidden ? '#94a3b8' : item.color }}
                ></span>
                <span className={`truncate ${item.isHidden ? 'line-through' : ''}`}>{item.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CustomChartLegend;
