
import { useState } from "react";
import { Send, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export const JarvisAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Jarvis, your productivity assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      let responseContent = "";

      if (input.toLowerCase().includes("task") && input.toLowerCase().includes("create")) {
        responseContent = "I'd be happy to help you create a new task. What would you like to call it, and when is it due?";
      } else if (input.toLowerCase().includes("remind")) {
        responseContent = "I'll set a reminder for you. Is there a specific time you'd like to be reminded?";
      } else if (input.toLowerCase().includes("schedule") || input.toLowerCase().includes("calendar")) {
        responseContent = "I can see that you have 3 meetings scheduled today. Your next meeting is 'Team Standup' at 2:00 PM.";
      } else if (input.toLowerCase().includes("focus")) {
        responseContent = "Would you like me to start a focus session? I can block notifications and track your productivity during this time.";
      } else {
        responseContent = "I'm here to help with your productivity needs. You can ask me to create tasks, set reminders, check your schedule, or start focus sessions.";
      }

      const assistantMessage = {
        id: Date.now().toString(),
        content: responseContent,
        sender: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleVoiceInput = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      toast({
        title: "Voice Input Activated",
        description: "Jarvis is listening. What would you like to do?",
      });
      
      // Simulate voice recognition after a delay
      setTimeout(() => {
        setIsListening(false);
        setInput("Create a new task for the presentation tomorrow");
        
        toast({
          title: "Voice Input Received",
          description: "I heard: Create a new task for the presentation tomorrow",
        });
      }, 3000);
    }
  };

  return (
    <Card className={`fixed bottom-4 right-4 w-80 shadow-lg transition-all duration-300 ${isExpanded ? 'h-96' : 'h-12'}`}>
      <CardHeader className="p-3 flex flex-row items-center justify-between bg-jarvis-blue text-white rounded-t-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 bg-white text-jarvis-blue">
            <AvatarFallback>J</AvatarFallback>
          </Avatar>
          <h3 className="text-sm font-medium">Jarvis Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-jarvis-blue/20">
          {isExpanded ? <X className="h-4 w-4" /> : null}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="p-3 h-[calc(100%-80px)] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      message.sender === "user"
                        ? "bg-jarvis-blue text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="p-2 border-t">
            <div className="flex w-full items-center gap-2">
              <Button
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={`shrink-0 ${isListening ? "bg-jarvis-pink hover:bg-jarvis-pink/90" : ""}`}
                onClick={handleVoiceInput}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Message Jarvis..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};
