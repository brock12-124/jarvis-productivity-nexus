
import { useState } from "react";
import { Task, TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CalendarIcon, 
  Check, 
  ChevronDown, 
  Clock, 
  Filter, 
  Plus, 
  Search 
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

const Tasks = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | undefined>(undefined);

  const todayTasks: Task[] = [
    {
      id: "1",
      title: "Complete project proposal",
      priority: "high",
      status: "todo",
      dueDate: new Date(),
    },
    {
      id: "2",
      title: "Review team's progress",
      priority: "medium",
      status: "todo",
      dueDate: new Date(),
    },
    {
      id: "3",
      title: "Schedule client meeting",
      priority: "high",
      status: "in-progress",
      dueDate: new Date(),
    },
    {
      id: "4",
      title: "Prepare presentation",
      priority: "medium",
      status: "todo",
      dueDate: new Date(),
    },
  ];

  const upcomingTasks: Task[] = [
    {
      id: "7",
      title: "Quarterly planning session",
      priority: "high",
      status: "todo",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
    {
      id: "8",
      title: "Review marketing assets",
      priority: "medium",
      status: "todo",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    },
    {
      id: "9",
      title: "Team building event",
      priority: "low",
      status: "todo",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    },
  ];

  const completedTasks: Task[] = [
    {
      id: "5",
      title: "Send weekly report",
      priority: "medium",
      status: "done",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    },
    {
      id: "6",
      title: "Update documentation",
      priority: "low",
      status: "done",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    },
  ];

  const filteredTodayTasks = todayTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const filteredUpcomingTasks = upcomingTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const filteredCompletedTasks = completedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const handleAddTask = () => {
    toast({
      title: "Coming soon",
      description: "Task creation feature will be available soon!",
    });
  };

  const handleTaskComplete = (taskId: string) => {
    const task = [...todayTasks, ...upcomingTasks].find(t => t.id === taskId);
    if (task) {
      toast({
        title: "Task completed",
        description: `"${task.title}" marked as complete`,
      });
    }
  };

  return (
    <div className="container px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Priority</h4>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Due Date</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      setFilterPriority(undefined);
                      setSelectedDate(new Date());
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Filters applied",
                      });
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleAddTask} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-full">
            <TaskList 
              title="Today's Tasks" 
              tasks={filteredTodayTasks}
              onTaskComplete={handleTaskComplete}
            />
          </div>
          
          <div className="h-full">
            <TaskList 
              title="Upcoming" 
              tasks={filteredUpcomingTasks} 
              onTaskComplete={handleTaskComplete}
            />
          </div>
          
          <div className="h-full">
            <TaskList 
              title="Completed" 
              tasks={filteredCompletedTasks} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
