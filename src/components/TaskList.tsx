
import { useState } from "react";
import { Check, Clock, MoreVertical, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

export interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
  dueDate?: Date;
}

interface TaskListProps {
  title: string;
  tasks: Task[];
  onTaskComplete?: (taskId: string) => void;
}

export const TaskList = ({ title, tasks, onTaskComplete }: TaskListProps) => {
  const [tasksState, setTasksState] = useState<Task[]>(tasks);

  const handleTaskStatusChange = (taskId: string) => {
    setTasksState((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "done" ? "todo" : "done" }
          : task
      )
    );

    if (onTaskComplete) {
      onTaskComplete(taskId);
    }

    const task = tasksState.find(t => t.id === taskId);
    if (task && task.status !== "done") {
      toast({
        title: "Task completed",
        description: `"${task.title}" marked as complete`,
      });
    }
  };

  const handleAddTask = () => {
    toast({
      title: "Coming soon",
      description: "Task creation feature will be available soon!",
    });
  };

  const handleTaskAction = (action: string, task: Task) => {
    toast({
      title: "Action triggered",
      description: `${action} for task "${task.title}"`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <Card className="h-full">
      <div className="p-4 flex items-center justify-between border-b">
        <h3 className="font-medium text-lg flex items-center gap-2">
          {title === "Today's Tasks" && <Clock size={18} className="text-jarvis-blue" />}
          {title === "Completed" && <Check size={18} className="text-green-500" />}
          {title}
          <Badge variant="outline" className="ml-2">
            {tasksState.length}
          </Badge>
        </h3>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={handleAddTask}>
          <Plus size={16} />
        </Button>
      </div>
      <CardContent className="p-0">
        {tasksState.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p>No tasks</p>
            <Button variant="ghost" size="sm" onClick={handleAddTask} className="mt-2">
              <Plus size={16} className="mr-1" /> Add task
            </Button>
          </div>
        ) : (
          <ul>
            {tasksState.map((task) => (
              <li
                key={task.id}
                className={`p-3 flex items-start gap-3 border-b last:border-b-0 ${
                  task.status === "done" ? "bg-muted/30" : ""
                }`}
              >
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={() => handleTaskStatusChange(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`${
                      task.status === "done"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock size={12} className="mr-1" />
                        {task.dueDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTaskAction("Edit", task)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTaskAction("Prioritize", task)}>
                      Prioritize
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTaskAction("Set reminder", task)}>
                      Set reminder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTaskAction("Delete", task)}
                      className="text-red-500 focus:text-red-500"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
