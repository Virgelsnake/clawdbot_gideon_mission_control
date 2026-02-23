'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, isToday, startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek as endOfWeekFn } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, List, Plus, Bell, X, Clock, CheckCircle2, Lightbulb, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-GB': enGB };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Priority = 'urgent' | 'high' | 'medium' | 'low';
type ItemType = 'task' | 'idea' | 'reminder';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  item_type: ItemType;
  priority: Priority;
  status?: string;
  description?: string;
  has_reminder?: boolean;
  source_ref?: string;
}

interface DayItem {
  id: string;
  title: string;
  item_type: ItemType;
  priority: Priority;
  status?: string;
  description?: string;
  due_time?: string;
  has_reminder?: boolean;
}

const priorityColors: Record<Priority, string> = {
  urgent: '#dc2626', // red-600
  high: '#ea580c',   // orange-600
  medium: '#156082', // brand teal
  low: '#16a34a',    // green-600
};

const priorityBgColors: Record<Priority, string> = {
  urgent: 'bg-red-50 border-red-200 text-red-900',
  high: 'bg-orange-50 border-orange-200 text-orange-900',
  medium: 'bg-[#156082]/10 border-[#156082]/20 text-[#156082]',
  low: 'bg-green-50 border-green-200 text-green-900',
};

