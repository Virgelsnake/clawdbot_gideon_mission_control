import { Metadata } from 'next';
import { CalendarShell } from '@/components/calendar/calendar-shell';

export const metadata: Metadata = {
  title: 'Calendar | Mission Control',
  description: 'Project calendar with threshold monitoring and auto-reprioritisation',
};

export default function CalendarPage() {
  return (
    <main className="container mx-auto py-6">
      <CalendarShell />
    </main>
  );
}
