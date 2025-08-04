import { useState, useMemo } from "react";
import ISO6391 from "iso-639-1";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced University data with global coverage
export const GLOBAL_UNIVERSITIES = [
  // Top US Universities
  'Harvard University', 'Stanford University', 'MIT', 'Yale University', 'Princeton University',
  'Columbia University', 'University of Pennsylvania', 'Cornell University', 'Dartmouth College',
  'Brown University', 'University of Chicago', 'Northwestern University', 'Duke University',
  'Johns Hopkins University', 'Vanderbilt University', 'Rice University', 'Washington University in St. Louis',
  'University of Notre Dame', 'University of California, Berkeley', 'UCLA', 'USC',
  'University of Michigan', 'University of Virginia', 'Carnegie Mellon University', 'Emory University',
  'Georgetown University', 'University of Rochester', 'Tufts University', 'Boston University',
  'New York University', 'Brandeis University', 'Case Western Reserve University',
  
  // UK Universities
  'University of Oxford', 'University of Cambridge', 'Imperial College London', 'London School of Economics',
  'University College London', 'King\'s College London', 'University of Edinburgh', 'University of Manchester',
  'University of Warwick', 'University of Bristol', 'University of Glasgow', 'University of Birmingham',
  'University of Sheffield', 'University of Nottingham', 'University of Southampton', 'University of Leeds',
  'University of York', 'Lancaster University', 'University of Bath', 'University of Exeter',
  
  // Canadian Universities
  'University of Toronto', 'McGill University', 'University of British Columbia', 'University of Alberta',
  'McMaster University', 'University of Montreal', 'University of Waterloo', 'Queen\'s University',
  'University of Calgary', 'Simon Fraser University', 'University of Ottawa', 'Dalhousie University',
  
  // Australian Universities
  'University of Melbourne', 'Australian National University', 'University of Sydney', 'University of Queensland',
  'University of New South Wales', 'Monash University', 'University of Western Australia', 'University of Adelaide',
  'University of Technology Sydney', 'Macquarie University', 'Queensland University of Technology',
  
  // European Universities
  'ETH Zurich', 'University of Zurich', 'Technical University of Munich', 'University of Amsterdam',
  'Delft University of Technology', 'KU Leuven', 'University of Copenhagen', 'Stockholm University',
  'University of Oslo', 'University of Helsinki', 'Karolinska Institute', 'Technical University of Denmark',
  'Sorbonne University', 'École Normale Supérieure', 'École Polytechnique', 'University of Bologna',
  'Sapienza University of Rome', 'Bocconi University', 'IE University', 'ESADE Business School',
  
  // Middle Eastern Universities
  'King Fahd University of Petroleum and Minerals', 'King Saud University', 'American University of Beirut',
  'University of Jordan', 'Cairo University', 'American University in Cairo', 'Qatar University',
  'United Arab Emirates University', 'Khalifa University', 'Istanbul Technical University',
  'Bogazici University', 'Middle East Technical University', 'Sabanci University', 'Bilkent University',
  'Tel Aviv University', 'Hebrew University of Jerusalem', 'Technion',
  
  // Asian Universities
  'National University of Singapore', 'Nanyang Technological University', 'University of Hong Kong',
  'Chinese University of Hong Kong', 'Seoul National University', 'KAIST', 'Yonsei University',
  'Peking University', 'Tsinghua University', 'Fudan University', 'Shanghai Jiao Tong University',
  'Indian Institute of Technology Bombay', 'Indian Institute of Technology Delhi', 'Indian Institute of Science',
  'University of Malaya', 'Universiti Kebangsaan Malaysia', 'Universiti Sains Malaysia',
  'Bandung Institute of Technology', 'University of Indonesia', 'Gadjah Mada University',
  'Lahore University of Management Sciences', 'University of the Punjab', 'Quaid-i-Azam University',
  'University of Dhaka', 'Bangladesh University of Engineering and Technology',
  'University of Tokyo', 'Kyoto University', 'Osaka University', 'Tohoku University',
  
  // African Universities
  'University of Cape Town', 'University of the Witwatersrand', 'Stellenbosch University',
  'Cairo University', 'Al-Azhar University', 'American University in Cairo',
  'University of Lagos', 'Obafemi Awolowo University', 'University of Ibadan',
  'Makerere University', 'University of Nairobi', 'University of Ghana',
  
  // Latin American Universities
  'Universidad de São Paulo', 'Universidade Estadual de Campinas', 'Universidad Nacional Autónoma de México',
  'Tecnológico de Monterrey', 'Universidad de Chile', 'Pontificia Universidad Católica de Chile',
  'Universidad de Buenos Aires', 'Universidad Nacional de Colombia',
  
  'Other'
];

