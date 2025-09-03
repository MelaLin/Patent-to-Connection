import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PatentCard } from "@/components/PatentCard";
import { PatentDrawer } from "@/components/PatentDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Lightbulb, Cpu, Zap, Leaf, AlertCircle, Star, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveService } from "@/services/saveService";
import { useLocation } from "react-router-dom";

interface Patent {
  title: string;
  snippet?: string;
  abstract?: string;
  publication_date: string;
  inventor?: string;
  inventors?: Array<{ name: string; linkedin_url?: string }>;
  assignee: string;
  patent_link?: string;
  patent_number?: string;
  patent_id?: string;
  year?: number;
  jurisdiction?: string;
  google_patents_url?: string;
  pdf?: string;
  alignment_score?: number;
}

interface SearchResponse {
  results: Patent[];
  total: number;
  query: string;
  limit: number;
  offset: number;
  hasMore: boolean;
  starred_thesis?: { id: string; title: string } | null;
}

const Search = () => {
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [starredThesis, setStarredThesis] = useState<{ id: string; title: string } | null>(null);
  const [alignmentThreshold, setAlignmentThreshold] = useState(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'alignment'>('relevance');
  const { toast } = useToast();
  const location = useLocation();

  // Handle search query from watchlist navigation
  useEffect(() => {
    if (location.state?.searchQuery) {
      setCurrentSearchQuery(location.state.searchQuery);
      searchPatents(location.state.searchQuery);
    }
  }, [location.state]);

  // Re-filter and re-sort patents when alignment settings change
  useEffect(() => {
    if (patents.length > 0) {
      const processedPatents = getFilteredAndSortedPatents(patents);
      setPatents(processedPatents);
    }
  }, [alignmentThreshold, sortBy, starredThesis]);

  // Sort patents by publication date (most recent first)
  const sortPatentsByDate = (patents: Patent[]): Patent[] => {
    return [...patents].sort((a, b) => {
      const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      return dateB - dateA; // Descending order (most recent first)
    });
  };

  // Sort patents by alignment score (highest first)
  const sortPatentsByAlignment = (patents: Patent[]): Patent[] => {
    return [...patents].sort((a, b) => {
      const scoreA = a.alignment_score || 0;
      const scoreB = b.alignment_score || 0;
      return scoreB - scoreA; // Descending order (highest first)
    });
  };

  // Filter and sort patents based on current settings
  const getFilteredAndSortedPatents = (patents: Patent[]): Patent[] => {
    let filtered = patents;
    
    // Filter by alignment threshold if there's a starred thesis
    if (starredThesis && alignmentThreshold > 0) {
      filtered = filtered.filter(patent => (patent.alignment_score || 0) >= alignmentThreshold / 100);
    }
    
    // Sort based on selected option
    switch (sortBy) {
      case 'date':
        return sortPatentsByDate(filtered);
      case 'alignment':
        return starredThesis ? sortPatentsByAlignment(filtered) : filtered;
      default:
        return filtered; // Relevance (as returned by API)
    }
  };

  const searchPatents = async (query: string, offset = 0) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentSearchQuery(query);
    setCurrentOffset(offset);

    try {
      console.log(`Searching for: ${query}`);
      
      // Build URL with query parameters - no filters, just relevance and recency
      const params = new URLSearchParams({
        query: query,
        limit: '10',
        offset: offset.toString()
      });
      
      const userEmail = localStorage.getItem('userEmail');
      console.log('Search - userEmail from localStorage:', userEmail);
      console.log('Search - localStorage contents:', { userEmail: localStorage.getItem('userEmail') });
      const response = await fetch(`https://patent-forge-backend.onrender.com/api/patents/search/serpapi?${params.toString()}`, {
        headers: {
          'X-User-Email': userEmail || ''
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('API Response results length:', data.results?.length);
      console.log('API Response hasMore:', data.hasMore);
      
      // Check if data.results exists and is an array
      if (data.results && Array.isArray(data.results)) {
        // Update starred thesis info
        setStarredThesis(data.starred_thesis || null);
        
        // Get filtered and sorted patents
        const processedPatents = getFilteredAndSortedPatents(data.results);
        console.log('Processed patents length:', processedPatents.length);
        
        if (offset === 0) {
          // New search - replace results
          setPatents(processedPatents);
          console.log('Replaced patents, new count:', processedPatents.length);
        } else {
          // Load more - append results
          setPatents(prev => {
            const newPatents = [...prev, ...processedPatents];
            console.log('Appended patents, total count:', newPatents.length);
            return newPatents;
          });
        }
        
        // Check if there are more results - use backend's hasMore field
        const hasMore = data.hasMore || processedPatents.length === 10;
        setHasMoreResults(hasMore);
        console.log(`Pagination debug: ${processedPatents.length} results, total: ${data.total}, offset: ${offset}, hasMore: ${hasMore}`);
        console.log(`Backend hasMore: ${data.hasMore}, processedPatents.length === 10: ${processedPatents.length === 10}`);
        
        console.log(`Found ${processedPatents.length} patents, processed`);
      } else {
        console.error('Invalid response format:', data);
        if (offset === 0) {
          setPatents([]);
        }
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (offset === 0) {
        setPatents([]);
      }
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePatents = async () => {
    if (!currentSearchQuery.trim() || loading) return;
    
    const newOffset = patents.length; // Use current patents length as offset
    console.log(`Loading more patents with offset: ${newOffset}`);
    await searchPatents(currentSearchQuery, newOffset);
  };

  const handleSaveQuery = async () => {
    if (!currentSearchQuery.trim()) return;
    
    setIsSavingQuery(true);
    try {
      const queryData = {
        query: currentSearchQuery.trim(),
        filters: {} // No filters - focusing on relevance and recency
      };

      const result = await saveService.saveQuery(queryData);
      
      if (result.success) {
        toast({
          title: "Query Saved",
          description: `Search query "${currentSearchQuery.trim()}" has been saved to your Watchlist.`,
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save query:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save query",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuery(false);
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

  // Helper function to extract a single keyword from the search query
  const extractKeywordFromQuery = (query: string): string => {
    // Clean the query and get the first meaningful word
    const cleanQuery = query.toLowerCase().trim();
    const words = cleanQuery.split(/\s+/).filter(word => word.length > 0);
    
    // Return the first word, or a default if no words found
    return words.length > 0 ? words[0] : "patent";
  };

  // Helper function to generate LinkedIn search URL with inventor name + keyword
  const generateLinkedInSearchUrl = (inventorName: string, searchQuery: string): string => {
    // Clean up the inventor name
    const cleanName = inventorName.replace(/[^\w\s]/g, '').trim();
    
    // Extract a single keyword from the search query
    const keyword = extractKeywordFromQuery(searchQuery);
    
    // Create focused search query: inventor name + keyword
    const searchQueryString = encodeURIComponent(`${cleanName} ${keyword}`);
    
    // Try to point to the first result directly, fallback to search results page
    return `https://www.linkedin.com/search/results/people/?keywords=${searchQueryString}&origin=GLOBAL_SEARCH_HEADER`;
  };

  const EmptyState = () => (
    <Card className="p-8 text-center">
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
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="text-lg font-medium text-red-600">Search Error</span>
        <p className="text-muted-foreground max-w-md">{message}</p>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    </Card>
  );

  const NoResultsState = () => (
    <Card className="p-8 text-center">
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
          
          {/* Alignment Controls */}
          {starredThesis && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Active Thesis: {starredThesis.title}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Target className="h-3 w-3 mr-1" />
                    Alignment Scoring Enabled
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Alignment Score</label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[alignmentThreshold]}
                        onValueChange={(value) => setAlignmentThreshold(value[0])}
                        max={100}
                        min={0}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium min-w-[3rem]">
                        {alignmentThreshold}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={(value: 'relevance' | 'date' | 'alignment') => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date (Recent First)</SelectItem>
                        <SelectItem value="alignment" disabled={!starredThesis}>Alignment Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          )}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveQuery}
                  disabled={isSavingQuery || !currentSearchQuery.trim()}
                >
                  {isSavingQuery ? "Saving..." : "Save Query"}
                </Button>
              </div>
              
              <div className="grid gap-6">
                {patents.map((patent, index) => {
                  const inventors = parseInventors(patent.inventor);
                  return (
                    <PatentCard
                      key={`${patent.title}-${index}`}
                      patent={{
                        patent_id: patent.patent_id || patent.patent_number || `patent-${index}`,
                        title: patent.title,
                        abstract: patent.abstract || patent.snippet,
                        assignee: patent.assignee,
                        inventors: patent.inventors || inventors,
                        year: patent.year || (patent.publication_date ? new Date(patent.publication_date).getFullYear() : undefined),
                        jurisdiction: patent.jurisdiction || "US",
                        google_patents_url: patent.google_patents_url || patent.patent_link || `https://patents.google.com/patent/${patent.patent_id}`,
                        alignment_score: patent.alignment_score
                      }}
                      onDetails={() => handlePatentDetails(patent)}
                      onInventorClick={(inventor) => {
                        if (inventor.linkedin_url) {
                          // Open direct LinkedIn URL
                          window.open(inventor.linkedin_url, '_blank');
                        } else {
                          // Open LinkedIn search for the inventor with keyword from search query
                          const searchUrl = generateLinkedInSearchUrl(inventor.name, currentSearchQuery);
                          window.open(searchUrl, '_blank');
                        }
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Load More Button */}
              {hasMoreResults && (
                <div className="flex justify-center pt-6">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={loadMorePatents}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More Patents"}
                  </Button>
                </div>
              )}
              {/* Debug info */}
              <div className="text-xs text-muted-foreground text-center">
                Debug: hasMoreResults={hasMoreResults.toString()}, patents.length={patents.length}, loading={loading.toString()}
              </div>
            </>
          )}
        </div>
      </div>

      <PatentDrawer
        patent={selectedPatent ? {
          patent_id: selectedPatent.patent_id || selectedPatent.patent_number || selectedPatent.patent_link || "unknown",
          title: selectedPatent.title,
          abstract: selectedPatent.abstract || selectedPatent.snippet,
          assignee: selectedPatent.assignee,
          inventors: selectedPatent.inventors || parseInventors(selectedPatent.inventor),
          year: selectedPatent.year || (selectedPatent.publication_date ? new Date(selectedPatent.publication_date).getFullYear() : undefined),
          jurisdiction: selectedPatent.jurisdiction || "US",
          google_patents_url: selectedPatent.google_patents_url || selectedPatent.patent_link
        } : null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        searchQuery={currentSearchQuery}
      />
    </div>
  );
};

export default Search;
