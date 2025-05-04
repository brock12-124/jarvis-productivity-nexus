
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client for the function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify and get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, data } = await req.json();
    
    // Get the user's Google Calendar integration tokens
    const { data: integrationData, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .single();

    if (integrationError || !integrationData) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and needs to be refreshed
    const tokenExpiresAt = new Date(integrationData.token_expires_at);
    const isTokenExpired = tokenExpiresAt <= new Date();
    let accessToken = integrationData.access_token;

    if (isTokenExpired && integrationData.refresh_token) {
      console.log("Token expired, refreshing...");
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
          refresh_token: integrationData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await response.json();
      
      if (!response.ok) {
        console.error("Token refresh failed:", refreshData);
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update token in database
      accessToken = refreshData.access_token;
      const expiresIn = refreshData.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);
      
      await supabase
        .from('user_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', integrationData.id);
    }

    // Execute the requested action
    let result;
    switch (action) {
      case 'listCalendars':
        result = await listCalendars(accessToken);
        break;
      case 'listEvents':
        result = await listEvents(accessToken, data.calendarId, data.timeMin, data.timeMax);
        break;
      case 'createEvent':
        result = await createEvent(accessToken, data.calendarId, data.event);
        break;
      case 'updateEvent':
        result = await updateEvent(accessToken, data.calendarId, data.eventId, data.event);
        break;
      case 'deleteEvent':
        result = await deleteEvent(accessToken, data.calendarId, data.eventId);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Google Calendar API functions
async function listCalendars(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to list calendars');
  }
  
  return data;
}

async function listEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to list events');
  }
  
  return data;
}

async function createEvent(accessToken: string, calendarId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to create event');
  }
  
  return data;
}

async function updateEvent(accessToken: string, calendarId: string, eventId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to update event');
  }
  
  return data;
}

async function deleteEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to delete event');
  }
  
  return { success: true };
}
