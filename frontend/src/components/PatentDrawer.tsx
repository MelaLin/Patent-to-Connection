import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExternalLink, Bookmark, Bell, X, Linkedin, Search } from "lucide-react";

interface Patent {
  patent_id: string;
  title: string;
  abstract: string;
  assignee: string;
  inventors: { name: string; linkedin_url?: string }[];
  year: number;
  jurisdiction: string;
  google_patents_url: string;
}

interface PatentDrawerProps {
  patent: Patent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery?: string;
}

export function PatentDrawer({ patent, open, onOpenChange, searchQuery = "" }: PatentDrawerProps) {
  const [isWatched, setIsWatched] = React.useState(false);

  if (!patent) return null;

  const handleGooglePatentsClick = () => {
    if (patent.google_patents_url) {
      window.open(patent.google_patents_url, '_blank');
    }
  };

  const handleLinkedInClick = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
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

  const handleInventorClick = (inventor: { name: string; linkedin_url?: string }) => {
    if (inventor.linkedin_url) {
      // Open direct LinkedIn URL
      window.open(inventor.linkedin_url, '_blank');
    } else {
      // Open LinkedIn search for the inventor with keyword from search query
      const searchUrl = generateLinkedInSearchUrl(inventor.name, searchQuery);
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-2xl sm:max-w-2xl drawer-content overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {patent.patent_id}
                </Badge>
                <Badge variant="secondary">
                  {patent.jurisdiction}
                </Badge>
              </div>
              <SheetTitle className="text-xl leading-tight">
                {patent.title}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {patent.assignee} • Filed in {patent.year}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Abstract */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Abstract</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {patent.abstract}
            </p>
          </div>

          {/* Inventors */}
          {patent.inventors && patent.inventors.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Inventors</h3>
              <div className="space-y-3">
                {patent.inventors.map((inventor, index) => (
                  <div
                    key={`${inventor.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{inventor.name}</p>
                        <p className="text-xs text-muted-foreground">Inventor</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {inventor.linkedin_url ? (
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Search className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInventorClick(inventor)}
                      className="flex items-center gap-2"
                    >
                      {inventor.linkedin_url ? (
                        <>
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search LinkedIn
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click inventor names to view LinkedIn profiles or search for them
              </p>
            </div>
          )}

          {/* Assignee Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Assignee</h3>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{patent.assignee}</p>
              <p className="text-xs text-muted-foreground">Patent Owner</p>
            </div>
          </div>

          {/* Patent Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Patent Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Patent Number
                </p>
                <p className="font-mono text-sm">{patent.patent_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Jurisdiction
                </p>
                <p className="text-sm">{patent.jurisdiction}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Filing Year
                </p>
                <p className="text-sm">{patent.year}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </p>
                <Badge variant="outline" className="text-xs">
                  Published
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={isWatched ? "default" : "outline"}
                onClick={() => setIsWatched(!isWatched)}
                className="w-full"
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
                {isWatched ? "Added to Watchlist" : "Add to Watchlist"}
              </Button>
              <Button variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>
            
            {patent.google_patents_url && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleGooglePatentsClick}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Google Patents
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}