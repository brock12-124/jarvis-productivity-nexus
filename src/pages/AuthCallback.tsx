import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the URL hash and extract the auth info
        // This happens after Supabase redirects back to our site
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Get the provider from the URL if possible
        const url = new URL(window.location.href);
        const provider = url.searchParams.get('provider');
        
        if (provider) {
          toast({
            title: "Connection successful",
            description: `${provider} has been connected to your account`,
          });
        } else {
          toast({
            title: "Authentication successful",
            description: "You have been authenticated successfully",
          });
        }
        
        // Check if we've been redirected from OAuth integration
        // We can look at the query params to see if there's an integration param
        const integration = url.searchParams.get('integration');
        
        if (integration) {
          // If we came from integration, go back to the dashboard
          navigate('/');
        } else {
          // Otherwise go to the default page after login
          navigate('/');
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed");
        toast({
          title: "Authentication error",
          description: err.message || "Failed to complete authentication",
          variant: "destructive",
        });
        
        // Redirect to dashboard after a delay on error
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {error ? (
        <div className="text-center p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500">Redirecting back to dashboard...</p>
        </div>
      ) : (
        <div className="text-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-jarvis-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Completing Authentication</h1>
          <p className="text-gray-600">Please wait while we finalize your connection...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
