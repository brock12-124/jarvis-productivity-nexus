
import { DashboardStats } from "@/components/DashboardStats";
import { JarvisAssistant } from "@/components/JarvisAssistant";
import { ProductivityChart } from "@/components/ProductivityChart";
import { QuickActionsBar } from "@/components/QuickActionsBar";
import { TaskList, Task } from "@/components/TaskList";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { IntegrationHub } from "@/components/IntegrationHub";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
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

  const handleTaskComplete = (taskId: string) => {
    const task = todayTasks.find(t => t.id === taskId);
    if (task) {
      toast({
        title: "Task completed",
        description: `"${task.title}" marked as complete`,
      });
    }
  };

  return (
    <div className="container px-4 py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <DashboardStats />
        
        <QuickActionsBar />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductivityChart />
          </div>
          
          <div>
            <UpcomingEvents />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-full">
            <TaskList 
              title="Today's Tasks" 
              tasks={todayTasks}
              onTaskComplete={handleTaskComplete} 
            />
          </div>
          <div className="h-full">
            <TaskList 
              title="Completed" 
              tasks={completedTasks} 
            />
          </div>
        </div>
        
        <IntegrationHub />
      </div>
      
      <JarvisAssistant />
    </div>
  );
};

export default Dashboard;
