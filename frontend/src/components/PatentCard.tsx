import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Eye, Bookmark, Linkedin, Search } from "lucide-react";
import { useState } from "react";
import { saveService, PatentSaveData } from "@/services/saveService";
import { useToast } from "@/hooks/use-toast";

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

interface PatentCardProps {
  patent: Patent;
  onDetails: () => void;
  onInventorClick?: (inventor: { name: string; linkedin_url?: string }) => void;
}

export function PatentCard({ patent, onDetails, onInventorClick }: PatentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const abstractPreview = patent.abstract.slice(0, 250);
  const needsExpansion = patent.abstract.length > 250;

  const handleInventorClick = (inventor: { name: string; linkedin_url?: string }) => {
    if (onInventorClick) {
      onInventorClick(inventor);
    } else {
      // Fallback behavior if no callback provided
      if (inventor.linkedin_url) {
        window.open(inventor.linkedin_url, '_blank');
      }
    }
  };

  const handleSavePatent = async () => {
    setIsSaving(true);
    try {
      const patentData: PatentSaveData = {
        title: patent.title,
        abstract: patent.abstract,
        assignee: patent.assignee,
        inventors: patent.inventors,
        link: patent.google_patents_url,
        date_filed: patent.year ? new Date(patent.year, 0, 1).toISOString() : undefined,
      };

      const result = await saveService.savePatent(patentData);
      
      if (result.success) {
        setIsWatched(true);
        toast({
          title: "Saved to Watchlist",
          description: "Patent has been saved to your Watchlist.",
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save patent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save patent:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save patent",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveInventor = async (inventor: { name: string; linkedin_url?: string }) => {
    try {
      await saveService.saveInventor({
        name: inventor.name,
        linkedin_url: inventor.linkedin_url,
      });

      toast({
        title: "Inventor Saved",
        description: `${inventor.name} has been saved to your collection.`,
      });
    } catch (error) {
      console.error('Failed to save inventor:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save inventor",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="patent-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {patent.patent_id}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {patent.jurisdiction}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight hover:text-primary cursor-pointer transition-colors">
              {patent.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSavePatent}
            disabled={isSaving}
            className={isWatched ? "text-primary" : "text-muted-foreground"}
          >
            <Bookmark className={`h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Abstract */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expanded ? patent.abstract : abstractPreview}
            {!expanded && needsExpansion && "..."}
          </p>
          {needsExpansion && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Read more"}
            </Button>
          )}
        </div>

        {/* Inventors */}
        {patent.inventors && patent.inventors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inventors
            </p>
            <div className="flex flex-wrap gap-2">
              {patent.inventors.map((inventor, index) => (
                <div key={`${inventor.name}-${index}`} className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className="cursor-pointer transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-sm border-dashed border-primary/50 hover:border-primary"
                    onClick={() => handleInventorClick(inventor)}
                  >
                    <span className="flex items-center gap-1">
                      {inventor.name}
                      {inventor.linkedin_url ? (
                        <Linkedin className="h-3 w-3" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                    </span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveInventor(inventor)}
                    className="h-6 w-6 p-0 hover:bg-accent"
                  >
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click inventor names to view LinkedIn profiles or search for them
            </p>
          </div>
        )}

        {/* Assignee and Year */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="space-y-1">
            <p>
              <span className="font-medium text-foreground">{patent.assignee}</span>
            </p>
            <p>Filed in {patent.year}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button onClick={onDetails} variant="default" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Details
          </Button>
          <Button 
            onClick={handleSavePatent} 
            variant="outline" 
            size="sm"
            disabled={isSaving}
            className={isWatched ? "text-primary border-primary" : ""}
          >
            <Bookmark className={`mr-2 h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
            {isSaving ? "Saving..." : isWatched ? "Saved" : "Save Patent"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(patent.google_patents_url, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Patents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}