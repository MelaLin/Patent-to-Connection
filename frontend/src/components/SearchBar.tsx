import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search patents (e.g., HVAC, solar panels, wind turbine)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 h-12 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-16 h-6 w-6 p-0"
            onClick={() => setQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button className="absolute right-1 h-10 px-4">
          Search
        </Button>
      </div>
    </div>
  );
}