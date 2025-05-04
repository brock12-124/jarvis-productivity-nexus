
import { supabase } from "@/integrations/supabase/client";
import { getFunctionUrl } from "@/utils/supabaseUtils";

export interface IntegrationStatus {
  provider: string;
  connected: boolean;
  lastSynced?: Date | null;
}

export const IntegrationService = {
  /**
   * Get the status of all integrations for the current user
   */
  async getIntegrationsStatus(): Promise<IntegrationStatus[]> {
    try {
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('provider, last_synced_at, created_at');
      
      if (error) {
        throw error;
      }
      
      // Map to expected format
      return (integrations || []).map((integration) => ({
        provider: integration.provider,
        connected: true,
        lastSynced: integration.last_synced_at ? new Date(integration.last_synced_at) : new Date(integration.created_at),
      }));
    } catch (error) {
      console.error('Error fetching integrations status:', error);
      return [];
    }
  },
  
  /**
   * Sign in with OAuth for a specific provider
   */
  async signInWithOAuth(provider: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: getProviderScopes(provider),
        }
      });
      
      if (error) {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw error;
    }
  },
  
  /**
   * Disconnect an integration
   */
  async disconnectIntegration(provider: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('provider', provider);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Error disconnecting ${provider}:`, error);
      throw error;
    }
  },
  
  /**
   * Sync an integration
   */
  async syncIntegration(provider: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = getFunctionUrl('sync-manager/sync-all');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration_type: provider })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync ${provider}`);
      }
    } catch (error) {
      console.error(`Error syncing ${provider}:`, error);
      throw error;
    }
  }
};

// Helper function to get appropriate scopes for each provider
function getProviderScopes(provider: string): string {
  switch (provider) {
    case 'google':
      return 'https://www.googleapis.com/auth/calendar';
    case 'slack':
      return 'channels:read,channels:write,chat:write';
    case 'notion':
      return 'read_user,read_content,create_content';
    default:
      return '';
  }
}
