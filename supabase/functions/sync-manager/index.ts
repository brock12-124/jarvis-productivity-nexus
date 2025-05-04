
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
    
    // This endpoint can be called either authenticated or by a scheduled job
    let userId: string | null = null;
    
    if (authHeader) {
      // Get JWT user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !user) {
        return errorResponse('Invalid token or user not found', 401);
      }
      
      userId = user.id;
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    
    // Parse request body if it exists
    let requestBody = {};
    if (req.method !== 'GET' && req.headers.get('content-type')?.includes('application/json')) {
      requestBody = await req.json();
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'process-queue':
        return await processQueue(supabaseClient, userId);
        
      case 'add-task':
        if (!userId) {
          return errorResponse('Authentication required', 401);
        }
        return await addTask(userId, supabaseClient, requestBody);
        
      case 'sync-all':
        if (!userId) {
          return errorResponse('Authentication required', 401);
        }
        return await syncAll(userId, supabaseClient);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function processQueue(supabaseClient: any, userId: string | null) {
  try {
    // Get pending tasks from sync queue
    const query = supabaseClient
      .from('sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(10);
    
    // If userId provided, only process that user's tasks
    if (userId) {
      query.eq('user_id', userId);
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!tasks || tasks.length === 0) {
      return successResponse({ message: "No pending tasks found" });
    }
    
    // Process each task
    const results = [];
    for (const task of tasks) {
      // Mark as processing
      await supabaseClient
        .from('sync_queue')
        .update({ status: 'processing', updated_at: new Date() })
        .eq('id', task.id);
      
      try {
        // Process based on integration type and operation
        const result = await processTask(task, supabaseClient);
        
        // Mark as completed
        await supabaseClient
          .from('sync_queue')
          .update({
            status: 'completed',
            updated_at: new Date(),
            completed_at: new Date()
          })
          .eq('id', task.id);
        
        results.push({ task_id: task.id, success: true, result });
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        
        // Mark as failed or reschedule
        const newStatus = task.attempts >= 3 ? 'failed' : 'pending';
        await supabaseClient
          .from('sync_queue')
          .update({
            status: newStatus,
            error: error.message,
            attempts: task.attempts + 1,
            updated_at: new Date(),
            scheduled_at: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 minutes
          })
          .eq('id', task.id);
        
        results.push({ task_id: task.id, success: false, error: error.message });
      }
    }
    
    return successResponse({ processed: results.length, results });
  } catch (error) {
    console.error("Error processing queue:", error);
    return errorResponse(`Failed to process queue: ${error.message}`);
  }
}

async function processTask(task: any, supabaseClient: any) {
  // Get token for the required integration
  const { data: integration, error } = await supabaseClient
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', task.user_id)
    .eq('provider', task.integration_type)
    .single();
  
  if (error || !integration) {
    throw new Error(`Integration not found: ${task.integration_type}`);
  }
  
  // Process based on integration and operation
  switch (task.integration_type) {
    case 'google_calendar':
      return await processCalendarTask(task, integration.access_token);
      
    case 'slack':
      return await processSlackTask(task, integration.access_token);
      
    case 'notion':
      return await processNotionTask(task, integration.access_token);
      
    default:
      throw new Error(`Unsupported integration: ${task.integration_type}`);
  }
}

async function processCalendarTask(task: any, accessToken: string) {
  const { operation, payload } = task;
  
  switch (operation) {
    case 'create_event':
      // Logic to create calendar event
      return { message: "Calendar event created" };
      
    case 'update_event':
      // Logic to update calendar event
      return { message: "Calendar event updated" };
      
    case 'delete_event':
      // Logic to delete calendar event
      return { message: "Calendar event deleted" };
      
    default:
      throw new Error(`Unsupported calendar operation: ${operation}`);
  }
}

async function processSlackTask(task: any, accessToken: string) {
  const { operation, payload } = task;
  
  switch (operation) {
    case 'send_message':
      // Logic to send Slack message
      return { message: "Slack message sent" };
      
    case 'create_reminder':
      // Logic to create Slack reminder
      return { message: "Slack reminder created" };
      
    default:
      throw new Error(`Unsupported Slack operation: ${operation}`);
  }
}

async function processNotionTask(task: any, accessToken: string) {
  const { operation, payload } = task;
  
  switch (operation) {
    case 'create_page':
      // Logic to create Notion page
      return { message: "Notion page created" };
      
    case 'update_page':
      // Logic to update Notion page
      return { message: "Notion page updated" };
      
    default:
      throw new Error(`Unsupported Notion operation: ${operation}`);
  }
}

async function addTask(userId: string, supabaseClient: any, requestBody: any) {
  try {
    const { integration_type, operation, payload, priority = 5, scheduled_at } = requestBody;
    
    if (!integration_type || !operation || !payload) {
      return errorResponse('Integration type, operation, and payload are required');
    }
    
    // Add task to sync queue
    const { data: task, error } = await supabaseClient.from('sync_queue').insert({
      user_id: userId,
      integration_type,
      operation,
      payload,
      priority,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : new Date(),
      status: 'pending'
    }).select().single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return successResponse(task);
  } catch (error) {
    console.error("Error adding task:", error);
    return errorResponse(`Failed to add task: ${error.message}`);
  }
}

async function syncAll(userId: string, supabaseClient: any) {
  try {
    // Get user's integrations
    const { data: integrations, error } = await supabaseClient
      .from('user_integrations')
      .select('provider, access_token')
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!integrations || integrations.length === 0) {
      return successResponse({ message: "No integrations found" });
    }
    
    // Process each integration
    const results = {};
    for (const integration of integrations) {
      try {
        switch (integration.provider) {
          case 'google_calendar':
            results['google_calendar'] = await syncGoogleCalendar(userId, integration.access_token, supabaseClient);
            break;
            
          case 'slack':
            results['slack'] = await syncSlack(userId, integration.access_token, supabaseClient);
            break;
            
          case 'notion':
            results['notion'] = await syncNotion(userId, integration.access_token, supabaseClient);
            break;
        }
      } catch (error) {
        console.error(`Error syncing ${integration.provider}:`, error);
        results[integration.provider] = { error: error.message };
      }
    }
    
    return successResponse(results);
  } catch (error) {
    console.error("Error syncing all:", error);
    return errorResponse(`Failed to sync all: ${error.message}`);
  }
}

async function syncGoogleCalendar(userId: string, accessToken: string, supabaseClient: any) {
  // Call the Google Calendar edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/google-calendar/sync`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync Google Calendar: ${response.status}`);
  }
  
  return await response.json();
}

async function syncSlack(userId: string, accessToken: string, supabaseClient: any) {
  // Call the Slack edge function to get channels
  const response = await fetch(`${supabaseUrl}/functions/v1/slack/channels`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync Slack: ${response.status}`);
  }
  
  return await response.json();
}

async function syncNotion(userId: string, accessToken: string, supabaseClient: any) {
  // Call the Notion edge function to get databases
  const response = await fetch(`${supabaseUrl}/functions/v1/notion/databases`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync Notion: ${response.status}`);
  }
  
  return await response.json();
}
