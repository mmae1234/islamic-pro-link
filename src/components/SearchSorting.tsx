import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';

interface SearchSortingProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const SearchSorting = ({ sortBy, sortOrder, onSortChange }: SearchSortingProps) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'experience_years', label: 'Experience' },
    { value: 'created_at', label: 'Recently Joined' },
    { value: 'sector', label: 'Sector' },
    { value: 'country', label: 'Location' }
  ];

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <span className="text-sm font-medium text-foreground">Sort by:</span>
      
      <Select value={sortBy} onValueChange={(value) => onSortChange(value, sortOrder)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        className="flex items-center gap-2 hover:shadow-soft"
      >
        {sortOrder === 'asc' ? (
          <SortAsc className="w-4 h-4" />
        ) : (
          <SortDesc className="w-4 h-4" />
        )}
        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      </Button>
    </div>
  );
};

export default SearchSorting;