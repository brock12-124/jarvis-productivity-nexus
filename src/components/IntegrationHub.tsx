
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Calendar, FileText, Truck, Car, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  status: "connected" | "available" | "coming-soon";
  description: string;
}

export const IntegrationHub = () => {
  const { user } = useAuth();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectType, setConnectType] = useState<"google-calendar" | "food-delivery" | "ride-booking" | null>(null);
  
  const googleCalendarForm = useForm({
    defaultValues: {
      authToken: "",
    },
  });

  const foodDeliveryForm = useForm({
    defaultValues: {
      provider: "",
      apiKey: "",
    },
  });

  const rideBookingForm = useForm({
    defaultValues: {
      provider: "",
      apiKey: "",
    },
  });

  const integrations: Integration[] = [
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
      description: "Sync events and schedules"
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
      status: "available", // Changed from coming-soon to available
      description: "Order food with voice commands"
    },
    {
      id: "uber",
      name: "Uber/Ola",
      icon: Car,
      color: "text-gray-900 dark:text-gray-100",
      status: "available", // Changed from coming-soon to available
      description: "Book cabs with voice commands"
    }
  ];

  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    
    switch(integration.id) {
      case "google-calendar":
        setConnectType("google-calendar");
        setIsDialogOpen(true);
        break;
      case "food-delivery":
        setConnectType("food-delivery");
        setIsDialogOpen(true);
        break;
      case "uber":
        setConnectType("ride-booking");
        setIsDialogOpen(true);
        break;
      default:
        toast({
          title: `${integration.name} integration`,
          description: "This integration will be available soon!",
        });
    }
  };

  const handleConnectGoogleCalendar = async (data: { authToken: string }) => {
    if (!user) return;

    try {
      setIsConnecting(true);
      
      // In a real implementation, we would exchange this token for access/refresh tokens
      // Here we're just simulating the connection
      const { error } = await supabase.from('user_integrations').insert({
        user_id: user.id,
        provider: 'google_calendar',
        access_token: data.authToken,
        refresh_token: 'simulated_refresh_token',
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Google Calendar connected!",
        description: "Your calendar is now synced with Jarvis",
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectFoodDelivery = async (data: { provider: string; apiKey: string }) => {
    if (!user) return;

    try {
      setIsConnecting(true);
      
      const { error } = await supabase.from('user_integrations').insert({
        user_id: user.id,
        provider: data.provider,
        access_token: data.apiKey,
      });

      if (error) throw error;

      toast({
        title: `${data.provider} connected!`,
        description: "You can now order food through Jarvis",
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectRideBooking = async (data: { provider: string; apiKey: string }) => {
    if (!user) return;

    try {
      setIsConnecting(true);
      
      const { error } = await supabase.from('user_integrations').insert({
        user_id: user.id,
        provider: data.provider,
        access_token: data.apiKey,
      });

      if (error) throw error;

      toast({
        title: `${data.provider} connected!`,
        description: "You can now book rides through Jarvis",
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {integrations.map((integration) => (
              <Button
                key={integration.id}
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-center gap-2 border",
                  integration.status === "connected" && "border-green-500",
                  integration.status === "coming-soon" && "opacity-70"
                )}
                onClick={() => handleIntegrationClick(integration)}
              >
                <integration.icon className={cn("h-6 w-6", integration.color)} />
                <span className="text-xs font-medium">{integration.name}</span>
                <div className="mt-1">
                  {integration.status === "connected" ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <Star className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : integration.status === "coming-soon" ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Coming Soon
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
          
          {connectType === "google-calendar" && (
            <Form {...googleCalendarForm}>
              <form onSubmit={googleCalendarForm.handleSubmit(handleConnectGoogleCalendar)}>
                <div className="grid gap-4 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      For this demo, just enter any text as an authorization token. 
                      In a production app, we'd redirect to Google OAuth.
                    </p>
                  </div>
                  <FormField
                    control={googleCalendarForm.control}
                    name="authToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorization Token</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter demo auth token" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isConnecting}>
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {connectType === "food-delivery" && (
            <Form {...foodDeliveryForm}>
              <form onSubmit={foodDeliveryForm.handleSubmit(handleConnectFoodDelivery)}>
                <div className="grid gap-4 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      For this demo, select a provider and enter any text as API key.
                    </p>
                  </div>
                  <FormField
                    control={foodDeliveryForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <select
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select a provider</option>
                            <option value="swiggy">Swiggy</option>
                            <option value="zomato">Zomato</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={foodDeliveryForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter demo API key" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isConnecting}>
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {connectType === "ride-booking" && (
            <Form {...rideBookingForm}>
              <form onSubmit={rideBookingForm.handleSubmit(handleConnectRideBooking)}>
                <div className="grid gap-4 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      For this demo, select a provider and enter any text as API key.
                    </p>
                  </div>
                  <FormField
                    control={rideBookingForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <select
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select a provider</option>
                            <option value="uber">Uber</option>
                            <option value="ola">Ola</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rideBookingForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter demo API key" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isConnecting}>
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
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
