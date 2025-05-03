
import { Home, BarChart, CalendarClock, Zap, Briefcase, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/",
    },
    {
      title: "Tasks",
      icon: ListChecks,
      path: "/tasks",
      badge: 4
    },
    {
      title: "Calendar",
      icon: CalendarClock,
      path: "/calendar",
    },
    {
      title: "Focus",
      icon: Zap,
      path: "/focus",
    },
    {
      title: "Projects",
      icon: Briefcase,
      path: "/projects",
    },
    {
      title: "Analytics",
      icon: BarChart,
      path: "/analytics",
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen py-4 flex flex-col bg-white dark:bg-gray-900 border-r">
      <div className="px-4 mb-6">
        <h2 className="font-bold text-xl flex items-center justify-center gap-2 text-jarvis-blue">
          <span className="grid place-items-center size-8 rounded-md bg-jarvis-blue text-white">J</span>
          Jarvis
        </h2>
      </div>
      
      <Separator className="mb-4" />
      
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              isActive(item.path) ? "bg-jarvis-blue hover:bg-jarvis-blue/90" : ""
            )}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Separator className="my-4" />
      
      <div className="px-3 mb-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