export function EnhancedCalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayItems, setDayItems] = useState<DayItem[]>([]);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);

  // Fetch events for the visible date range
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      // Query tasks directly (workaround for missing get_calendar_events function)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, column_status, labels, assignee, created_at, updated_at')
        .gte('due_date', format(start, 'yyyy-MM-dd'))
        .lte('due_date', format(end, 'yyyy-MM-dd'))
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Format tasks as calendar events
      const formattedEvents: CalendarEvent[] = (tasksData || []).map((task: any) => {
        const eventDate = new Date(task.due_date);
        const start = new Date(eventDate);
        start.setHours(9, 0, 0, 0); // Default to 9 AM
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        return {
          id: task.id,
          title: task.title,
          start,
          end,
          item_type: 'task' as ItemType,
          priority: (task.priority || 'medium') as Priority,
          status: task.column_status,
          description: task.description,
          has_reminder: false,
          source_ref: `task:${task.id}`,
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
  }, [date]);

  // Fetch items for a specific day
  const fetchDayItems = useCallback(async (targetDate: Date) => {
    try {
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      // Query tasks directly for the selected day
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, column_status, labels, assignee')
        .eq('due_date', dateStr)
        .not('due_date', 'is', null)
        .order('priority', { ascending: false });

      if (tasksError) throw tasksError;

      const items: DayItem[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        item_type: 'task' as ItemType,
        priority: (task.priority || 'medium') as Priority,
        status: task.column_status,
        description: task.description,
        due_time: undefined,
        has_reminder: false,
      }));

      // Sort by time (nulls last) then priority
      items.sort((a, b) => {
        if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
        if (a.due_time) return -1;
        if (b.due_time) return 1;
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setDayItems(items);
    } catch (err) {
      console.error('Error fetching day items:', err);
      toast.error('Failed to load items for selected date');
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('calendar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, fetchEvents)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEvents]);

  // Refresh day items when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDayItems(selectedDate);
    }
  }, [selectedDate, fetchDayItems]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
    setSelectedDate(slotInfo.start);
    setDayPanelOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedDate(event.start);
    setDayPanelOpen(true);
  }, []);

  const closeDayPanel = useCallback(() => {
    setDayPanelOpen(false);
    setTimeout(() => setSelectedDate(null), 300);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: priorityColors[event.priority],
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      fontSize: '0.8rem',
      fontWeight: 500,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
  });

  const dayPropGetter = useCallback((date: Date) => {
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentDay = isToday(date);
    
    return {
      className: cn(
        'transition-colors cursor-pointer',
        isSelected && 'bg-primary/10 ring-2 ring-primary ring-inset',
        isCurrentDay && !isSelected && 'bg-accent/30'
      ),
    };
  }, [selectedDate]);

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="h-4 w-4" />;
      case 'idea': return <Lightbulb className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (item: DayItem) => {
    if (item.item_type === 'task') {
      const statusColors: Record<string, string> = {
        'done': 'bg-green-100 text-green-700',
        'review': 'bg-purple-100 text-purple-700',
        'in-progress': 'bg-blue-100 text-blue-700',
        'todo': 'bg-gray-100 text-gray-700',
        'backlog': 'bg-gray-100 text-gray-700',
      };
      return (
        <Badge variant="outline" className={cn('text-xs', statusColors[item.status || ''] || 'bg-gray-100')}>
          {item.status?.replace('-', ' ')}
        </Badge>
      );
    }
    if (item.item_type === 'idea') {
      return (
        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">
          Idea
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-700">
        Reminder
      </Badge>
    );
  };

  const CustomToolbar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {format(date, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const today = new Date();
            setDate(today);
            if (view === 'month') {
              // Keep month view centered on current month
            }
          }}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(date);
            if (view === 'month') {
              newDate.setMonth(date.getMonth() - 1);
            } else if (view === 'week') {
              newDate.setDate(date.getDate() - 7);
            } else {
              newDate.setDate(date.getDate() - 1);
            }
            setDate(newDate);
          }}>
            ←
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(date);
            if (view === 'month') {
              newDate.setMonth(date.getMonth() + 1);
            } else if (view === 'week') {
              newDate.setDate(date.getDate() + 7);
            } else {
              newDate.setDate(date.getDate() + 1);
            }
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
    <div className="h-full flex gap-4">
      {/* Main Calendar */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        dayPanelOpen && "lg:mr-80"
      )}>
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
                dayPropGetter={dayPropGetter}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                popup
                selectable
                className="h-full p-4"
                components={{
                  toolbar: () => null,
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

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.urgent }} />
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.high }} />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.medium }} />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.low }} />
            <span>Low</span>
          </div>
          <div className="h-4 w-px bg-border mx-2 hidden sm:block" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Click any day to see details →</span>
          </div>
        </div>
      </div>

      {/* Day Detail Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-background border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:shadow-none lg:border-l",
        dayPanelOpen ? "translate-x-0" : "translate-x-full lg:hidden lg:translate-x-0 lg:w-0 lg:overflow-hidden"
      )}>
        <Card className="h-full flex flex-col rounded-none border-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {selectedDate ? (
                    isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')
                  ) : 'Select a Date'}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <Badge variant="secondary">
                    {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeDayPanel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!selectedDate ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
                <p>Click on any day in the calendar</p>
                <p className="text-sm mt-1">to see scheduled items</p>
              </div>
            ) : dayItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                <p>No items scheduled</p>
                <p className="text-sm mt-1">for {format(selectedDate, 'MMMM d')}</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                        priorityBgColors[item.priority]
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-current opacity-70">
                          {getTypeIcon(item.item_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-snug">
                            {item.title}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {getStatusBadge(item)}
                            
                            <Badge 
                              variant="outline" 
                              className="text-xs capitalize"
                              style={{ 
                                borderColor: priorityColors[item.priority],
                                color: priorityColors[item.priority],
                                backgroundColor: `${priorityColors[item.priority]}15`
                              }}
                            >
                              {item.priority}
                            </Badge>
                            
                            {item.due_time && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(`2000-01-01T${item.due_time}`), 'h:mm a')}
                              </span>
                            )}
                            
                            {item.has_reminder && (
                              <Bell className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-xs mt-2 opacity-80 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          
          {selectedDate && (
            <>
              <Separator />
              <div className="p-4 flex-shrink-0">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => toast.info('Add reminder feature coming soon')}
                >
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Mobile overlay backdrop */}
      {dayPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeDayPanel}
        />
      )}
    </div>
  );
}
