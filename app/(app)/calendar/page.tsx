'use client';

import { EnhancedCalendarView } from '@/components/calendar/enhanced-calendar-view';
import './calendar-styles.css';

export default function CalendarPage() {
  return (
    <div className="h-full p-6">
      <EnhancedCalendarView />
    </div>
  );
}
