import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bahrain', 'Bangladesh',
  'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria', 'Canada', 'China', 'Croatia',
  'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Ghana', 'Greece',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Italy', 'Japan',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia', 'Morocco',
  'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal', 'Singapore',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
  'Thailand', 'Tunisia', 'Turkey', 'UAE', 'Ukraine', 'United Kingdom', 'United States', 'Uzbekistan',
  'Venezuela', 'Vietnam', 'Yemen'
];

const UNIVERSITIES = [
  // US Universities
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
  
  // Middle Eastern Universities
  'King Fahd University of Petroleum and Minerals', 'King Saud University', 'American University of Beirut',
  'University of Jordan', 'Cairo University', 'American University in Cairo', 'Qatar University',
  'United Arab Emirates University', 'Khalifa University', 'Istanbul Technical University',
  'Bogazici University', 'Middle East Technical University', 'Sabanci University',
  
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
  
  'Other'
].sort((a, b) => {
  // Keep 'Other' at the end
  if (a === 'Other') return 1;
  if (b === 'Other') return -1;
  return a.localeCompare(b);
});

const SECTORS = [
  'Technology', 'Finance & Banking', 'Healthcare & Medicine', 'Education', 'Engineering',
  'Legal', 'Marketing & Sales', 'Media & Communication', 'Arts & Design', 'Business & Management',
  'Construction & Trades', 'Transportation & Logistics', 'Hospitality & Tourism', 'Sports & Fitness',
  'Security & Safety', 'Islamic Services', 'Agriculture & Environment', 'Social Services',
  'Retail & Customer Service', 'Manufacturing', 'Other'
];

