import { supabase } from "@/integrations/supabase/client";
import { getFunctionUrl } from "@/utils/supabaseUtils";

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  workspaceId: string;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
}

export interface SlackReminder {
  text: string;
  time: string | number; // Can be a timestamp or string like "in 30 minutes"
  user?: string;
}

export const SlackService = {
  /**
   * Get user's Slack channels
   */
  async getChannels(): Promise<SlackChannel[]> {
    try {
      // First check our database for cached channels
      const { data: localChannels, error: localError } = await supabase
        .from('slack_channels')
        .select('*');
      
      if (localChannels && localChannels.length > 0) {
        return localChannels.map(channel => ({
          id: channel.channel_id,
          name: channel.channel_name,
          isPrivate: channel.is_private || false,
          workspaceId: channel.workspace_id
        }));
      }
      
      // If no cached channels, fetch from Slack
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('slack/channels');
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch channels');
      }
      
      const data = await response.json();
      
      // Default workspace ID if we can't get it
      const workspaceId = 'default';
      
      return (data || [])
        .filter((channel: any) => !channel.is_archived)
        .map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private || false,
          workspaceId
        }));
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      return [];
    }
  },
  
  /**
   * Send a message to a Slack channel
   */
  async sendMessage(message: SlackMessage): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('slack/send-message');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      return false;
    }
  },
  
  /**
   * Create a reminder in Slack
   */
  async createReminder(reminder: SlackReminder): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('slack/create-reminder');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reminder)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reminder');
      }
      
      return true;
    } catch (error) {
      console.error('Error creating Slack reminder:', error);
      return false;
    }
  }
};