// Get language options from ISO-639-1
export const LANGUAGES = (ISO6391.getAllNames() || []).map(name => ({
  code: ISO6391.getCode(name),
  name: name
})).filter(lang => lang.code && lang.name).sort((a, b) => a.name.localeCompare(b.name));

interface SearchableMultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: string[] | { code: string; name: string }[];
  placeholder?: string;
  maxSelections?: number;
  searchPlaceholder?: string;
}

export const SearchableMultiSelect = ({ 
  value = [], 
  onValueChange, 
  options = [], 
  placeholder = "Select options",
  maxSelections = 10,
  searchPlaceholder = "Search..."
}: SearchableMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];
  const safeOptions = Array.isArray(options) ? options : [];

  const isOptionObject = (option: any): option is { code: string; name: string } => {
    return typeof option === 'object' && 'code' in option && 'name' in option;
  };

  const filteredOptions = useMemo(() => {
    if (!safeOptions || !Array.isArray(safeOptions)) return [];
    const searchTerm = searchValue.toLowerCase();
    return safeOptions.filter(option => {
      if (isOptionObject(option)) {
        return option.name && option.name.toLowerCase().includes(searchTerm);
      }
      return option && option.toLowerCase().includes(searchTerm);
    });
  }, [safeOptions, searchValue]);

  const displayValue = (option: string | { code: string; name: string }) => {
    return isOptionObject(option) ? option.name : option;
  };

  const optionValue = (option: string | { code: string; name: string }) => {
    return isOptionObject(option) ? option.name : option;
  };

  const handleSelect = (selectedValue: string) => {
    if (!selectedValue) return;
    
    if (safeValue.includes(selectedValue)) {
      onValueChange(safeValue.filter(v => v !== selectedValue));
    } else if (safeValue.length < maxSelections) {
      onValueChange([...safeValue, selectedValue]);
    }
  };

  const removeValue = (valueToRemove: string) => {
    if (!valueToRemove) return;
    onValueChange(safeValue.filter(v => v !== valueToRemove));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {safeValue.length === 0 ? placeholder : `${safeValue.length} selected`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions && filteredOptions.length > 0 ? filteredOptions.map((option) => {
                const optValue = optionValue(option);
                const isSelected = safeValue.includes(optValue);
                return (
                  <CommandItem
                    key={optValue}
                    onSelect={() => handleSelect(optValue)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {displayValue(option)}
                  </CommandItem>
                );
              }) : null}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {safeValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeValue.map((selectedValue) => (
            <Badge key={selectedValue} variant="secondary" className="flex items-center gap-1">
              {selectedValue}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeValue(selectedValue)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

interface UniversitySearchSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export const UniversitySearchSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select universities",
  maxSelections = 3
}: UniversitySearchSelectProps) => {
  return (
    <SearchableMultiSelect
      value={value}
      onValueChange={onValueChange}
      options={GLOBAL_UNIVERSITIES}
      placeholder={placeholder}
      maxSelections={maxSelections}
      searchPlaceholder="Search universities..."
    />
  );
};

interface LanguageSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export const LanguageSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select languages",
  maxSelections = 4
}: LanguageSelectProps) => {
  return (
    <SearchableMultiSelect
      value={value}
      onValueChange={onValueChange}
      options={LANGUAGES}
      placeholder={placeholder}
      maxSelections={maxSelections}
      searchPlaceholder="Search languages..."
    />
  );
};