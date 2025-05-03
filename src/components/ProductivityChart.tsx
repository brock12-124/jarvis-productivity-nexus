
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

const data = [
  { name: 'Mon', tasks: 8, hours: 4.5, score: 76 },
  { name: 'Tue', tasks: 10, hours: 5.2, score: 82 },
  { name: 'Wed', tasks: 7, hours: 3.8, score: 70 },
  { name: 'Thu', tasks: 12, hours: 6.2, score: 87 },
  { name: 'Fri', tasks: 9, hours: 5.0, score: 79 },
  { name: 'Sat', tasks: 6, hours: 3.0, score: 65 },
  { name: 'Sun', tasks: 4, hours: 2.5, score: 60 },
];

export const ProductivityChart = () => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Productivity</CardTitle>
        <CardDescription>Your productivity metrics for the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: isMobile ? 0 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tasks"
                stroke="#4A6FA5"
                activeDot={{ r: 8 }}
                name="Tasks Completed"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke="#F8B4D9"
                name="Productive Hours"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="score"
                stroke="#8CDBA9"
                name="Productivity Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
