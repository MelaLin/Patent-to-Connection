import * as React from "react";
import { Search, X, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveService } from "@/services/saveService";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [query, setQuery] = React.useState("");
  const [isSavingQuery, setIsSavingQuery] = React.useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleSaveQuery = async () => {
    if (!query.trim()) return;
    
    setIsSavingQuery(true);
    try {
      await saveService.saveQuery({ query: query.trim() });
      toast({
        title: "Query Saved",
        description: `Search query "${query.trim()}" has been saved.`,
      });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search patents (e.g., HVAC, solar panels, wind turbine)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-32 h-12 text-base"
          disabled={loading}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-24 h-6 w-6 p-0"
            onClick={() => setQuery("")}
            disabled={loading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="absolute right-16 h-10 px-3"
          onClick={handleSaveQuery}
          disabled={loading || isSavingQuery || !query.trim()}
        >
          <Bookmark className="h-4 w-4 mr-1" />
          {isSavingQuery ? "Saving..." : "Save Query"}
        </Button>
        <Button
          className="absolute right-1 h-10 px-4"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  );
}