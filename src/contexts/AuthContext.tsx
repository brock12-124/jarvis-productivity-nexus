
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  signInWithOAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Handle successful OAuth sign-ins to store integration tokens
        if (event === 'SIGNED_IN' && 
            newSession?.provider_token && 
            newSession?.provider_refresh_token &&
            newSession?.user) {
          
          // Use setTimeout to avoid deadlocks in the auth state listener
          setTimeout(async () => {
            try {
              const provider = newSession.user.app_metadata.provider;
              let providerKey = provider;

              // Map OAuth provider name to the corresponding integration name
              if (provider === 'google') {
                providerKey = 'google_calendar';
              }

              // Store the integration token in the database
              const { error } = await supabase
                .from('user_integrations')
                .upsert({
                  user_id: newSession.user.id,
                  provider: providerKey,
                  access_token: newSession.provider_token,
                  refresh_token: newSession.provider_refresh_token || null,
                  token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // Default 1 hour expiry
                  provider_user_id: newSession.user.id
                });

              if (error) {
                console.error('Error storing integration token:', error);
                throw error;
              }

              toast({
                title: "Integration successful",
                description: `Your ${provider} account has been connected`,
              });
            } catch (error) {
              console.error('Error handling OAuth token:', error);
              toast({
                title: "Integration failed",
                description: "Failed to complete the integration",
                variant: "destructive"
              });
            }
          }, 0);
        }
        
        setIsLoading(false);

        // Show toast for relevant auth events
        if (event === 'SIGNED_IN' && !newSession?.provider_token) {
          toast({
            title: "Signed in successfully",
            description: `Welcome${newSession?.user?.email ? ` ${newSession.user.email}` : ''}!`,
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      // Determine the necessary scopes based on the provider
      let scopes = '';
      
      if (provider === 'google') {
        // Request calendar-specific scopes for Google
        scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          scopes: scopes,
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate with provider",
        variant: "destructive"
      });
      throw error; // Re-throw to allow handling in the IntegrationHub component
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
