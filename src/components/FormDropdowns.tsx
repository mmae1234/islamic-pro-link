import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bahrain', 'Bangladesh',
  'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria', 'Canada', 'China',
  'Croatia', 'Denmark', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Italy', 'Jordan', 'Kazakhstan', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia',
  'Maldives', 'Morocco', 'Netherlands', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine',
  'Qatar', 'Russia', 'Saudi Arabia', 'Senegal', 'Somalia', 'South Africa', 'Spain', 'Sweden',
  'Switzerland', 'Syria', 'Tunisia', 'Turkey', 'UAE', 'United Kingdom', 'United States', 'Yemen'
];

const UNIVERSITIES = [
  'MIT - Massachusetts Institute of Technology', 'Harvard University', 'Stanford University',
  'University of Cambridge', 'University of Oxford', 'California Institute of Technology',
  'ETH Zurich', 'Imperial College London', 'University College London', 'King\'s College London',
  'University of Toronto', 'McGill University', 'University of Melbourne', 'University of Sydney',
  'National University of Singapore', 'Nanyang Technological University', 'University of Hong Kong',
  'American University of Beirut', 'Cairo University', 'King Abdulaziz University',
  'King Fahd University', 'Qatar University', 'UAE University', 'University of Karachi',
  'Lahore University of Management Sciences', 'Other'
];

const SECTORS = [
  'Technology', 'Finance & Banking', 'Healthcare & Medicine', 'Education', 'Engineering',
  'Marketing & Advertising', 'Consulting', 'Legal', 'Real Estate', 'Manufacturing',
  'Retail & E-commerce', 'Media & Entertainment', 'Non-profit', 'Government', 'Construction',
  'Transportation', 'Energy & Utilities', 'Agriculture', 'Hospitality & Tourism', 'Other'
];

const OCCUPATIONS = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'Marketing Manager', 'Financial Analyst',
  'Consultant', 'Doctor', 'Nurse', 'Teacher', 'Professor', 'Lawyer', 'Engineer',
  'Designer', 'Sales Manager', 'HR Manager', 'Business Analyst', 'Project Manager',
  'Entrepreneur', 'Researcher', 'Student', 'Other'
];

const AVAILABILITIES = [
  'Weekdays', 'Weekends', 'Evenings', 'Flexible', 'Mornings only', 'Afternoons only', 'By appointment'
];

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const CountrySelect = ({ value, onValueChange, placeholder = "Select country" }: CountrySelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {COUNTRIES.map(country => (
        <SelectItem key={country} value={country}>{country}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface UniversitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const UniversitySelect = ({ value, onValueChange, placeholder = "Select university" }: UniversitySelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {UNIVERSITIES.map(uni => (
        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface SectorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const SectorSelect = ({ value, onValueChange, placeholder = "Select sector" }: SectorSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {SECTORS.map(sector => (
        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface OccupationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const OccupationSelect = ({ value, onValueChange, placeholder = "Select occupation" }: OccupationSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {OCCUPATIONS.map(occupation => (
        <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface AvailabilitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const AvailabilitySelect = ({ value, onValueChange, placeholder = "Select availability" }: AvailabilitySelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {AVAILABILITIES.map(availability => (
        <SelectItem key={availability} value={availability}>{availability}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);