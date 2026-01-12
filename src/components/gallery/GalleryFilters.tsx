import React from 'react';
import { Search, SlidersHorizontal, SortAsc, Calendar, Tag, Grid3X3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type GallerySortOption = 'newest' | 'oldest' | 'name' | 'moves';
export type GalleryViewMode = 'grid' | 'list';

interface GalleryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: GallerySortOption;
  onSortChange: (sort: GallerySortOption) => void;
  viewMode: GalleryViewMode;
  onViewModeChange: (mode: GalleryViewMode) => void;
  totalResults: number;
}

export const GalleryFilters: React.FC<GalleryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
}) => {
  const sortOptions: { value: GallerySortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: 'Newest First', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'oldest', label: 'Oldest First', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'name', label: 'Name (A-Z)', icon: <Tag className="h-3.5 w-3.5" /> },
    { value: 'moves', label: 'Most Moves', icon: <SortAsc className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or players..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </div>

      {/* Sort Select */}
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as GallerySortOption)}>
        <SelectTrigger className="w-full sm:w-44 bg-card/50 border-border/50">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-card/50 border border-border/50 rounded-md p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      <Badge variant="secondary" className="hidden sm:flex">
        {totalResults} {totalResults === 1 ? 'vision' : 'visions'}
      </Badge>
    </div>
  );
};
