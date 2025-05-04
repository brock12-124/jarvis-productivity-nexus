
// Add this function to the existing utils.ts file

/**
 * Gets a valid token for the specified integration, refreshing if necessary
 */
export async function getValidToken(supabaseClient: any, userId: string, provider: string, oauthConfig?: any) {
  try {
    // Get the token from the database
    const { data: integration, error } = await supabaseClient
      .from('user_integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (error || !integration) {
      console.error(`No ${provider} integration found for user ${userId}`, error);
      return null;
    }
    
    let accessToken = integration.access_token;
    const refreshToken = integration.refresh_token;
    const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
    
    // Check if token is expired and needs to be refreshed
    const now = new Date();
    if (refreshToken && expiresAt && now > expiresAt && oauthConfig) {
      // For Google specifically
      if (provider === 'google_calendar' && oauthConfig) {
        try {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: oauthConfig.clientId,
              client_secret: oauthConfig.clientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });
          
          if (!tokenResponse.ok) {
            throw new Error(`Failed to refresh token: ${tokenResponse.statusText}`);
          }
          
          const tokenData = await tokenResponse.json();
          
          // Update the token in the database
          await supabaseClient
            .from('user_integrations')
            .update({
              access_token: tokenData.access_token,
              token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('provider', provider);
          
          accessToken = tokenData.access_token;
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw refreshError;
        }
      }
    }
    
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error(`Error getting valid token for ${provider}:`, error);
    return null;
  }
}
