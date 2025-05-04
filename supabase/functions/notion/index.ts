
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
    
    // Get valid Notion token
    const tokenData = await getValidToken(supabaseClient, user.id, 'notion');
    if (!tokenData) {
      return errorResponse('Notion not connected', 400);
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'databases':
        return await getDatabases(user.id, tokenData.accessToken, supabaseClient);
        
      case 'create-page':
        return await createPage(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'update-page':
        return await updatePage(user.id, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'search':
        return await search(user.id, tokenData.accessToken, supabaseClient, url.searchParams);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function getDatabases(userId: string, accessToken: string, supabaseClient: any) {
  try {
    const response = await fetch('https://api.notion.com/v1/databases', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store databases in our database
    for (const db of data.results) {
      let title = 'Untitled';
      if (db.title && db.title.length > 0) {
        title = db.title.map(t => t.plain_text).join(' ');
      }
      
      await supabaseClient.from('notion_databases').upsert({
        user_id: userId,
        database_id: db.id,
        title: title,
        updated_at: new Date()
      }, { onConflict: 'user_id,database_id' });
    }
    
    return successResponse(data.results);
  } catch (error) {
    console.error("Error fetching databases:", error);
    return errorResponse(`Failed to fetch databases: ${error.message}`);
  }
}

async function createPage(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { parent, properties, children } = requestBody;
    
    if (!parent) {
      return errorResponse('Parent database or page is required');
    }
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent,
        properties: properties || {},
        children: children || []
      })
    });
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return successResponse(data);
  } catch (error) {
    console.error("Error creating page:", error);
    return errorResponse(`Failed to create page: ${error.message}`);
  }
}

async function updatePage(userId: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { pageId, properties } = requestBody;
    
    if (!pageId) {
      return errorResponse('Page ID is required');
    }
    
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: properties || {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return successResponse(data);
  } catch (error) {
    console.error("Error updating page:", error);
    return errorResponse(`Failed to update page: ${error.message}`);
  }
}

async function search(userId: string, accessToken: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const query = params.get('query') || '';
    
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return successResponse(data.results);
  } catch (error) {
    console.error("Error searching Notion:", error);
    return errorResponse(`Failed to search Notion: ${error.message}`);
  }
}
