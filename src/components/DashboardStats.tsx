
import { 
  BarChart,
  CircleCheck, 
  Clock, 
  Flame, 
  LineChart 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          <CircleCheck className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12/16</div>
          <p className="text-xs text-muted-foreground mt-1">
            +2 from yesterday
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Productive Hours</CardTitle>
          <Clock className="h-5 w-5 text-jarvis-blue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5.2h</div>
          <p className="text-xs text-muted-foreground mt-1">
            +0.8h from average
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Focus Sessions</CardTitle>
          <Flame className="h-5 w-5 text-jarvis-pink" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total: 1h 45m today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
          <LineChart className="h-5 w-5 text-jarvis-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">87%</div>
          <p className="text-xs text-muted-foreground mt-1">
            +5% this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
