
import { CalendarPlus, CircleCheck, Clock, Mic, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}

export const QuickActionsBar = () => {
  const quickActions: QuickAction[] = [
    {
      id: "new-task",
      icon: CircleCheck,
      label: "Add Task",
      color: "text-jarvis-blue bg-jarvis-blue/10 hover:bg-jarvis-blue/20",
      onClick: () => {
        toast({
          title: "New Task",
          description: "Task creation coming soon!",
        });
      },
    },
    {
      id: "focus-session",
      icon: Zap,
      label: "Focus Mode",
      color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20",
      onClick: () => {
        toast({
          title: "Focus Mode",
          description: "Focus mode coming soon!",
        });
      },
    },
    {
      id: "schedule",
      icon: CalendarPlus,
      label: "Schedule",
      color: "text-violet-600 bg-violet-600/10 hover:bg-violet-600/20",
      onClick: () => {
        toast({
          title: "Schedule",
          description: "Calendar scheduling coming soon!",
        });
      },
    },
    {
      id: "voice",
      icon: Mic,
      label: "Voice",
      color: "text-jarvis-pink bg-jarvis-pink/10 hover:bg-jarvis-pink/20",
      onClick: () => {
        toast({
          title: "Voice Command",
          description: "Voice commands coming soon!",
        });
      },
    },
    {
      id: "ai-suggestion",
      icon: Sparkles,
      label: "AI Suggest",
      color: "text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20",
      onClick: () => {
        toast({
          title: "AI Suggestions",
          description: "AI suggestions coming soon!",
        });
      },
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={cn("flex-col h-auto gap-1 p-3", action.color)}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-normal">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
