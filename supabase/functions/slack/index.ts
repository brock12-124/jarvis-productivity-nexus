
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
    
    // Get valid Slack token
    const tokenData = await getValidToken(supabaseClient, user.id, 'slack');
    if (!tokenData) {
      return errorResponse('Slack not connected', 400);
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'channels':
        return await getChannels(user.id, tokenData.accessToken, supabaseClient);
        
      case 'send-message':
        return await sendMessage(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'create-reminder':
        return await createReminder(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function getChannels(userId: string, accessToken: string, supabaseClient: any) {
  try {
    const response = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
    // Get the workspace info
    const workspaceResponse = await fetch('https://slack.com/api/team.info', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    });
    
    const workspaceData = await workspaceResponse.json();
    const workspaceId = workspaceData.ok ? workspaceData.team.id : 'unknown';
    
    // Store channels in database
    for (const channel of data.channels) {
      if (!channel.is_archived) {
        await supabaseClient.from('slack_channels').upsert({
          user_id: userId,
          workspace_id: workspaceId,
          channel_id: channel.id,
          channel_name: channel.name,
          is_private: channel.is_private || false,
          updated_at: new Date()
        }, { onConflict: 'user_id,workspace_id,channel_id' });
      }
    }
    
    return successResponse(data.channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return errorResponse(`Failed to fetch channels: ${error.message}`);
  }
}

async function sendMessage(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { channel, text, blocks } = requestBody;
    
    if (!channel || (!text && !blocks)) {
      return errorResponse('Channel and message content (text or blocks) are required');
    }
    
    const payload: any = {
      channel,
      text: text || ''
    };
    
    if (blocks) {
      payload.blocks = blocks;
    }
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
    return successResponse(data);
  } catch (error) {
    console.error("Error sending message:", error);
    return errorResponse(`Failed to send message: ${error.message}`);
  }
}

async function createReminder(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { text, time, user } = requestBody;
    
    if (!text || !time) {
      return errorResponse('Reminder text and time are required');
    }
    
    const response = await fetch('https://slack.com/api/reminders.add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        time,
        user: user || userId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
    return successResponse(data);
  } catch (error) {
    console.error("Error creating reminder:", error);
    return errorResponse(`Failed to create reminder: ${error.message}`);
  }
}
