import React, { useState, useRef, useEffect } from 'react';
import { type Label } from '../types';
import { LABEL_COLOR_PALETTE } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronUpDownIcon } from './icons/ChevronUpDownIcon';

interface MultiSelectDropdownProps {
  availableLabels: Label[];
  selectedLabels: string[];
  onLabelChange: (selected: string[]) => void;
  onAddLabel?: (id: string, color: string) => Promise<boolean>;
  creatable?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ availableLabels, selectedLabels, onLabelChange, onAddLabel, creatable = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_PALETTE[0].class);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingLabel(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLabelToggle = (labelId: string) => {
    const newSelected = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    onLabelChange(newSelected);
  };
  
  const handleCreateNewLabel = async () => {
    if (!onAddLabel) return;
    if (!newLabelName.trim()) {
      alert("نام لیبل نمی‌تواند خالی باشد.");
      return;
    }
    const success = await onAddLabel(newLabelName.trim(), newLabelColor);
    if(success) {
      onLabelChange([...selectedLabels, newLabelName.trim()]);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_PALETTE[0].class);
      setIsCreatingLabel(false);
      setSearchTerm('');
    }
  };

  const filteredLabels = availableLabels.filter(label =>
    label.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSelectedLabels = () => {
    if (selectedLabels.length === 0) {
      return <span className="text-slate-500 dark:text-slate-400">انتخاب لیبل...</span>;
    }
    const labelObjects = selectedLabels.map(id => availableLabels.find(l => l.id === id)).filter(Boolean) as Label[];
    
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {labelObjects.slice(0, 3).map(label => (
          <span key={label.id} className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${label.color}`}>
            {label.id}
          </span>
        ))}
        {labelObjects.length > 3 && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
            +{labelObjects.length - 3}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all flex justify-between items-center"
      >
        <div className="flex-grow">{renderSelectedLabels()}</div>
        <ChevronUpDownIcon />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="جستجوی لیبل..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto p-2">
            {filteredLabels.map(label => (
              <li key={label.id} className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <label className="flex items-center gap-3 p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label.id)}
                    onChange={() => handleLabelToggle(label.id)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${label.color}`}>
                    {label.id}
                  </span>
                </label>
              </li>
            ))}
             {filteredLabels.length === 0 && searchTerm && (
                <li className="p-2 text-center text-sm text-slate-500">لیبلی یافت نشد.</li>
            )}
          </ul>
          {creatable && onAddLabel && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
             {isCreatingLabel ? (
                 <div className="p-2 bg-slate-100 dark:bg-slate-900/70 rounded-md flex flex-col gap-3">
                    <input type="text" placeholder="نام لیبل جدید..." value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm" />
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {LABEL_COLOR_PALETTE.map(color => (
                        <button type="button" key={color.class} onClick={() => setNewLabelColor(color.class)}
                        className={`w-5 h-5 rounded-full transition-transform transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newLabelColor === color.class ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-sky-500' : 'border-transparent'}`}
                        aria-label={color.name}
                        ></button>
                    ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsCreatingLabel(false)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-xs border border-slate-300 dark:border-slate-600">لغو</button>
                        <button type="button" onClick={handleCreateNewLabel} className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs">افزودن</button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setIsCreatingLabel(true)} className="w-full flex items-center justify-center gap-2 p-2 text-sm rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
                  <PlusIcon />
                  <span>ساخت لیبل جدید</span>
                </button>
            )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;