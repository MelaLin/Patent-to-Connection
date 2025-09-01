import { useState } from "react";
import { Filter, Calendar, Building, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export function FilterBar() {
  const [yearRange, setYearRange] = useState([2020, 2024]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [jurisdiction, setJurisdiction] = useState("any");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const assigneeOptions = [
    "Apple Inc.",
    "Samsung Electronics", 
    "Tesla Motors",
    "Microsoft Corp.",
    "Google LLC",
    "Amazon.com Inc.",
    "Toyota Motor Corp.",
    "IBM Corporation"
  ];

  const handleAssigneeChange = (assignee: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignees([...selectedAssignees, assignee]);
    } else {
      setSelectedAssignees(selectedAssignees.filter(a => a !== assignee));
    }
  };

  const clearFilters = () => {
    setYearRange([2020, 2024]);
    setSelectedAssignees([]);
    setJurisdiction("any");
  };

  const activeFilterCount = 
    (yearRange[0] !== 2020 || yearRange[1] !== 2024 ? 1 : 0) +
    selectedAssignees.length +
    (jurisdiction !== "any" ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Filter Toggle and Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6" align="start">
              <div className="space-y-6">
                {/* Year Range */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Filing Year Range</label>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={yearRange}
                      onValueChange={setYearRange}
                      max={2024}
                      min={2000}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{yearRange[0]}</span>
                      <span>{yearRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Assignee Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Assignees</label>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {assigneeOptions.map((assignee) => (
                      <div key={assignee} className="flex items-center space-x-2">
                        <Checkbox
                          id={assignee}
                          checked={selectedAssignees.includes(assignee)}
                          onCheckedChange={(checked) => 
                            handleAssigneeChange(assignee, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={assignee}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {assignee}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jurisdiction */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Jurisdiction</label>
                  </div>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Jurisdiction</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                      <SelectItem value="EP">European Union (EP)</SelectItem>
                      <SelectItem value="CN">China (CN)</SelectItem>
                      <SelectItem value="JP">Japan (JP)</SelectItem>
                      <SelectItem value="KR">South Korea (KR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1">
                    Clear All
                  </Button>
                  <Button onClick={() => setFiltersOpen(false)} size="sm" className="flex-1">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filter Tags */}
          <div className="flex items-center gap-2">
            {selectedAssignees.map((assignee) => (
              <Badge key={assignee} variant="secondary" className="gap-1">
                {assignee}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAssigneeChange(assignee, false)}
                >
                  ×
                </Button>
              </Badge>
            ))}
            {jurisdiction !== "any" && (
              <Badge variant="secondary" className="gap-1">
                {jurisdiction}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setJurisdiction("any")}
                >
                  ×
                </Button>
              </Badge>
            )}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}