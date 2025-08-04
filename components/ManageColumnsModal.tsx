
import React, { useState, useRef } from 'react';
import { type Column } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { GrabHandleIcon } from './icons/GrabHandleIcon';

interface ManageColumnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: Column[];
    onAddColumn: (title: string) => Promise<void>;
    onUpdateColumn: (id: string, newTitle: string) => Promise<void>;
    onDeleteColumn: (id: string) => void;
    onReorderColumns: (columns: Column[]) => Promise<void>;
}

const ManageColumnsModal: React.FC<ManageColumnsModalProps> = ({ isOpen, onClose, columns, onAddColumn, onUpdateColumn, onDeleteColumn, onReorderColumns }) => {
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [editedColumns, setEditedColumns] = useState<Column[]>(columns);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    if (!isOpen) return null;

    const handleTitleChange = (id: string, title: string) => {
        const newEditedColumns = editedColumns.map(c => c.id === id ? { ...c, title } : c);
        setEditedColumns(newEditedColumns);
    };

    const handleTitleBlur = (id: string, title: string) => {
        const originalColumn = columns.find(c => c.id === id);
        if (originalColumn && originalColumn.title !== title) {
            onUpdateColumn(id, title);
        }
    };
    
    const handleAddColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newColumnTitle.trim()) {
            await onAddColumn(newColumnTitle.trim());
            setNewColumnTitle('');
        }
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const columnsCopy = [...editedColumns];
        const draggedItemContent = columnsCopy.splice(dragItem.current, 1)[0];
        columnsCopy.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setEditedColumns(columnsCopy);
        onReorderColumns(columnsCopy);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">مدیریت ستون‌ها</h2>

                <div className="flex flex-col gap-3 mb-6">
                    {editedColumns.map((col, index) => (
                        <div 
                            key={col.id}
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
                        >
                            <button className="cursor-grab p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" aria-label="جابجایی ستون">
                                <GrabHandleIcon />
                            </button>
                            <input
                                type="text"
                                value={col.title}
                                onChange={(e) => handleTitleChange(col.id, e.target.value)}
                                onBlur={(e) => handleTitleBlur(col.id, e.target.value)}
                                className="flex-grow bg-transparent focus:bg-white dark:focus:bg-slate-700 border-none focus:ring-2 focus:ring-sky-500 rounded-md px-2 py-1 transition-colors"
                                aria-label={`عنوان ستون ${col.title}`}
                            />
                            <button
                                onClick={() => onDeleteColumn(col.id)}
                                className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                aria-label={`حذف ستون ${col.title}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddColumn} className="flex gap-4 items-center pt-6 border-t border-slate-200 dark:border-slate-700">
                    <input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="عنوان ستون جدید"
                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors transform hover:scale-105 active:scale-100 whitespace-nowrap">
                        <PlusIcon />
                        <span>افزودن</span>
                    </button>
                </form>
                
                <div className="flex justify-end mt-8">
                     <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">بستن</button>
                </div>
            </div>
        </div>
    );
};

export default ManageColumnsModal;
