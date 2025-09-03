import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatentCard } from "@/components/PatentCard";
import { PatentDrawer } from "@/components/PatentDrawer";
import { Trash2, Search, Plus, Linkedin, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveService, WatchlistData, SavedPatent, SavedQuery } from "@/services/saveService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const Watchlist = () => {
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [watchlistData, setWatchlistData] = useState<WatchlistData>({ patents: [], queries: [], inventors: [] });
  const [loading, setLoading] = useState(true);
  const [isCreatingQuery, setIsCreatingQuery] = useState(false);
  const [newQuery, setNewQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load watchlist data
  useEffect(() => {
    console.log('Watchlist component mounted, loading data...');
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      console.log('Loading watchlist...');
      const data = await saveService.getWatchlist();
      console.log('Watchlist data received:', data);
      console.log('Setting watchlist data with:', { patents: data.patents?.length || 0, queries: data.queries?.length || 0, inventors: data.inventors?.length || 0 });
      setWatchlistData(data);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "Failed to load watchlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatent = async (patentId: string) => {
    try {
      const result = await saveService.deletePatent(patentId);
      if (result.success) {
        toast({
          title: "Patent Deleted",
          description: "Patent has been removed from your watchlist.",
        });
        await loadWatchlist(); // Reload to update the list
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete patent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete patent:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete patent",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    try {
      const result = await saveService.deleteQuery(queryId);
      if (result.success) {
        toast({
          title: "Query Deleted",
          description: "Query has been removed from your watchlist.",
        });
        await loadWatchlist(); // Reload to update the list
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete query:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete query",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInventor = async (inventorId: string) => {
    try {
      const result = await saveService.deleteInventor(inventorId);
      if (result.success) {
        toast({
          title: "Inventor Deleted",
          description: "Inventor has been removed from your watchlist.",
        });
        await loadWatchlist(); // Reload to update the list
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete inventor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete inventor:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete inventor",
        variant: "destructive",
      });
    }
  };

  const handleRunSearch = (query: string) => {
    navigate('/search', { state: { searchQuery: query } });
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

  const handleCreateQuery = async () => {
    if (!newQuery.trim()) return;
    
    setIsCreatingQuery(true);
    try {
      const queryData = {
        query: newQuery.trim(),
        filters: {}
      };

      const result = await saveService.saveQuery(queryData);
      
      if (result.success) {
        toast({
          title: "Query Saved",
          description: `Search query "${newQuery.trim()}" has been saved.`,
        });
        setIsDialogOpen(false);
        setNewQuery("");
        // Reload watchlist to show the new query
        await loadWatchlist();
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
      setIsCreatingQuery(false);
    }
  };

  const handlePatentDetails = (patent: any) => {
    setSelectedPatent(patent);
    setDrawerOpen(true);
  };

  // Convert saved patent to patent card format
  const convertSavedPatentToCard = (savedPatent: SavedPatent) => {
    return {
      patent_id: `ID-${savedPatent.id}`,
      title: savedPatent.title,
      abstract: savedPatent.abstract,
      assignee: savedPatent.assignee,
      inventors: savedPatent.inventors,
      year: savedPatent.date_filed ? new Date(savedPatent.date_filed).getFullYear() : undefined,
      jurisdiction: "US",
      google_patents_url: savedPatent.link,
      savedDate: savedPatent.saved_at || savedPatent.created_at
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading watchlist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground">
          Manage your saved queries, patents, and inventors
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Query
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Search Query</DialogTitle>
                    <DialogDescription>
                      Save a search query to monitor for new patents.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-query">Search Query</Label>
                      <Input
                        id="new-query"
                        placeholder="e.g., solar panels, wind turbine, AI"
                        value={newQuery}
                        onChange={(e) => setNewQuery(e.target.value)}
                      />
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
                      onClick={handleCreateQuery}
                      disabled={isCreatingQuery || !newQuery.trim()}
                    >
                      {isCreatingQuery ? "Saving..." : "Save Query"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchlistData.queries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved queries yet. Create your first query to get started.
                </div>
              ) : (
                watchlistData.queries.map((query) => (
                  <div key={query.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{query.query}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteQuery(query.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-end pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRunSearch(query.query)}
                      >
                        Run Search
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saved Patents */}
        <Card className="patent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Patents
            </CardTitle>
            <CardDescription>
              Patents you've bookmarked for later review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchlistData.patents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved patents yet. Save patents from search results to see them here.
                </div>
              ) : (
                watchlistData.patents.map((savedPatent) => {
                  const patent = convertSavedPatentToCard(savedPatent);
                  return (
                    <div key={savedPatent.id} className="border rounded-lg p-4">
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
                            <span>Saved {new Date(patent.savedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePatent(savedPatent.id)}
                        >
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saved Inventors */}
        <Card className="patent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5" />
              Saved Inventors
            </CardTitle>
            <CardDescription>
              Inventors you've bookmarked for tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchlistData.inventors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved inventors yet. Save inventors from patent cards to see them here.
                </div>
              ) : (
                watchlistData.inventors.map((inventor) => (
                  <div key={inventor.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-medium text-sm leading-tight">{inventor.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Saved {new Date(inventor.created_at).toLocaleDateString()}</span>
                          {inventor.associated_patent_id && (
                            <>
                              <span>•</span>
                              <span>Patent: {inventor.associated_patent_id}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteInventor(inventor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {inventor.linkedin_url ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(inventor.linkedin_url, '_blank')}
                        >
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Use the associated patent's title as context for LinkedIn search
                            const contextKeyword = inventor.associated_patent_id ? "patent" : "inventor";
                            const searchUrl = generateLinkedInSearchUrl(inventor.name, contextKeyword);
                            window.open(searchUrl, '_blank');
                          }}
                        >
                          <Linkedin className="h-4 w-4 mr-2" />
                          Find on LinkedIn
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
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