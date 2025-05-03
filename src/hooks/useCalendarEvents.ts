
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'focus';
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const formattedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description || undefined,
          location: event.location || undefined,
          type: determineEventType(event.title),
        }));

        setEvents(formattedEvents);
      }
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineEventType = (title: string): CalendarEvent['type'] => {
    title = title.toLowerCase();
    if (title.includes('meeting') || title.includes('call')) return 'meeting';
    if (title.includes('deadline')) return 'deadline';
    if (title.includes('focus')) return 'focus';
    return 'reminder';
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        title: event.title,
        description: event.description || null,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString(),
        location: event.location || null,
      }).select();

      if (error) throw error;

      if (data && data[0]) {
        const newEvent: CalendarEvent = {
          id: data[0].id,
          title: event.title,
          start: event.start,
          end: event.end,
          description: event.description,
          location: event.location,
          type: event.type,
        };

        setEvents(prev => [...prev, newEvent]);
        
        return newEvent;
      }
    } catch (error: any) {
      console.error('Error adding calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to add event',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateEvent = async (eventId: string, updatedData: Partial<CalendarEvent>) => {
    if (!user) return;

    try {
      // Convert dates to ISO strings for database
      const dbData: any = { ...updatedData };
      if (updatedData.start) dbData.start_time = updatedData.start.toISOString();
      if (updatedData.end) dbData.end_time = updatedData.end.toISOString();
      
      // Remove properties not in the DB schema
      delete dbData.start;
      delete dbData.end;
      delete dbData.type;

      const { error } = await supabase
        .from('calendar_events')
        .update(dbData)
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prevEvents =>
        prevEvents.map(event => 
          event.id === eventId ? { ...event, ...updatedData } : event
        )
      );
      
      return true;
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      return true;
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();

      // Set up real-time subscription
      const channel = supabase
        .channel('calendar-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calendar_events',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Real-time update:', payload);
            fetchEvents(); // Refresh events on any changes
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
};
