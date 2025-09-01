import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatentCard } from "@/components/PatentCard";
import { PatentDrawer } from "@/components/PatentDrawer";
import { Trash2, Bell, Search, Plus } from "lucide-react";

const Watchlist = () => {
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mock saved queries
  const savedQueries = [
    {
      id: "1",
      query: "HVAC efficiency thermal management",
      created: "2024-08-15",
      alertEnabled: true,
      frequency: "weekly",
      results: 127
    },
    {
      id: "2", 
      query: "solar panels bifacial photovoltaic",
      created: "2024-08-12",
      alertEnabled: false,
      frequency: "daily",
      results: 89
    },
    {
      id: "3",
      query: "wind turbine direct drive generator",
      created: "2024-08-10",
      alertEnabled: true,
      frequency: "daily",
      results: 156
    }
  ];

  // Mock saved patents
  const savedPatents = [
    {
      patent_id: "US10123456B2",
      title: "High-Efficiency HVAC System with Smart Temperature Control",
      abstract: "A heating, ventilation, and air conditioning (HVAC) system that incorporates machine learning algorithms to optimize energy consumption while maintaining optimal comfort levels...",
      assignee: "EcoTech Industries",
      inventors: [
        { name: "Dr. Sarah Chen", linkedin_url: "https://linkedin.com/in/sarahchen" }
      ],
      year: 2023,
      jurisdiction: "US",
      google_patents_url: "https://patents.google.com/patent/US10123456B2",
      savedDate: "2024-08-20"
    },
    {
      patent_id: "EP3456789A1",
      title: "Bifacial Solar Panel with Enhanced Light Absorption", 
      abstract: "An innovative photovoltaic panel design featuring bifacial cells with micro-textured surfaces that capture sunlight from both front and rear sides...",
      assignee: "SolarMax Corporation",
      inventors: [
        { name: "Prof. Elena Rodriguez", linkedin_url: "https://linkedin.com/in/elenarodriguez" }
      ],
      year: 2023,
      jurisdiction: "EP", 
      google_patents_url: "https://patents.google.com/patent/EP3456789A1",
      savedDate: "2024-08-18"
    }
  ];

  const handlePatentDetails = (patent: any) => {
    setSelectedPatent(patent);
    setDrawerOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground">
          Manage your saved queries, patents, and alerts
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Saved Queries */}
        <Card className="patent-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Saved Queries
                </CardTitle>
                <CardDescription>
                  Monitor search queries for new patents
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Query
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedQueries.map((query) => (
                <div key={query.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {query.results} results
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created {query.created}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{query.query}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Alerts</span>
                        <Switch checked={query.alertEnabled} />
                      </div>
                      {query.alertEnabled && (
                        <Select value={query.frequency}>
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Run Search
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Saved Patents */}
        <Card className="patent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Saved Patents
            </CardTitle>
            <CardDescription>
              Patents you've bookmarked for later review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedPatents.map((patent) => (
                <div key={patent.patent_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium text-sm leading-tight">{patent.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {patent.patent_id}
                        </Badge>
                        <span>•</span>
                        <span>{patent.assignee}</span>
                        <span>•</span>
                        <span>Saved {patent.savedDate}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {patent.abstract}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePatentDetails(patent)}
                    >
                      Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PatentDrawer
        patent={selectedPatent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Watchlist;