import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { PatentCard } from "@/components/PatentCard";
import { PatentDrawer } from "@/components/PatentDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, Cpu, Zap, Leaf, AlertCircle } from "lucide-react";

interface Patent {
  title: string;
  snippet: string;
  publication_date: string;
  inventor: string;
  assignee: string;
  patent_link: string;
  pdf: string;
}

const Search = () => {
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sort patents by publication date (most recent first)
  const sortPatentsByDate = (patents: Patent[]): Patent[] => {
    return [...patents].sort((a, b) => {
      const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      return dateB - dateA; // Descending order (most recent first)
    });
  };

  const searchPatents = async (query: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log(`Searching for: ${query}`);
      const response = await fetch(`/api/patents/search/serpapi?query=${encodeURIComponent(query)}&limit=10`);
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Check if data.results exists and is an array
      if (data.results && Array.isArray(data.results)) {
        // Sort patents by publication date (most recent first)
        const sortedPatents = sortPatentsByDate(data.results);
        setPatents(sortedPatents);
        console.log(`Found ${sortedPatents.length} patents, sorted by date`);
      } else {
        console.error('Invalid response format:', data);
        setPatents([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Search error:', err);
      setPatents([]);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handlePatentDetails = (patent: Patent) => {
    setSelectedPatent(patent);
    setDrawerOpen(true);
  };

  // Helper function to parse inventor string and extract LinkedIn URLs
  const parseInventors = (inventorString: string): { name: string; linkedin_url?: string }[] => {
    if (!inventorString) return [];
    
    // Split by common separators and clean up
    const inventors = inventorString
      .split(/[,;]/)
      .map(inv => inv.trim())
      .filter(inv => inv.length > 0);
    
    return inventors.map(inventor => {
      // Check if the inventor string contains a LinkedIn URL
      const linkedinMatch = inventor.match(/\[(https?:\/\/[^\]]+)\]/);
      if (linkedinMatch) {
        const linkedinUrl = linkedinMatch[1];
        const name = inventor.replace(/\[https?:\/\/[^\]]+\]/, '').trim();
        return { name, linkedin_url: linkedinUrl };
      }
      return { name: inventor };
    });
  };

  // Helper function to generate LinkedIn search URL with focused query
  const generateLinkedInSearchUrl = (inventorName: string, patentTitle: string): string => {
    // Clean up the inventor name
    const cleanName = inventorName.replace(/[^\w\s]/g, '').trim();
    
    // Extract first two words from patent title
    const titleWords = patentTitle.split(/\s+/).slice(0, 2).join(' ');
    const cleanTitleWords = titleWords.replace(/[^\w\s]/g, '').trim();
    
    // Create focused search query: inventor name + first two words of title
    const searchQuery = encodeURIComponent(`${cleanName} ${cleanTitleWords}`);
    
    return `https://www.linkedin.com/search/results/people/?keywords=${searchQuery}`;
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
              onClick={() => searchPatents(suggestion.text)}
            >
              <suggestion.icon className="h-4 w-4" />
              <span className="text-xs">{suggestion.text}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <Card className="patent-card p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="text-lg font-medium text-red-600">Search Error</span>
        <p className="text-muted-foreground max-w-md">{message}</p>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    </Card>
  );

  const NoResultsState = () => (
    <Card className="patent-card p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Lightbulb className="h-8 w-8 text-muted-foreground" />
        <span className="text-lg font-medium">No patents found</span>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search terms or browse our suggested topics
        </p>
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
          <SearchBar onSearch={searchPatents} loading={loading} />
          <FilterBar />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {error ? (
            <ErrorState message={error} />
          ) : !hasSearched ? (
            <EmptyState />
          ) : patents.length === 0 ? (
            <NoResultsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {patents.length} patents (sorted by most recent)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Save Query</Button>
                  <Button variant="outline" size="sm">Create Alert</Button>
                </div>
              </div>
              
              <div className="grid gap-6">
                {patents.map((patent, index) => {
                  const inventors = parseInventors(patent.inventor);
                  return (
                    <PatentCard
                      key={`${patent.title}-${index}`}
                      patent={{
                        patent_id: patent.patent_link || `patent-${index}`,
                        title: patent.title,
                        abstract: patent.snippet,
                        assignee: patent.assignee,
                        inventors: inventors,
                        year: patent.publication_date ? new Date(patent.publication_date).getFullYear() : undefined,
                        jurisdiction: "US",
                        google_patents_url: patent.patent_link
                      }}
                      onDetails={() => handlePatentDetails(patent)}
                      onInventorClick={(inventor) => {
                        if (inventor.linkedin_url) {
                          // Open direct LinkedIn URL
                          window.open(inventor.linkedin_url, '_blank');
                        } else {
                          // Open LinkedIn search for the inventor with focused query
                          const searchUrl = generateLinkedInSearchUrl(inventor.name, patent.title);
                          window.open(searchUrl, '_blank');
                        }
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <PatentDrawer
        patent={selectedPatent ? {
          patent_id: selectedPatent.patent_link || "unknown",
          title: selectedPatent.title,
          abstract: selectedPatent.snippet,
          assignee: selectedPatent.assignee,
          inventors: parseInventors(selectedPatent.inventor),
          year: selectedPatent.publication_date ? new Date(selectedPatent.publication_date).getFullYear() : undefined,
          jurisdiction: "US",
          google_patents_url: selectedPatent.patent_link
        } : null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Search;