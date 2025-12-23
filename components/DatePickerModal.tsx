import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    initialDate?: Date;
    title?: string;
}

export function DatePickerModal({ isOpen, onClose, onSelect, initialDate, title = "Select Date" }: DatePickerModalProps) {
    if (!isOpen) return null;

    const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Adjust for Monday start if desired, but let's stick to simple Sunday=0 or Monday=1. 
    // Let's use Monday start to match typical business apps, or standard Sunday. 
    // CalendarView used Monday start logic: const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        const selectedDate = new Date(year, month, day);
        onSelect(selectedDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-6 w-[350px] max-w-full m-4 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-white mb-6 text-center">{title}</h3>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-white">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-500 py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                        if (!day) return <div key={idx}></div>;

                        const date = new Date(year, month, day);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = initialDate && initialDate.toDateString() === date.toDateString();

                        return (
                            <button
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    h-10 w-10 text-sm font-bold rounded-lg transition-all flex items-center justify-center
                                    ${isSelected ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : ''}
                                    ${!isSelected && isToday ? 'border border-orange-500/50 text-orange-400' : ''}
                                    ${!isSelected && !isToday ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : ''}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
