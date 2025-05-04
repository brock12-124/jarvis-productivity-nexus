
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
  calendarId?: string; // Google Calendar ID
  googleEventId?: string; // Google Calendar Event ID
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [primaryCalendarId, setPrimaryCalendarId] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchGoogleCalendarEvents = async () => {
    if (!user || !session?.access_token) return [];

    try {
      // First check if the user has Google Calendar integrated
      const { data: integrationData } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single();

      if (!integrationData) {
        setHasGoogleCalendar(false);
        return [];
      }

      setHasGoogleCalendar(true);

      // If this is the first time, get the primary calendar
      if (!primaryCalendarId) {
        const calendarsResponse = await supabase.functions.invoke('google-calendar', {
          body: { action: 'listCalendars' },
        });

        if (calendarsResponse.error) {
          console.error('Error fetching calendars:', calendarsResponse.error);
          throw new Error(calendarsResponse.error);
        }

        const primaryCalendar = calendarsResponse.data.items?.find((calendar: any) => calendar.primary) || calendarsResponse.data.items?.[0];
        if (primaryCalendar) {
          setPrimaryCalendarId(primaryCalendar.id);
        } else {
          return [];
        }
      }

      const calendarId = primaryCalendarId;
      if (!calendarId) return [];

      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 1);
      
      const eventsResponse = await supabase.functions.invoke('google-calendar', {
        body: { 
          action: 'listEvents',
          data: {
            calendarId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
          }
        },
      });

      if (eventsResponse.error) {
        console.error('Error fetching events:', eventsResponse.error);
        throw new Error(eventsResponse.error);
      }

      const googleEvents = eventsResponse.data.items || [];
      
      // Transform Google events to our format
      const formattedEvents: CalendarEvent[] = googleEvents.map((event: GoogleCalendarEvent) => ({
        id: `google_${event.id}`,
        googleEventId: event.id,
        calendarId,
        title: event.summary,
        description: event.description,
        location: event.location,
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        type: determineEventType(event.summary),
      }));

      return formattedEvents;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast({
        title: 'Google Calendar Error',
        description: 'Failed to fetch events from Google Calendar',
        variant: 'destructive',
      });
      return [];
    }
  };

  const fetchLocalEvents = async () => {
    if (!user) return [];

    try {
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

        return formattedEvents;
      }
      return [];
    } catch (error) {
      console.error('Error fetching local events:', error);
      return [];
    }
  };

  const fetchEvents = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch events from both sources
      const [googleEvents, localEvents] = await Promise.all([
        fetchGoogleCalendarEvents(),
        fetchLocalEvents()
      ]);
      
      // Combine events from both sources
      const allEvents = [...googleEvents, ...localEvents];
      
      setEvents(allEvents);
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
      // If Google Calendar is connected, add the event there
      if (hasGoogleCalendar && primaryCalendarId) {
        const googleEvent = {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const createResponse = await supabase.functions.invoke('google-calendar', {
          body: { 
            action: 'createEvent', 
            data: {
              calendarId: primaryCalendarId,
              event: googleEvent
            }
          },
        });

        if (createResponse.error) {
          console.error('Error creating Google Calendar event:', createResponse.error);
          throw new Error(createResponse.error);
        }
        
        const newEvent: CalendarEvent = {
          id: `google_${createResponse.data.id}`,
          googleEventId: createResponse.data.id,
          calendarId: primaryCalendarId,
          title: event.title,
          start: event.start,
          end: event.end,
          description: event.description,
          location: event.location,
          type: event.type,
        };

        setEvents(prev => [...prev, newEvent]);
        
        // Also save to Supabase for backup/sync
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          title: event.title,
          description: event.description || null,
          start_time: event.start.toISOString(),
          end_time: event.end.toISOString(),
          location: event.location || null,
          external_event_id: createResponse.data.id,
        });
        
        return newEvent;
      } else {
        // If no Google Calendar, just save to Supabase
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
    if (!user) return false;

    try {
      const eventToUpdate = events.find(e => e.id === eventId);
      if (!eventToUpdate) return false;

      // Handle Google Calendar events
      if (eventId.startsWith('google_') && eventToUpdate.googleEventId && eventToUpdate.calendarId && hasGoogleCalendar) {
        const googleEvent: any = {};
        
        if (updatedData.title) googleEvent.summary = updatedData.title;
        if (updatedData.description !== undefined) googleEvent.description = updatedData.description;
        if (updatedData.location !== undefined) googleEvent.location = updatedData.location;
        
        if (updatedData.start) {
          googleEvent.start = {
            dateTime: updatedData.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        }
        
        if (updatedData.end) {
          googleEvent.end = {
            dateTime: updatedData.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        }

        const updateResponse = await supabase.functions.invoke('google-calendar', {
          body: { 
            action: 'updateEvent',
            data: {
              calendarId: eventToUpdate.calendarId,
              eventId: eventToUpdate.googleEventId,
              event: googleEvent
            }
          },
        });

        if (updateResponse.error) {
          throw new Error(updateResponse.error);
        }
        
        // Update local state
        setEvents(prevEvents =>
          prevEvents.map(event => 
            event.id === eventId ? { ...event, ...updatedData } : event
          )
        );
        
        // Also update in Supabase for backup
        await supabase
          .from('calendar_events')
          .update({
            title: updatedData.title,
            description: updatedData.description,
            start_time: updatedData.start?.toISOString(),
            end_time: updatedData.end?.toISOString(),
            location: updatedData.location,
          })
          .eq('external_event_id', eventToUpdate.googleEventId);
        
        return true;
      } else {
        // Handle local events
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
      }
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
    if (!user) return false;

    try {
      const eventToDelete = events.find(e => e.id === eventId);
      if (!eventToDelete) return false;

      // Handle Google Calendar events
      if (eventId.startsWith('google_') && eventToDelete.googleEventId && eventToDelete.calendarId && hasGoogleCalendar) {
        const deleteResponse = await supabase.functions.invoke('google-calendar', {
          body: { 
            action: 'deleteEvent',
            data: {
              calendarId: eventToDelete.calendarId,
              eventId: eventToDelete.googleEventId
            }
          },
        });

        if (deleteResponse.error) {
          throw new Error(deleteResponse.error);
        }
        
        // Also delete from Supabase for consistency
        await supabase
          .from('calendar_events')
          .delete()
          .eq('external_event_id', eventToDelete.googleEventId);
      } else {
        // Handle local events
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

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
  }, [user, primaryCalendarId]);

  return {
    events,
    isLoading,
    hasGoogleCalendar,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
};
