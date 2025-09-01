import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Eye, Share, Bookmark } from "lucide-react";
import { useState } from "react";

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
}

export function PatentCard({ patent, onDetails }: PatentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const abstractPreview = patent.abstract.slice(0, 250);
  const needsExpansion = patent.abstract.length > 250;

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
            onClick={() => setIsWatched(!isWatched)}
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
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Inventors
          </p>
          <div className="flex flex-wrap gap-2">
            {patent.inventors.map((inventor) => (
              <Badge
                key={inventor.name}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => inventor.linkedin_url && window.open(inventor.linkedin_url, '_blank')}
              >
                {inventor.name}
                {inventor.linkedin_url && (
                  <ExternalLink className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

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
            onClick={() => setIsWatched(!isWatched)} 
            variant="outline" 
            size="sm"
            className={isWatched ? "text-primary border-primary" : ""}
          >
            <Bookmark className={`mr-2 h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
            {isWatched ? "Watching" : "Watch"}
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
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