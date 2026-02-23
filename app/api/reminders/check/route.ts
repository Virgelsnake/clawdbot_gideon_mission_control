import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get upcoming reminders (next 7 days)
    const { data: upcoming, error: upcomingError } = await supabase
      .rpc('get_upcoming_reminders');

    if (upcomingError) throw upcomingError;

    // Get overdue reminders
    const { data: overdue, error: overdueError } = await supabase
      .from('reminders')
      .select('id, title, due_date')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .eq('reminder_sent', false)
      .order('due_date', { ascending: false });

    if (overdueError) throw overdueError;

    // Get today's reminders
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReminders, error: todayError } = await supabase
      .from('reminders')
      .select('id, title, due_date, due_time, item_type')
      .eq('due_date', today)
      .eq('reminder_sent', false);

    if (todayError) throw todayError;

    return NextResponse.json({
      upcoming: upcoming || [],
      overdue: overdue || [],
      today: todayReminders || [],
      total_due_soon: (upcoming?.length || 0) + (overdue?.length || 0),
    });

  } catch (error) {
    console.error('Error checking reminders:', error);
    return NextResponse.json(
      { error: 'Failed to check reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reminder_id } = await request.json();

    if (!reminder_id) {
      return NextResponse.json(
        { error: 'reminder_id required' },
        { status: 400 }
      );
    }

    // Mark reminder as sent
    await supabase.rpc('mark_reminder_sent', { reminder_uuid: reminder_id });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking reminder sent:', error);
    return NextResponse.json(
      { error: 'Failed to mark reminder sent' },
      { status: 500 }
    );
  }
}
