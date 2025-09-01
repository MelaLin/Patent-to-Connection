import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { PatentCard } from "@/components/PatentCard";
import { PatentDrawer } from "@/components/PatentDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, Cpu, Zap, Leaf } from "lucide-react";

const Search = () => {
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mock data for demonstration
  const mockPatents = [
    {
      patent_id: "US10123456B2",
      title: "High-Efficiency HVAC System with Smart Temperature Control",
      abstract: "A heating, ventilation, and air conditioning (HVAC) system that incorporates machine learning algorithms to optimize energy consumption while maintaining optimal comfort levels. The system includes advanced sensors, predictive modeling, and automated control mechanisms that reduce energy usage by up to 30% compared to conventional systems...",
      assignee: "EcoTech Industries",
      inventors: [
        { name: "Dr. Sarah Chen", linkedin_url: "https://linkedin.com/in/sarahchen" },
        { name: "Mark Thompson", linkedin_url: "https://linkedin.com/in/markthompson" }
      ],
      year: 2023,
      jurisdiction: "US",
      google_patents_url: "https://patents.google.com/patent/US10123456B2"
    },
    {
      patent_id: "EP3456789A1",
      title: "Bifacial Solar Panel with Enhanced Light Absorption",
      abstract: "An innovative photovoltaic panel design featuring bifacial cells with micro-textured surfaces that capture sunlight from both front and rear sides. The enhanced absorption technology increases energy generation efficiency by 25% over traditional panels...",
      assignee: "SolarMax Corporation",
      inventors: [
        { name: "Prof. Elena Rodriguez", linkedin_url: "https://linkedin.com/in/elenarodriguez" },
        { name: "James Wilson", linkedin_url: "https://linkedin.com/in/jameswilson" }
      ],
      year: 2023,
      jurisdiction: "EP",
      google_patents_url: "https://patents.google.com/patent/EP3456789A1"
    }
  ];

  const handlePatentDetails = (patent: any) => {
    setSelectedPatent(patent);
    setDrawerOpen(true);
  };

  const EmptyState = () => (
    <Card className="patent-card p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Lightbulb className="h-8 w-8" />
          <span className="text-lg font-medium">Discover innovative patents</span>
        </div>
        <p className="text-muted-foreground mb-6 max-w-md">
          Search through millions of patents to find the innovations that matter to your business
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-lg">
          {[
            { icon: Cpu, text: "HVAC efficiency" },
            { icon: Zap, text: "Thermoelectric" },
            { icon: Leaf, text: "Bifacial PV" },
            { icon: Lightbulb, text: "Direct-drive wind" }
          ].map((suggestion) => (
            <Button
              key={suggestion.text}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-auto py-3"
            >
              <suggestion.icon className="h-4 w-4" />
              <span className="text-xs">{suggestion.text}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Patent Search</h1>
          <p className="text-muted-foreground">
            Discover innovations across technology domains
          </p>
        </div>

        {/* Search and filters */}
        <div className="space-y-4">
          <SearchBar />
          <FilterBar />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {mockPatents.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {mockPatents.length} patents
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Save Query</Button>
                  <Button variant="outline" size="sm">Create Alert</Button>
                </div>
              </div>
              
              <div className="grid gap-6">
                {mockPatents.map((patent) => (
                  <PatentCard
                    key={patent.patent_id}
                    patent={patent}
                    onDetails={() => handlePatentDetails(patent)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <PatentDrawer
        patent={selectedPatent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Search;