
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Calendar, FileText, Truck, Car, ExternalLink, Star, Loader2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Provider } from "@supabase/supabase-js";
import { IntegrationService, IntegrationStatus } from "@/services/IntegrationService";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  status: "connected" | "available" | "connecting";
  description: string;
  provider?: Provider;
  scopes?: string;
  lastSynced?: Date | null;
}

export const IntegrationHub = () => {
  const { user, signInWithOAuth } = useAuth();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userIntegrations, setUserIntegrations] = useState<Record<string, IntegrationStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
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
      provider: "google",
      scopes: "https://www.googleapis.com/auth/calendar"
    },
    {
      id: "notion",
      name: "Notion",
      icon: FileText,
      color: "text-gray-900 dark:text-gray-100",
      status: "available",
      description: "Sync notes and documents",
      provider: "notion"
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
    },
    {
      id: "slack",
      name: "Slack",
      icon: MessageCircle,
      color: "text-purple-500",
      status: "available",
      description: "Collaborative messaging",
      provider: "slack"
    }
  ]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchUserIntegrations();
  }, [user]);

  const fetchUserIntegrations = async () => {
    try {
      setIsLoading(true);
      
      const integrationStatuses = await IntegrationService.getIntegrationsStatus();
      
      const connected: Record<string, IntegrationStatus> = {};
      integrationStatuses.forEach(integration => {
        connected[integration.provider] = integration;
      });
      
      // Map database provider names to integration IDs
      if (connected['google_calendar']) connected['google-calendar'] = connected['google_calendar'];
      if (connected['swiggy'] || connected['zomato']) connected['food-delivery'] = connected['swiggy'] || connected['zomato'];
      if (connected['uber'] || connected['ola']) connected['uber'] = connected['uber'] || connected['ola'];

      setUserIntegrations(connected);

      // Update integration statuses
      setIntegrations(prev => prev.map(integration => ({
        ...integration,
        status: connected[integration.id] ? "connected" : "available",
        lastSynced: connected[integration.id]?.lastSynced || null
      })));
    } catch (error) {
      console.error("Error fetching user integrations:", error);
      toast({
        title: "Error",
        description: "Failed to load integration status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationClick = async (integration: Integration) => {
    setSelectedIntegration(integration);
    
    // For OAuth providers
    if (integration.provider) {
      try {
        // Update status to connecting
        setIntegrations(prev => prev.map(item => 
          item.id === integration.id ? { ...item, status: "connecting" } : item
        ));
        
        await IntegrationService.signInWithOAuth(integration.provider);
        
        // The actual connection status will be updated when the auth state changes
        // and the useEffect hook runs again
      } catch (error) {
        console.error("OAuth error:", error);
        toast({
          title: "Connection failed",
          description: "Failed to connect to " + integration.name,
          variant: "destructive"
        });
        
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

  const handleDisconnectIntegration = async (integrationId: string) => {
    if (!user) return;
    
    const integration = integrations.find(item => item.id === integrationId);
    if (!integration) return;
    
    try {
      setDisconnectingId(integrationId);
      
      // Map integration ID to provider name in database
      let providerName = integrationId;
      if (integrationId === 'google-calendar') providerName = 'google_calendar';
      
      await IntegrationService.disconnectIntegration(providerName);
      
      // Update state
      setUserIntegrations(prev => {
        const updated = { ...prev };
        delete updated[integrationId];
        return updated;
      });
      
      setIntegrations(prev => prev.map(item => 
        item.id === integrationId ? { ...item, status: "available" } : item
      ));
      
      toast({
        title: "Disconnected",
        description: `${integration.name} has been disconnected`,
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Failed to disconnect",
        description: `Could not disconnect from ${integration.name}`,
        variant: "destructive"
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    if (!user) return;
    
    const integration = integrations.find(item => item.id === integrationId);
    if (!integration) return;
    
    try {
      setSyncingId(integrationId);
      
      // Map integration ID to provider name in database
      let providerName = integrationId;
      if (integrationId === 'google-calendar') providerName = 'google_calendar';
      
      await IntegrationService.syncIntegration(providerName);
      
      // Update the last synced time
      const now = new Date();
      setIntegrations(prev => prev.map(item => 
        item.id === integrationId ? { ...item, lastSynced: now } : item
      ));
      
      toast({
        title: "Sync complete",
        description: `${integration.name} has been synchronized`,
      });
      
      // Refresh integration status
      await fetchUserIntegrations();
    } catch (error) {
      console.error("Error syncing:", error);
      toast({
        title: "Sync failed",
        description: `Could not sync ${integration.name}`,
        variant: "destructive"
      });
    } finally {
      setSyncingId(null);
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
                <div key={integration.id} className="relative">
                  <Button
                    variant="outline"
                    className={cn(
                      "h-auto p-4 w-full flex flex-col items-center gap-2 border",
                      integration.status === "connected" && "border-green-500",
                      integration.status === "connecting" && "opacity-70"
                    )}
                    onClick={() => {
                      if (integration.status !== "connected") {
                        handleIntegrationClick(integration);
                      }
                    }}
                    disabled={integration.status === "connecting" || disconnectingId === integration.id || syncingId === integration.id}
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
                    {integration.lastSynced && (
                      <div className="mt-1 text-xs text-gray-500">
                        Last synced: {formatSyncTime(integration.lastSynced)}
                      </div>
                    )}
                  </Button>
                  
                  {integration.status === "connected" && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncIntegration(integration.id);
                        }}
                        disabled={syncingId === integration.id}
                      >
                        {syncingId === integration.id ? 
                          <Loader2 className="h-3 w-3 animate-spin" /> : 
                          <RefreshCw className="h-3 w-3 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" />
                        }
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnectIntegration(integration.id);
                        }}
                        disabled={disconnectingId === integration.id}
                      >
                        {disconnectingId === integration.id ? 
                          <Loader2 className="h-3 w-3 animate-spin" /> : 
                          <X className="h-3 w-3 text-gray-500 hover:text-red-600 dark:hover:text-red-400" />
                        }
                      </Button>
                    </div>
                  )}
                </div>
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

// Helper function to format the sync time relative to now
function formatSyncTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("text-xs py-1 px-2 rounded-full flex items-center", className)}>
    {children}
  </div>
);
