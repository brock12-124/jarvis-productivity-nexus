
import { Clock, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface Event {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: "meeting" | "deadline" | "reminder";
}

export const UpcomingEvents = () => {
  const events: Event[] = [
    {
      id: "1",
      title: "Team Standup",
      time: "2:00 PM",
      duration: "30min",
      type: "meeting",
    },
    {
      id: "2",
      title: "Project Deadline",
      time: "5:00 PM",
      duration: "",
      type: "deadline",
    },
    {
      id: "3",
      title: "Call with Client",
      time: "3:30 PM",
      duration: "45min",
      type: "meeting",
    },
  ];

  const getEventTypeStyles = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "deadline":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "reminder":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleAddEvent = () => {
    toast({
      title: "Coming soon",
      description: "Calendar integration will be available soon!",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-jarvis-blue" />
          Upcoming Events
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddEvent}>
          Add Event
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No upcoming events
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge className={getEventTypeStyles(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{event.time}</span>
                    {event.duration && (
                      <span className="ml-1">({event.duration})</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
