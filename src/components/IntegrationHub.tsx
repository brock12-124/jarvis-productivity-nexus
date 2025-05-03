
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Calendar, FileText, Truck, Car, ExternalLink, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Provider } from "@supabase/supabase-js";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  status: "connected" | "available" | "connecting";
  description: string;
  provider?: Provider;
}

export const IntegrationHub = () => {
  const { user, signInWithOAuth } = useAuth();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userIntegrations, setUserIntegrations] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-green-500",
      status: "available",
      description: "Send messages and notifications"
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      icon: Calendar,
      color: "text-blue-500",
      status: "available",
      description: "Sync events and schedules",
      provider: "google"
    },
    {
      id: "notion",
      name: "Notion",
      icon: FileText,
      color: "text-gray-900 dark:text-gray-100",
      status: "available",
      description: "Sync notes and documents"
    },
    {
      id: "food-delivery",
      name: "Zomato/Swiggy",
      icon: Truck,
      color: "text-red-500",
      status: "available",
      description: "Order food with voice commands"
    },
    {
      id: "uber",
      name: "Uber/Ola",
      icon: Car,
      color: "text-gray-900 dark:text-gray-100",
      status: "available",
      description: "Book cabs with voice commands"
    }
  ]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchUserIntegrations = async () => {
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('provider')
          .eq('user_id', user.id);

        if (error) throw error;

        const connected: Record<string, boolean> = {};
        data.forEach(integration => {
          connected[integration.provider] = true;
        });

        // Map database provider names to integration IDs
        if (connected['google_calendar']) connected['google-calendar'] = true;
        if (connected['swiggy'] || connected['zomato']) connected['food-delivery'] = true;
        if (connected['uber'] || connected['ola']) connected['uber'] = true;

        setUserIntegrations(connected);

        // Update integration statuses
        setIntegrations(prev => prev.map(integration => ({
          ...integration,
          status: connected[integration.id] ? "connected" : "available"
        })));
      } catch (error) {
        console.error("Error fetching user integrations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserIntegrations();
  }, [user]);

  const handleIntegrationClick = async (integration: Integration) => {
    setSelectedIntegration(integration);
    
    // For OAuth providers
    if (integration.provider) {
      try {
        // Update status to connecting
        setIntegrations(prev => prev.map(item => 
          item.id === integration.id ? { ...item, status: "connecting" } : item
        ));
        
        await signInWithOAuth(integration.provider);
        
        // The actual connection status will be updated when the auth state changes
        // and the useEffect hook runs again
      } catch (error) {
        console.error("OAuth error:", error);
        
        // Revert status
        setIntegrations(prev => prev.map(item => 
          item.id === integration.id ? { ...item, status: "available" } : item
        ));
      }
    } else {
      // For non-OAuth integrations
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-jarvis-blue" />
            Integration Hub
          </CardTitle>
          <CardDescription>
            Connect Jarvis to your favorite apps and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-jarvis-blue" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {integrations.map((integration) => (
                <Button
                  key={integration.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-2 border",
                    integration.status === "connected" && "border-green-500",
                    integration.status === "connecting" && "opacity-70"
                  )}
                  onClick={() => handleIntegrationClick(integration)}
                  disabled={integration.status === "connecting"}
                >
                  {integration.status === "connecting" ? (
                    <Loader2 className={cn("h-6 w-6 animate-spin", integration.color)} />
                  ) : (
                    <integration.icon className={cn("h-6 w-6", integration.color)} />
                  )}
                  <span className="text-xs font-medium">{integration.name}</span>
                  <div className="mt-1">
                    {integration.status === "connected" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Star className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : integration.status === "connecting" ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Connecting...
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Available
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedIntegration?.name} Integration</DialogTitle>
            <DialogDescription>
              Connect your {selectedIntegration?.name} account to Jarvis
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              To connect your {selectedIntegration?.name} account, you'll need to sign in with your credentials.
              This will let Jarvis securely access your account.
            </p>
            
            <Button 
              onClick={() => {
                toast({
                  title: `${selectedIntegration?.name} connection initiated`,
                  description: "Please complete the sign-in process in the popup window",
                });
                setIsDialogOpen(false);
              }}
              className="w-full"
            >
              Continue with {selectedIntegration?.name}
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <p className="text-xs text-muted-foreground">
              Your credentials are never stored by Jarvis. We use secure OAuth for authentication.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("text-xs py-1 px-2 rounded-full flex items-center", className)}>
    {children}
  </div>
);
