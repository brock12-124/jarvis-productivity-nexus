
import { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Calendar as CalendarIcon, MoreVertical, Loader2, UserPlus, Trash } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';

interface NewEventFormValues {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  eventType: 'meeting' | 'deadline' | 'reminder' | 'focus';
}

const Calendar = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  
  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" />;
  }

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

  const form = useForm<NewEventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '10:00',
      location: '',
      eventType: 'meeting'
    }
  });

  const handleCreateEvent = async (values: NewEventFormValues) => {
    try {
      setIsSubmitting(true);
      
      const startDateTime = new Date(`${values.startDate}T${values.startTime}`);
      const endDateTime = new Date(`${values.endDate}T${values.endTime}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date or time");
      }
      
      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }
      
      const newEvent = await addEvent({
        title: values.title,
        start: startDateTime,
        end: endDateTime,
        description: values.description,
        location: values.location,
        type: values.eventType
      });
      
      if (newEvent) {
        toast({
          title: "Event created",
          description: `${values.title} has been added to your calendar`,
        });
        
        setIsDialogOpen(false);
        form.reset();
      }
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      toast({
        title: "Event deleted",
        description: `"${eventTitle}" has been removed from your calendar`,
      });
    }
  };

  return (
    <div className="container px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new event to your calendar.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Meeting with team" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="meeting">Meeting</option>
                          <option value="deadline">Deadline</option>
                          <option value="reminder">Reminder</option>
                          <option value="focus">Focus Session</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Office, Google Meet, etc." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Event details..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading events...</p>
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No events scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
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
                              <DropdownMenuItem onClick={() => toast({ title: "Edit", description: `Edit ${event.title}` })}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
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
                        {event.location && (
                          <div className="mt-1 text-xs text-muted-foreground truncate">
                            {event.location}
                          </div>
                        )}
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
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="h-8 w-8 animate-spin text-jarvis-blue" />
              </div>
            ) : (
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
                            description: event.description || `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`,
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;