const SECTOR_OCCUPATIONS: Record<string, string[]> = {
  'Technology': [
    'Software Engineer', 'Data Scientist', 'Product Manager', 'Web Developer', 
    'DevOps Engineer', 'UI/UX Designer', 'Systems Administrator', 'Cybersecurity Analyst',
    'Database Administrator', 'Mobile App Developer', 'AI/ML Engineer', 'Cloud Architect'
  ],
  'Healthcare & Medicine': [
    'Doctor', 'Nurse', 'Pharmacist', 'Dentist', 'Therapist', 'Surgeon',
    'Medical Technician', 'Healthcare Administrator', 'Medical Researcher', 'Radiologist',
    'Psychiatrist', 'Physical Therapist', 'Veterinarian'
  ],
  'Finance & Banking': [
    'Financial Analyst', 'Investment Banker', 'Accountant', 'Financial Advisor',
    'Credit Analyst', 'Insurance Agent', 'Tax Consultant', 'Auditor',
    'Risk Manager', 'Portfolio Manager', 'Loan Officer'
  ],
  'Education': [
    'Teacher', 'Professor', 'Principal', 'Academic Coordinator', 'Researcher',
    'Educational Consultant', 'Curriculum Developer', 'School Counselor',
    'Librarian', 'Training Specialist'
  ],
  'Engineering': [
    'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
    'Aerospace Engineer', 'Environmental Engineer', 'Structural Engineer',
    'Industrial Engineer', 'Petroleum Engineer', 'Biomedical Engineer'
  ],
  'Legal': [
    'Lawyer', 'Judge', 'Paralegal', 'Legal Consultant', 'Court Reporter',
    'Legal Secretary', 'Mediator', 'Legal Researcher', 'Patent Attorney'
  ],
  'Marketing & Advertising': [
    'Marketing Manager', 'Advertising Executive', 'Digital Marketing Specialist', 'Brand Manager',
    'Social Media Manager', 'Content Creator', 'SEO Specialist', 'PPC Specialist',
    'Public Relations Specialist', 'Market Research Analyst', 'Creative Director', 'Copywriter'
  ],
  'Marketing & Sales': [
    'Marketing Manager', 'Sales Manager', 'Digital Marketing Specialist', 'Sales Representative',
    'Brand Manager', 'Social Media Manager', 'Content Creator', 'SEO Specialist',
    'Public Relations Specialist', 'Market Research Analyst'
  ],
  'Media & Communication': [
    'Journalist', 'Editor', 'Photographer', 'Videographer', 'Content Writer',
    'Communications Manager', 'Radio Host', 'TV Producer', 'Graphic Designer'
  ],
  'Arts & Design': [
    'Artist', 'Graphic Designer', 'Interior Designer', 'Fashion Designer',
    'Architect', 'Musician', 'Writer', 'Animator', 'Web Designer'
  ],
  'Business & Management': [
    'Business Analyst', 'Project Manager', 'HR Manager', 'Operations Manager',
    'Consultant', 'Entrepreneur', 'Executive Assistant', 'Business Development Manager'
  ],
  'Construction & Trades': [
    'Plumber', 'Electrician', 'Carpenter', 'Mason', 'Painter', 'Roofer',
    'HVAC Technician', 'Construction Manager', 'Welder', 'Heavy Equipment Operator'
  ],
  'Transportation & Logistics': [
    'Driver', 'Pilot', 'Logistics Coordinator', 'Supply Chain Manager',
    'Fleet Manager', 'Warehouse Manager', 'Delivery Driver', 'Ship Captain'
  ],
  'Hospitality & Tourism': [
    'Hotel Manager', 'Chef', 'Waiter/Waitress', 'Tour Guide', 'Event Planner',
    'Restaurant Manager', 'Travel Agent', 'Concierge', 'Bartender'
  ],
  'Sports & Fitness': [
    'Athlete', 'Coach', 'Personal Trainer', 'Sports Manager', 'Physiotherapist',
    'Sports Commentator', 'Fitness Instructor', 'Sports Photographer'
  ],
  'Security & Safety': [
    'Security Guard', 'Police Officer', 'Firefighter', 'Security Manager',
    'Emergency Medical Technician', 'Safety Inspector', 'Private Investigator'
  ],
  'Islamic Services': [
    'Imam', 'Sheikh', 'Quran Teacher', 'Islamic Scholar', 'Mosque Administrator',
    'Islamic Counselor', 'Halal Food Inspector', 'Islamic Finance Advisor'
  ],
  'Agriculture & Environment': [
    'Farmer', 'Agricultural Engineer', 'Environmental Scientist', 'Forestry Specialist',
    'Veterinarian', 'Agricultural Inspector', 'Landscape Architect'
  ],
  'Social Services': [
    'Social Worker', 'Community Organizer', 'Counselor', 'Case Manager',
    'Non-profit Director', 'Program Coordinator', 'Youth Worker'
  ],
  'Retail & Customer Service': [
    'Shop Owner', 'Store Manager', 'Sales Associate', 'Customer Service Representative',
    'Cashier', 'Merchandiser', 'Inventory Manager'
  ],
  'Manufacturing': [
    'Production Manager', 'Quality Control Inspector', 'Machine Operator',
    'Manufacturing Engineer', 'Assembly Line Worker', 'Plant Manager'
  ],
  'Consulting': [
    'Management Consultant', 'Strategy Consultant', 'IT Consultant', 'Financial Consultant',
    'Business Consultant', 'HR Consultant', 'Marketing Consultant', 'Operations Consultant'
  ],
  'Real Estate': [
    'Real Estate Agent', 'Property Manager', 'Real Estate Developer', 'Real Estate Broker',
    'Property Appraiser', 'Leasing Consultant', 'Real Estate Investor', 'Property Inspector'
  ],
  'Retail & E-commerce': [
    'Store Manager', 'E-commerce Manager', 'Retail Sales Associate', 'Merchandiser',
    'Product Manager', 'Customer Service Representative', 'Inventory Manager', 'Buyer'
  ],
  'Media & Entertainment': [
    'Film Director', 'Actor', 'Producer', 'Sound Engineer', 'Video Editor',
    'Media Planner', 'Entertainment Manager', 'Scriptwriter', 'Cinematographer'
  ],
  'Non-Profit': [
    'Program Manager', 'Fundraising Coordinator', 'Community Outreach Specialist',
    'Grant Writer', 'Volunteer Coordinator', 'Non-Profit Director', 'Social Impact Manager'
  ],
  'Government': [
    'Civil Servant', 'Policy Analyst', 'Government Administrator', 'Public Affairs Specialist',
    'Legislative Assistant', 'City Planner', 'Government Contractor', 'Diplomat'
  ],
  'Construction': [
    'Project Manager', 'Site Supervisor', 'Architect', 'Civil Engineer',
    'Construction Worker', 'Estimator', 'Safety Manager', 'Foreman'
  ],
  'Transportation': [
    'Truck Driver', 'Logistics Coordinator', 'Fleet Manager', 'Dispatcher',
    'Airline Pilot', 'Ship Captain', 'Transportation Planner', 'Delivery Driver'
  ],
  'Energy & Utilities': [
    'Power Plant Operator', 'Electrical Engineer', 'Energy Analyst', 'Utility Worker',
    'Renewable Energy Specialist', 'Grid Operator', 'Energy Consultant', 'Technician'
  ],
  'Agriculture': [
    'Farmer', 'Agricultural Scientist', 'Farm Manager', 'Agricultural Inspector',
    'Crop Specialist', 'Livestock Manager', 'Agricultural Engineer', 'Food Scientist'
  ],
  'Religious Services': [
    'Imam', 'Religious Teacher', 'Chaplain', 'Religious Counselor',
    'Mosque Administrator', 'Islamic Scholar', 'Religious Writer', 'Community Leader'
  ],
  'Skilled Trades': [
    'Electrician', 'Plumber', 'Carpenter', 'Welder', 'HVAC Technician',
    'Auto Mechanic', 'Painter', 'Roofer', 'Mason', 'Heavy Equipment Operator'
  ],
  'Art & Design': [
    'Graphic Designer', 'UI/UX Designer', 'Interior Designer', 'Fashion Designer',
    'Illustrator', 'Photographer', 'Web Designer', 'Product Designer', 'Art Director'
  ],
  'Sports & Recreation': [
    'Professional Athlete', 'Sports Coach', 'Personal Trainer', 'Sports Manager',
    'Fitness Instructor', 'Sports Commentator', 'Recreation Director', 'Athletic Trainer'
  ],
  'Food & Beverage': [
    'Chef', 'Restaurant Manager', 'Food Service Worker', 'Barista',
    'Food Inspector', 'Nutritionist', 'Catering Manager', 'Sommelier'
  ],
  'Security': [
    'Security Guard', 'Security Manager', 'Cybersecurity Analyst', 'Private Investigator',
    'Loss Prevention Specialist', 'Security Consultant', 'Surveillance Operator'
  ],
  'Research & Development': [
    'Research Scientist', 'R&D Engineer', 'Lab Technician', 'Product Developer',
    'Clinical Research Associate', 'Data Analyst', 'Innovation Manager', 'Research Director'
  ],
  'Other': ['Other']
};

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

export const UniversitySelect = ({ value, onValueChange, placeholder = "Select university" }: UniversitySelectProps) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setShowOtherInput(true);
      setOtherValue(value === 'Other' || UNIVERSITIES.includes(value) ? '' : value);
    } else {
      onValueChange(selectedValue);
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onValueChange(otherValue.trim());
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  return (
    <div className="space-y-2">
      <Select value={showOtherInput ? 'Other' : value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {UNIVERSITIES.map(university => (
            <SelectItem key={university} value={university}>{university}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showOtherInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter your university"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
          />
          <Button onClick={handleOtherSubmit} size="sm">
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

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
  sector?: string;
  disabled?: boolean;
}

export const OccupationSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select occupation", 
  sector,
  disabled
}: OccupationSelectProps) => {
  const occupations = sector ? SECTOR_OCCUPATIONS[sector] || [] : [];
  
  if (disabled || !sector) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={sector ? placeholder : "Select sector first"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select sector first</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {occupations.map(occupation => (
          <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

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
