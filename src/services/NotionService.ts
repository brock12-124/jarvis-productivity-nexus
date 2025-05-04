import { supabase } from "@/integrations/supabase/client";
import { getFunctionUrl } from "@/utils/supabaseUtils";

export interface NotionDatabase {
  id: string;
  title: string;
  propertyMappings?: Record<string, any>;
}

export interface NotionPage {
  parent: {
    database_id?: string;
    page_id?: string;
  };
  properties: Record<string, any>;
  children?: any[];
}

export const NotionService = {
  /**
   * Get user's Notion databases
   */
  async getDatabases(): Promise<NotionDatabase[]> {
    try {
      // First check our database for cached databases
      const { data: localDatabases, error: localError } = await supabase
        .from('notion_databases')
        .select('*');
      
      if (localDatabases && localDatabases.length > 0) {
        return localDatabases.map(db => ({
          id: db.database_id,
          title: db.title,
          propertyMappings: db.property_mappings as Record<string, any>
        }));
      }
      
      // If no cached databases, fetch from Notion
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('notion/databases');
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch databases');
      }
      
      const data = await response.json();
      
      return (data || []).map((db: any) => {
        let title = 'Untitled';
        if (db.title && db.title.length > 0) {
          title = db.title.map((t: any) => t.plain_text).join(' ');
        }
        
        return {
          id: db.id,
          title,
          propertyMappings: {}
        };
      });
    } catch (error) {
      console.error('Error fetching Notion databases:', error);
      return [];
    }
  },
  
  /**
   * Create a new page in Notion
   */
  async createPage(page: NotionPage): Promise<Record<string, any> | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('notion/create-page');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(page)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Notion page:', error);
      return null;
    }
  },
  
  /**
   * Update an existing page in Notion
   */
  async updatePage(pageId: string, properties: Record<string, any>): Promise<Record<string, any> | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('notion/update-page');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageId,
          properties
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update page');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating Notion page:', error);
      return null;
    }
  },
  
  /**
   * Search Notion
   */
  async search(query: string): Promise<any[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${getFunctionUrl('notion/search')}?query=${encodeURIComponent(query)}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search Notion');
      }
      
      const data = await response.json();
      
      return data || [];
    } catch (error) {
      console.error('Error searching Notion:', error);
      return [];
    }
  }
};
