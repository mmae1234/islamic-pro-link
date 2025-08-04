import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelect, SectorSelect, OccupationSelect } from "@/components/EnhancedFormDropdowns";
import { StateProvinceSelect } from "@/components/StateProvinceSelect";
import { UniversitySearchSelect, LanguageSelect } from "@/components/SearchableMultiSelect";
import { X, Filter, Search } from "lucide-react";

const SKILLS_OPTIONS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Digital Marketing',
  'Project Management', 'Data Analysis', 'UI/UX Design', 'Cloud Computing', 'Finance',
  'Healthcare', 'Education', 'Consulting', 'Sales', 'HR', 'Legal', 'Engineering'
];

interface MentorshipSearchFiltersProps {
  onSearch: (filters: any) => void;
  loading?: boolean;
}

const MentorshipSearchFilters = ({ onSearch, loading = false }: MentorshipSearchFiltersProps) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    country: 'all',
    stateProvince: 'all',
    sector: 'all',
    occupation: 'all',
    universities: [] as string[],
    languages: [] as string[],
    skills: [] as string[],
    gender: 'all',
    isMentor: false,
    isSeekingMentor: false,
    experienceMin: '',
    experienceMax: ''
  });

  const addSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      country: 'all',
      stateProvince: 'all',
      sector: 'all',
      occupation: 'all',
      universities: [],
      languages: [],
      skills: [],
      gender: 'all',
      isMentor: false,
      isSeekingMentor: false,
      experienceMin: '',
      experienceMax: ''
    });
  };

  return (
    <Card className="shadow-soft hover-lift transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="p-2 rounded-lg bg-primary/10">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search">Name or Keyword</Label>
            <Input
              id="search"
              placeholder="Search mentors..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>Country</Label>
            <CountrySelect
              value={filters.country === 'all' ? '' : filters.country}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                country: value || 'all',
                stateProvince: 'all' // Reset state when country changes
              }))}
              placeholder="All Countries"
            />
          </div>

          <div>
            <Label>State/Province</Label>
            <StateProvinceSelect
              value={filters.stateProvince === 'all' ? '' : filters.stateProvince}
              onValueChange={(value) => setFilters(prev => ({ ...prev, stateProvince: value || 'all' }))}
              country={filters.country === 'all' ? '' : filters.country}
              disabled={filters.country === 'all'}
              placeholder="All States"
            />
          </div>

          <div>
            <Label>Sector</Label>
            <SectorSelect 
              value={filters.sector === 'all' ? '' : filters.sector} 
              onValueChange={(value) => {
                setFilters(prev => ({ 
                  ...prev, 
                  sector: value || 'all',
                  occupation: 'all' // Reset occupation when sector changes
                }));
              }}
              placeholder="All Sectors"
            />
          </div>

          <div>
            <Label>Occupation</Label>
            <OccupationSelect 
              value={filters.occupation === 'all' ? '' : filters.occupation} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, occupation: value || 'all' }))}
              sector={filters.sector === 'all' ? '' : filters.sector}
              disabled={filters.sector === 'all'}
              placeholder="All Occupations"
            />
          </div>
        </div>

        {/* University, Language, and Gender Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Universities</Label>
            <UniversitySearchSelect
              value={filters.universities}
              onValueChange={(value) => setFilters(prev => ({ ...prev, universities: value }))}
              placeholder="Select universities"
              maxSelections={3}
            />
          </div>
          
          <div>
            <Label>Languages</Label>
            <LanguageSelect
              value={filters.languages}
              onValueChange={(value) => setFilters(prev => ({ ...prev, languages: value }))}
              placeholder="Select languages"
              maxSelections={4}
            />
          </div>

          <div>
            <Label>Gender</Label>
            <Select 
              value={filters.gender === 'all' ? '' : filters.gender} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value || 'all' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills Filter */}
        <div>
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SKILLS_OPTIONS.map(skill => (
              <Badge
                key={skill}
                variant={filters.skills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20"
                onClick={() => addSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
          {filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {filters.skills.map(skill => (
                <Badge key={skill} className="flex items-center gap-1">
                  {skill}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Mentorship Type */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMentor"
              checked={filters.isMentor}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isMentor: checked as boolean }))}
            />
            <Label htmlFor="isMentor">Looking for mentors</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isSeekingMentor"
              checked={filters.isSeekingMentor}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isSeekingMentor: checked as boolean }))}
            />
            <Label htmlFor="isSeekingMentor">Available mentors</Label>
          </div>
        </div>

        {/* Experience Range */}
        <div>
          <Label>Years of Experience</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Min"
              type="number"
              value={filters.experienceMin}
              onChange={(e) => setFilters(prev => ({ ...prev, experienceMin: e.target.value }))}
            />
            <Input
              placeholder="Max"
              type="number"
              value={filters.experienceMax}
              onChange={(e) => setFilters(prev => ({ ...prev, experienceMax: e.target.value }))}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleSearch} 
            className="flex-1 hover:shadow-elegant" 
            disabled={loading}
            variant="accent"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Search Mentors'}
          </Button>
          <Button variant="outline" onClick={clearFilters} className="hover:shadow-soft">
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorshipSearchFilters;