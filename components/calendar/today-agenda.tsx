'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AgendaItem {
  id: string;
  title: string;
  due_date: string;
  due_time?: string;
  item_type: 'task' | 'idea' | 'custom';
  priority?: string;
  is_overdue: boolean;
}

export function TodayAgenda() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetchTodayItems();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('today_agenda')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, fetchTodayItems)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTodayItems = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's and overdue items
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          id,
          title,
          due_date,
          due_time,
          item_type,
          tasks:item_id (priority, column_status),
          ideas:item_id (priority)
        `)
        .or(`due_date.eq.${today},due_date.lt.${today}`)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });

      if (error) throw error;

      const formattedItems: AgendaItem[] = (data || []).map((item: any) => {
        const dueDate = parseISO(item.due_date);
        const priority = item.item_type === 'task' 
          ? item.tasks?.priority 
          : item.item_type === 'idea' 
            ? item.ideas?.priority 
            : 'medium';

        return {
          id: item.id,
          title: item.title,
          due_date: item.due_date,
          due_time: item.due_time,
          item_type: item.item_type,
          priority: priority || 'medium',
          is_overdue: isPast(dueDate) && !isToday(dueDate),
        };
      });

      setItems(formattedItems);
      setOverdueCount(formattedItems.filter(i => i.is_overdue).length);

    } catch (err) {
      console.error('Error fetching agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="h-4 w-4" />;
      case 'idea': return <Bell className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Today's Agenda</CardTitle>
          </div>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {overdueCount} overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nothing due today!</p>
            <p className="text-sm mt-1">You're all caught up.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.is_overdue 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${item.is_overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {getTypeIcon(item.item_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${item.is_overdue ? 'text-red-900' : ''}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.is_overdue ? (
                            <span className="text-red-600 font-medium">
                              Overdue ({format(parseISO(item.due_date), 'MMM d')})
                            </span>
                          ) : item.due_time ? (
                            format(new Date(`2000-01-01T${item.due_time}`), 'h:mm a')
                          ) : (
                            'Today'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-sm"
          onClick={() => window.location.href = '/calendar'}
        >
          View full calendar →
        </Button>
      </CardContent>
    </Card>
  );
}
