'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List, Plus, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-GB': enGB };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  item_type: 'task' | 'idea' | 'custom';
  priority?: string;
  status?: string;
  description?: string;
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch reminders with task/idea details
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          id,
          item_type,
          item_id,
          title,
          description,
          due_date,
          due_time,
          tasks:item_id (priority, column_status, labels),
          ideas:item_id (priority, labels)
        `)
        .gte('due_date', format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'))
        .lte('due_date', format(new Date(new Date().getFullYear() + 1, 11, 31), 'yyyy-MM-dd'));

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (reminders || []).map((r: any) => {
        const dueDate = new Date(r.due_date);
        const dueTime = r.due_time ? r.due_time.split(':') : [9, 0];
        const start = new Date(dueDate);
        start.setHours(parseInt(dueTime[0]), parseInt(dueTime[1]));
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        const priority = r.item_type === 'task' 
          ? r.tasks?.priority 
          : r.item_type === 'idea' 
            ? r.ideas?.priority 
            : 'medium';

        return {
          id: r.id,
          title: r.title,
          start,
          end,
          item_type: r.item_type,
          priority: priority || 'medium',
          status: r.item_type === 'task' ? r.tasks?.column_status : 'idea',
          description: r.description,
        };
      });

      setEvents(formattedEvents);

      // Count upcoming items (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = formattedEvents.filter(e => e.start >= today && e.start <= nextWeek);
      setUpcomingCount(upcoming.length);

    } catch (err) {
      console.error('Error fetching calendar events:', err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('reminders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, fetchEvents)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEvents]);

  const getEventColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#156082'; // brand teal
      case 'low': return '#16a34a'; // green-600
      default: return '#156082';
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: getEventColor(event.priority),
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      fontSize: '0.85rem',
      fontWeight: 500,
    },
  });

  const CustomToolbar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {format(date, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() - 1);
            setDate(newDate);
          }}>
            ←
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() + 1);
            setDate(newDate);
          }}>
            →
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {upcomingCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Bell className="h-3 w-3" />
            {upcomingCount} upcoming
          </Badge>
        )}
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="agenda">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <CustomToolbar />
      
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              popup
              selectable
              className="h-full p-4"
              components={{
                toolbar: () => null, // Hide default toolbar, using custom
              }}
              messages={{
                today: 'Today',
                previous: 'Back',
                next: 'Next',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                agenda: 'Agenda',
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600" />
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-600" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#156082' }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}
