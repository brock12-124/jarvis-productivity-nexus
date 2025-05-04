
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS, errorResponse, successResponse, getValidToken } from "../_shared/utils.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS
  const corsResponse = await handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }
    
    // Get JWT user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return errorResponse('Invalid token or user not found', 401);
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    
    // Parse request body if it exists
    let requestBody = {};
    if (req.method !== 'GET' && req.headers.get('content-type')?.includes('application/json')) {
      requestBody = await req.json();
    }
    
    // Get valid Google Calendar token
    const tokenData = await getValidToken(supabaseClient, user.id, 'google_calendar');
    if (!tokenData) {
      return errorResponse('Google Calendar not connected', 400);
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'calendars':
        return await getCalendars(user.id, tokenData.accessToken, supabaseClient);
        
      case 'events':
        return await getEvents(user.id, tokenData.accessToken, supabaseClient, url.searchParams);
        
      case 'create-event':
        return await createEvent(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'update-event':
        return await updateEvent(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'delete-event':
        return await deleteEvent(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'sync':
        return await syncCalendars(user.id, tokenData.accessToken, supabaseClient);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function getCalendars(userId: string, accessToken: string, supabaseClient: any) {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store calendar list in database
    for (const calendar of data.items) {
      await supabaseClient.from('calendar_metadata').upsert({
        user_id: userId,
        calendar_id: calendar.id,
        name: calendar.summary,
        description: calendar.description,
        color: calendar.backgroundColor,
        is_primary: calendar.primary || false,
        is_selected: true,
        metadata: calendar,
        updated_at: new Date()
      }, { onConflict: 'user_id,calendar_id' });
    }
    
    return successResponse(data.items);
  } catch (error) {
    console.error("Error fetching calendars:", error);
    return errorResponse(`Failed to fetch calendars: ${error.message}`);
  }
}

async function getEvents(userId: string, accessToken: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const calendarId = params.get('calendarId') || 'primary';
    const timeMin = params.get('timeMin') || new Date().toISOString();
    const timeMax = params.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const syncToken = params.get('syncToken') || '';
    
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    if (syncToken) {
      // If we have a sync token, use it instead of time bounds
      url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?syncToken=${syncToken}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store events in database for caching
    const events = data.items || [];
    for (const event of events) {
      if (event.status !== 'cancelled') {
        await supabaseClient.from('calendar_events').upsert({
          user_id: userId,
          external_event_id: event.id,
          title: event.summary || 'No Title',
          description: event.description || null,
          location: event.location || null,
          start_time: event.start?.dateTime || event.start?.date,
          end_time: event.end?.dateTime || event.end?.date,
          status: event.status || 'confirmed',
          updated_at: new Date()
        }, { onConflict: 'user_id,external_event_id' });
      } else {
        // Delete cancelled events
        await supabaseClient.from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('external_event_id', event.id);
      }
    }
    
    // Update sync token if present
    if (data.nextSyncToken) {
      await supabaseClient.from('user_integrations')
        .update({
          sync_token: data.nextSyncToken,
          last_synced_at: new Date(),
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }
    
    return successResponse({
      events: events,
      nextSyncToken: data.nextSyncToken,
      nextPageToken: data.nextPageToken
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return errorResponse(`Failed to fetch events: ${error.message}`);
  }
}

async function createEvent(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { calendarId = 'primary', event } = requestBody;
    
    if (!event) {
      return errorResponse('Event data is required');
    }
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the event in our database
    await supabaseClient.from('calendar_events').insert({
      user_id: userId,
      external_event_id: data.id,
      title: data.summary || 'No Title',
      description: data.description || null,
      location: data.location || null,
      start_time: data.start?.dateTime || data.start?.date,
      end_time: data.end?.dateTime || data.end?.date,
      status: data.status || 'confirmed'
    });
    
    return successResponse(data);
  } catch (error) {
    console.error("Error creating event:", error);
    return errorResponse(`Failed to create event: ${error.message}`);
  }
}

async function updateEvent(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { calendarId = 'primary', eventId, event } = requestBody;
    
    if (!eventId || !event) {
      return errorResponse('Event ID and event data are required');
    }
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update the event in our database
    await supabaseClient.from('calendar_events').update({
      title: data.summary || 'No Title',
      description: data.description || null,
      location: data.location || null,
      start_time: data.start?.dateTime || data.start?.date,
      end_time: data.end?.dateTime || data.end?.date,
      status: data.status || 'confirmed',
      updated_at: new Date()
    })
    .eq('user_id', userId)
    .eq('external_event_id', data.id);
    
    return successResponse(data);
  } catch (error) {
    console.error("Error updating event:", error);
    return errorResponse(`Failed to update event: ${error.message}`);
  }
}

async function deleteEvent(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { calendarId = 'primary', eventId } = requestBody;
    
    if (!eventId) {
      return errorResponse('Event ID is required');
    }
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    // Delete the event from our database
    await supabaseClient.from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .eq('external_event_id', eventId);
    
    return successResponse({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return errorResponse(`Failed to delete event: ${error.message}`);
  }
}

async function syncCalendars(userId: string, accessToken: string, supabaseClient: any) {
  try {
    // Get user's sync token
    const { data: integration } = await supabaseClient
      .from('user_integrations')
      .select('sync_token, last_synced_at')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .single();
    
    let syncToken = integration?.sync_token;
    
    // Get all calendars
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!calendarsResponse.ok) {
      throw new Error(`Google API error: ${calendarsResponse.status}`);
    }
    
    const calendarsData = await calendarsResponse.json();
    
    // Process each calendar
    for (const calendar of calendarsData.items) {
      let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?maxResults=100&singleEvents=true`;
      
      if (syncToken) {
        url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?syncToken=${syncToken}`;
      } else {
        // If no sync token, use time-based sync
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 30); // Sync last 30 days
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 90); // Sync next 90 days
        
        url += `&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`;
      }
      
      const eventsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!eventsResponse.ok) {
        if (eventsResponse.status === 410) {
          // Sync token expired, need full sync
          console.log("Sync token expired, performing full sync");
          syncToken = null;
          continue;
        }
        throw new Error(`Google API error: ${eventsResponse.status}`);
      }
      
      const eventsData = await eventsResponse.json();
      
      // Store events
      const events = eventsData.items || [];
      for (const event of events) {
        if (event.status !== 'cancelled') {
          await supabaseClient.from('calendar_events').upsert({
            user_id: userId,
            external_event_id: event.id,
            title: event.summary || 'No Title',
            description: event.description || null,
            location: event.location || null,
            start_time: event.start?.dateTime || event.start?.date,
            end_time: event.end?.dateTime || event.end?.date,
            status: event.status || 'confirmed',
            updated_at: new Date()
          }, { onConflict: 'user_id,external_event_id' });
        } else {
          // Delete cancelled events
          await supabaseClient.from('calendar_events')
            .delete()
            .eq('user_id', userId)
            .eq('external_event_id', event.id);
        }
      }
      
      // Update sync token
      if (eventsData.nextSyncToken) {
        syncToken = eventsData.nextSyncToken;
      }
    }
    
    // Update the sync token in the database
    if (syncToken) {
      await supabaseClient.from('user_integrations')
        .update({
          sync_token: syncToken,
          last_synced_at: new Date(),
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }
    
    return successResponse({ success: true });
  } catch (error) {
    console.error("Error syncing calendars:", error);
    return errorResponse(`Failed to sync calendars: ${error.message}`);
  }
}
