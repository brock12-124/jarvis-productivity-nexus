
import { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Calendar as CalendarIcon, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'deadline' | 'reminder' | 'focus';
}

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // These would come from an API/database in a real app
  const events: Event[] = [
    {
      id: '1',
      title: 'Team Standup',
      start: new Date(new Date().setHours(10, 0)),
      end: new Date(new Date().setHours(10, 30)),
      type: 'meeting',
    },
    {
      id: '2',
      title: 'Project Deadline',
      start: new Date(new Date().setHours(17, 0)),
      end: new Date(new Date().setHours(17, 0)),
      type: 'deadline',
    },
    {
      id: '3',
      title: 'Client Call',
      start: new Date(new Date().setHours(14, 0)),
      end: new Date(new Date().setHours(15, 0)),
      type: 'meeting',
    },
    {
      id: '4',
      title: 'Focus Session',
      start: new Date(new Date().setHours(13, 0)),
      end: new Date(new Date().setHours(13, 45)),
      type: 'focus',
    },
    {
      id: '5',
      title: 'Order Lunch',
      start: new Date(new Date().setHours(12, 0)),
      end: new Date(new Date().setHours(12, 15)),
      type: 'reminder',
    },
  ];

  // Get events for the selected date
  const selectedDateEvents = events.filter(event => 
    event.start.getDate() === selectedDate.getDate() &&
    event.start.getMonth() === selectedDate.getMonth() &&
    event.start.getFullYear() === selectedDate.getFullYear()
  ).sort((a, b) => a.start.getTime() - b.start.getTime());

  // Generate time slots for the day view
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'deadline':
        return 'bg-red-500';
      case 'reminder':
        return 'bg-amber-500';
      case 'focus':
        return 'bg-jarvis-purple';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Meeting';
      case 'deadline':
        return 'Deadline';
      case 'reminder':
        return 'Reminder';
      case 'focus':
        return 'Focus Session';
      default:
        return type;
    }
  };

  const handleAddEvent = () => {
    toast({
      title: 'Coming soon',
      description: 'Event creation feature will be available soon!',
    });
  };

  return (
    <div className="container px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        
        <Button onClick={handleAddEvent} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-3">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="border-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-jarvis-blue" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No events scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
                  <Button variant="outline" className="mt-4" onClick={handleAddEvent}>
                    <Plus className="h-4 w-4 mr-2" /> Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={`w-1 self-stretch rounded-full ${getEventColor(event.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: 'Edit', description: `Edit ${event.title}` })}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: 'Delete', description: `Delete ${event.title}` })}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock size={12} className="mr-1" />
                            {format(event.start, 'h:mm a')}
                            {event.start.getTime() !== event.end.getTime() && ` - ${format(event.end, 'h:mm a')}`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getEventTypeText(event.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="relative min-h-[600px]">
              {/* Time indicators */}
              <div className="absolute top-0 left-0 w-16 h-full">
                {timeSlots.map((hour) => (
                  <div key={hour} className="h-20 text-xs text-muted-foreground flex items-start justify-end pr-2">
                    {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? 'AM' : 'PM'}
                  </div>
                ))}
              </div>
              
              {/* Grid */}
              <div className="ml-16 border-l h-full relative">
                {timeSlots.map((hour) => (
                  <div key={hour} className="h-20 border-b border-gray-100 dark:border-gray-800 relative"></div>
                ))}
                
                {/* Events */}
                {selectedDateEvents.map((event) => {
                  const startHour = event.start.getHours();
                  const startMinutes = event.start.getMinutes();
                  const endHour = event.end.getHours();
                  const endMinutes = event.end.getMinutes();
                  
                  const startPosition = ((startHour - 8) * 60 + startMinutes) * (80 / 60); // 80px per hour
                  const endPosition = ((endHour - 8) * 60 + endMinutes) * (80 / 60);
                  const duration = endPosition - startPosition;
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-0 right-4 px-3 py-1 rounded-md ${getEventColor(event.type)} text-white cursor-pointer`}
                      style={{
                        top: `${startPosition}px`,
                        height: `${duration > 0 ? duration : 20}px`,
                      }}
                      onClick={() => {
                        toast({
                          title: event.title,
                          description: `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`,
                        });
                      }}
                    >
                      <div className="text-sm font-medium truncate">{event.title}</div>
                      {duration > 30 && (
                        <div className="text-xs opacity-90">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;
