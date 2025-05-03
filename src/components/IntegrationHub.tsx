
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Calendar, FileText, Truck, Car, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  status: "connected" | "available" | "coming-soon";
  description: string;
}

export const IntegrationHub = () => {
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
      status: "connected",
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
      status: "coming-soon",
      description: "Order food with voice commands"
    },
    {
      id: "uber",
      name: "Uber/Ola",
      icon: Car,
      color: "text-gray-900 dark:text-gray-100",
      status: "coming-soon",
      description: "Book cabs with voice commands"
    }
  ];

  const handleIntegrationClick = (integration: Integration) => {
    switch (integration.status) {
      case "connected":
        toast({
          title: `${integration.name} is connected`,
          description: "Click to manage this integration",
        });
        break;
      case "available":
        toast({
          title: `Connect to ${integration.name}`,
          description: "Integration coming soon!",
        });
        break;
      case "coming-soon":
        toast({
          title: `${integration.name} integration`,
          description: "This integration is coming soon!",
        });
        break;
    }
  };

  return (
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
  );
};

const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("text-xs py-1 px-2 rounded-full flex items-center", className)}>
    {children}
  </div>
);
