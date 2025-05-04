
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string | Date;
  endTime: string | Date;
  status?: string;
  calendarId?: string;
  externalEventId?: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isPrimary?: boolean;
  isSelected?: boolean;
}

export const CalendarService = {
  /**
   * Get user's calendars
   */
  async getCalendars(): Promise<Calendar[]> {
    try {
      // First check our database for cached calendars
      const { data: localCalendars, error: localError } = await supabase
        .from('calendar_metadata')
        .select('*');
      
      if (localCalendars && localCalendars.length > 0) {
        return localCalendars.map(calendar => ({
          id: calendar.calendar_id,
          name: calendar.name,
          description: calendar.description,
          color: calendar.color,
          isPrimary: calendar.is_primary,
          isSelected: calendar.is_selected
        }));
      }
      
      // If no cached calendars, fetch from Google
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/google-calendar/calendars`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch calendars');
      }
      
      const data = await response.json();
      
      return (data || []).map((cal: any) => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        color: cal.backgroundColor,
        isPrimary: cal.primary || false,
        isSelected: true
      }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  },
  
  /**
   * Get events for a specific time range
   */
  async getEvents(
    startDate: Date, 
    endDate: Date, 
    calendarId?: string
  ): Promise<CalendarEvent[]> {
    try {
      // First check our database for cached events
      const { data: localEvents, error: localError } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());
      
      if (localEvents && localEvents.length > 0) {
        return localEvents.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
          status: event.status,
          externalEventId: event.external_event_id
        }));
      }
      
      // If no cached events, fetch from Google
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString()
      });
      
      if (calendarId) {
        params.append('calendarId', calendarId);
      }
      
      const endpoint = `${supabase.functions.url}/google-calendar/events?${params.toString()}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }
      
      const data = await response.json();
      
      return (data.events || []).map((event: any) => ({
        id: event.id,
        title: event.summary || 'No Title',
        description: event.description,
        location: event.location,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        status: event.status,
        calendarId: event.calendarId || calendarId || 'primary'
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },
  
  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: new Date(event.startTime).toISOString(),
        },
        end: {
          dateTime: new Date(event.endTime).toISOString(),
        }
      };
      
      const endpoint = `${supabase.functions.url}/google-calendar/create-event`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          calendarId: event.calendarId || 'primary',
          event: googleEvent
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        title: data.summary || 'No Title',
        description: data.description,
        location: data.location,
        startTime: data.start?.dateTime || data.start?.date,
        endTime: data.end?.dateTime || data.end?.date,
        status: data.status,
        calendarId: event.calendarId || 'primary',
        externalEventId: data.id
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  },
  
  /**
   * Update an existing calendar event
   */
  async updateEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    try {
      if (!event.externalEventId) {
        throw new Error('External event ID is required');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: new Date(event.startTime).toISOString(),
        },
        end: {
          dateTime: new Date(event.endTime).toISOString(),
        }
      };
      
      const endpoint = `${supabase.functions.url}/google-calendar/update-event`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          calendarId: event.calendarId || 'primary',
          eventId: event.externalEventId,
          event: googleEvent
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
      
      const data = await response.json();
      
      return {
        id: event.id,
        title: data.summary || 'No Title',
        description: data.description,
        location: data.location,
        startTime: data.start?.dateTime || data.start?.date,
        endTime: data.end?.dateTime || data.end?.date,
        status: data.status,
        calendarId: event.calendarId || 'primary',
        externalEventId: data.id
      };
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  },
  
  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string, calendarId?: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/google-calendar/delete-event`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          calendarId: calendarId || 'primary',
          eventId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  },
  
  /**
   * Sync calendar events
   */
  async syncEvents(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/google-calendar/sync`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync events');
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing events:', error);
      return false;
    }
  }
};
