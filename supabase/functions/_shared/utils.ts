
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleCORS(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

export function successResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

export function extractToken(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

export async function refreshToken(provider: string, refreshToken: string) {
  // Implementation will depend on the provider
  // This is a placeholder for token refresh logic
  return { accessToken: '', refreshToken: '', expiresAt: new Date() };
}

export type TokenData = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
};

export async function getValidToken(
  supabaseClient: any,
  userId: string, 
  provider: string
): Promise<TokenData | null> {
  try {
    const { data, error } = await supabaseClient
      .from('user_integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      console.error('Error fetching token:', error);
      return null;
    }

    const now = new Date();
    const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null;

    // If token is still valid, return it
    if (!expiresAt || expiresAt > now) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt,
      };
    }

    // Token expired, need to refresh
    if (data.refresh_token) {
      const newTokens = await refreshToken(provider, data.refresh_token);
      
      // Update the token in the database
      await supabaseClient
        .from('user_integrations')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt,
          updated_at: new Date(),
        })
        .eq('user_id', userId)
        .eq('provider', provider);
      
      return newTokens;
    }
    
    return null;
  } catch (err) {
    console.error('Error in getValidToken:', err);
    return null;
  }
}
