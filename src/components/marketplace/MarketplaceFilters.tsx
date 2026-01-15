import React from 'react';
import { Search, SlidersHorizontal, SortAsc, Crown, Gift, Calendar, TrendingUp, Tag, Gem, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'score' | 'name';
export type CategoryFilter = 'all' | 'premium' | 'genesis' | 'free' | 'paid';

interface MarketplaceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  showGenesisOnly: boolean;
  onGenesisToggle: (show: boolean) => void;
  totalResults: number;
  totalMarketVisions?: number;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  category,
  onCategoryChange,
  showGenesisOnly,
  onGenesisToggle,
  totalResults,
  totalMarketVisions,
}) => {
  const gameArtImages = useRandomGameArt(2);
  
  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: 'Newest First', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'oldest', label: 'Oldest First', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'price-low', label: 'Price: Low to High', icon: <SortAsc className="h-3.5 w-3.5" /> },
    { value: 'price-high', label: 'Price: High to Low', icon: <SortAsc className="h-3.5 w-3.5 rotate-180" /> },
    { value: 'score', label: 'Vision Score', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: 'name', label: 'Name (A-Z)', icon: <Tag className="h-3.5 w-3.5" /> },
  ];

  const categoryOptions: { value: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Visions', icon: null },
    { value: 'premium', label: 'Premium', icon: <Gem className="h-3.5 w-3.5 text-amber-500" /> },
    { value: 'genesis', label: 'Genesis', icon: <Sparkles className="h-3.5 w-3.5 text-violet-500" /> },
    { value: 'free', label: 'Free Gifts', icon: <Gift className="h-3.5 w-3.5 text-green-500" /> },
    { value: 'paid', label: 'For Sale', icon: <Tag className="h-3.5 w-3.5 text-primary" /> },
  ];

  return (
    <div 
      className="space-y-4 p-4 rounded-xl border border-border/50 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.88) 100%), url(${gameArtImages[0]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, player, or creator..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card/80 border-border/50 backdrop-blur-sm"
          />
        </div>

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48 bg-card/50 border-border/50">
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

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 bg-card/50 border-border/50">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filters</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified-only"
                  checked={showGenesisOnly}
                  onCheckedChange={(checked) => onGenesisToggle(checked as boolean)}
                />
                <Label htmlFor="certified-only" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Gem className="h-4 w-4 text-amber-500" />
                  Certified Only (Premium + Genesis)
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Tabs - Horizontally scrollable on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide snap-x snap-mandatory shrink-0">
          {categoryOptions.map((option) => (
            <Button
              key={option.value}
              variant={category === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(option.value)}
              className={`gap-1.5 shrink-0 snap-start ${category === option.value ? '' : 'bg-card/80 border-border/50 backdrop-blur-sm'}`}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
        
        {/* Results count */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          {totalMarketVisions !== undefined && totalMarketVisions > 0 && (
            <Badge variant="outline" className="backdrop-blur-sm bg-primary/10 border-primary/30 text-primary whitespace-nowrap">
              {totalMarketVisions.toLocaleString()} total visions
            </Badge>
          )}
          <Badge variant="secondary" className="backdrop-blur-sm whitespace-nowrap">
            {totalResults} {totalResults === 1 ? 'listed' : 'listed'}
          </Badge>
        </div>
      </div>
    </div>
  );
};
