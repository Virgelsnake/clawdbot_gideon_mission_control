'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarProject } from '@/types/calendar';

interface CalendarMonthNavigatorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  groupedProjects: Map<string, CalendarProject[]>;
}

export function CalendarMonthNavigator({
  selectedDate,
  onSelectDate,
  groupedProjects,
}: CalendarMonthNavigatorProps) {
  const monthData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: { date: number; dateStr: string; hasProjects: boolean; isSelected: boolean; isToday: boolean }[] = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, dateStr: '', hasProjects: false, isSelected: false, isToday: false });
    }
    
    // Days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const hasProjects = groupedProjects.has(dateStr);
      
      days.push({ date: day, dateStr, hasProjects, isSelected, isToday });
    }
    
    return { year, month, days, monthName: firstDay.toLocaleString('default', { month: 'long' }) };
  }, [selectedDate, groupedProjects]);

  const goToPreviousMonth = () => {
    onSelectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onSelectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    onSelectDate(new Date());
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-semibold">{monthData.monthName}</div>
          <div className="text-sm text-muted-foreground">{monthData.year}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Today button */}
      <Button variant="outline" size="sm" className="w-full mb-4" onClick={goToToday}>
        Today
      </Button>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthData.days.map((day, index) => (
          <button
            key={index}
            onClick={() => day.date > 0 && onSelectDate(new Date(monthData.year, monthData.month, day.date))}
            disabled={day.date === 0}
            className={`
              aspect-square flex items-center justify-center rounded-md text-sm relative
              ${day.date === 0 ? 'invisible' : ''}
              ${day.isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
              ${day.isToday && !day.isSelected ? 'border border-primary' : ''}
            `}
          >
            {day.date > 0 && (
              <>
                <span>{day.date}</span>
                {day.hasProjects && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Projects due</span>
        </div>
      </div>
    </Card>
  );
}
