import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ExternalLink, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveService } from "@/services/saveService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Trends = () => {
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertQuery, setAlertQuery] = useState("");
  const [alertFrequency, setAlertFrequency] = useState("weekly");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateAlert = async () => {
    if (!alertQuery.trim()) return;
    
    setIsCreatingAlert(true);
    try {
      await saveService.createAlert({
        query: alertQuery.trim(),
        frequency: alertFrequency
      });
      toast({
        title: "Alert Created",
        description: `Alert for "${alertQuery.trim()}" has been created with ${alertFrequency} frequency.`,
      });
      setIsDialogOpen(false);
      setAlertQuery("");
      setAlertFrequency("weekly");
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast({
        title: "Alert Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAlert(false);
    }
  };

  // Mock data for charts
  const topAssignees = [
    { name: "Apple Inc.", count: 847, change: "+12%" },
    { name: "Samsung Electronics", count: 756, change: "+8%" },
    { name: "Tesla Motors", count: 523, change: "+34%" },
    { name: "Microsoft Corp.", count: 445, change: "+5%" },
    { name: "Google LLC", count: 398, change: "+18%" },
  ];

  const geographicData = [
    { country: "United States", filings: 2834 },
    { country: "China", filings: 2156 },
    { country: "European Union", filings: 1245 },
    { country: "Japan", filings: 789 },
    { country: "South Korea", filings: 567 },
    { country: "Canada", filings: 234 },
  ];

  const prolificInventors = [
    {
      name: "Dr. Sarah Chen",
      assignee: "EcoTech Industries", 
      count: 23,
      lastFiling: "2024-08-15"
    },
    {
      name: "Prof. Elena Rodriguez",
      assignee: "SolarMax Corporation",
      count: 19,
      lastFiling: "2024-08-12"
    },
    {
      name: "Mark Thompson",
      assignee: "Tesla Motors",
      count: 17,
      lastFiling: "2024-08-20"
    },
    {
      name: "James Wilson",
      assignee: "Apple Inc.",
      count: 15,
      lastFiling: "2024-08-18"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patent Trends</h1>
          <p className="text-muted-foreground">
            Analyze filing patterns and innovation trends
          </p>
        </div>
        
        {/* Date Range Picker and Create Alert */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange ? format(dateRange, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Patent Alert</DialogTitle>
                <DialogDescription>
                  Set up an alert to be notified when new patents match your search criteria.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="alert-query">Search Query</Label>
                  <Input
                    id="alert-query"
                    placeholder="e.g., solar panels, wind turbine, AI"
                    value={alertQuery}
                    onChange={(e) => setAlertQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alert-frequency">Alert Frequency</Label>
                  <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAlert}
                  disabled={isCreatingAlert || !alertQuery.trim()}
                >
                  {isCreatingAlert ? "Creating..." : "Create Alert"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Assignees Chart */}
        <Card className="patent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Top Assignees (Last 90 Days)
            </CardTitle>
            <CardDescription>
              Organizations with the most patent filings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAssignees.map((assignee, index) => (
                <div key={assignee.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="font-medium">{assignee.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-success">{assignee.change}</span>
                    <span className="text-sm font-mono">{assignee.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="patent-card">
          <CardHeader>
            <CardTitle>Filing Jurisdictions</CardTitle>
            <CardDescription>
              Where patents are being filed globally
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={geographicData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="country" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="filings" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Prolific Inventors Table */}
      <Card className="patent-card">
        <CardHeader>
          <CardTitle>Prolific Inventors</CardTitle>
          <CardDescription>
            Individuals with the highest patent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Inventor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assignee</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Patents</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Filing</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {prolificInventors.map((inventor) => (
                  <tr key={inventor.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{inventor.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{inventor.assignee}</td>
                    <td className="py-3 px-4 text-center font-mono">{inventor.count}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">{inventor.lastFiling}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trends;