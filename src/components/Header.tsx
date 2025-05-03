
import { Bell, Calendar, Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';

const Header = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleMicClick = () => {
    setIsListening(prev => !prev);
    
    if (!isListening) {
      toast({
        title: "Voice Input Activated",
        description: "Jarvis is listening. What would you like to do?",
      });
    } else {
      toast({
        title: "Voice Input Deactivated",
        description: "Jarvis stopped listening.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
      <div className="container flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-jarvis-blue">
            Jarvis
          </h1>
          <span className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              toast({
                title: "Calendar",
                description: "Calendar integration coming soon!",
              });
            }}
          >
            <Calendar className="h-5 w-5" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Notifications</h4>
                  <Button variant="ghost" size="sm">Mark all as read</Button>
                </div>
                <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant={isListening ? "default" : "outline"} 
            size="icon"
            className={`relative ${isListening ? 'bg-jarvis-pink hover:bg-jarvis-pink/90' : ''}`}
            onClick={handleMicClick}
          >
            <Mic className="h-5 w-5" />
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-jarvis-pink/50 animate-ripple"></span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              toast({
                title: "Settings",
                description: "Settings panel coming soon!",
              });
            }}
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-jarvis-blue text-white">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
