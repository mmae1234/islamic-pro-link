import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Country, State, City } from 'country-state-city';

// Get all countries
const COUNTRIES = Country.getAllCountries().map(country => ({
  code: country.isoCode,
  name: country.name
}));

// Expanded global universities list
const UNIVERSITIES = [
  // Top Global Universities
  'MIT - Massachusetts Institute of Technology', 'Harvard University', 'Stanford University',
  'University of Cambridge', 'University of Oxford', 'California Institute of Technology',
  'ETH Zurich', 'Imperial College London', 'University College London', 'King\'s College London',
  'University of Toronto', 'McGill University', 'University of Melbourne', 'University of Sydney',
  'National University of Singapore', 'Nanyang Technological University', 'University of Hong Kong',
  
  // Middle East & Islamic Universities
  'American University of Beirut', 'Cairo University', 'King Abdulaziz University',
  'King Fahd University of Petroleum and Minerals', 'Qatar University', 'UAE University', 'Al-Azhar University',
  'Jordan University of Science and Technology', 'Kuwait University', 'University of Tehran',
  'Sharif University of Technology', 'Istanbul Technical University', 'Bogazici University',
  'Middle East Technical University', 'American University of Cairo', 'Lebanese American University',
  'University of Jordan', 'Birzeit University', 'An-Najah National University', 'Islamic University of Gaza',
  
  // South Asian Universities
  'University of Karachi', 'Lahore University of Management Sciences', 'Indian Institute of Technology Delhi',
  'Indian Institute of Technology Bombay', 'Indian Institute of Technology Madras', 'University of Delhi', 
  'Jawaharlal Nehru University', 'Aligarh Muslim University', 'Jamia Millia Islamia', 'University of Punjab',
  'Quaid-i-Azam University', 'National University of Sciences and Technology', 'Dhaka University', 
  'Bangladesh University of Engineering and Technology', 'Chittagong University', 'Rajshahi University',
  'University of Colombo', 'University of Peradeniya', 'University of Moratuwa',
  
  // European Universities
  'Sorbonne University', 'Technical University of Munich', 'KTH Royal Institute of Technology',
  'Delft University of Technology', 'University of Amsterdam', 'Utrecht University',
  'KU Leuven', 'Université catholique de Louvain', 'University of Copenhagen',
  'Stockholm University', 'University of Oslo', 'Norwegian University of Science and Technology',
  'Karolinska Institute', 'Lund University', 'University of Edinburgh', 'University of Manchester',
  'London School of Economics', 'University of Bristol', 'University of Warwick',
  
  // North American Universities  
  'University of California Berkeley', 'University of Michigan', 'Carnegie Mellon University',
  'Yale University', 'Princeton University', 'Columbia University', 'University of Pennsylvania',
  'Northwestern University', 'University of Chicago', 'Johns Hopkins University',
  'University of British Columbia', 'University of Waterloo', 'McMaster University',
  'University of California Los Angeles', 'University of California San Diego',
  'New York University', 'Boston University', 'Georgetown University',
  
  // African Universities
  'University of Cape Town', 'University of the Witwatersrand', 'Stellenbosch University',
  'Cairo University', 'Alexandria University', 'Ain Shams University', 'University of Khartoum',
  'Makerere University', 'University of Ghana', 'University of Ibadan', 'University of Lagos',
  'Addis Ababa University', 'University of Nairobi', 'University of Dar es Salaam',
  
  // Southeast Asian Universities
  'University of Malaya', 'Universiti Teknologi Malaysia', 'Universiti Putra Malaysia',
  'Universiti Kebangsaan Malaysia', 'Universiti Sains Malaysia', 'University of Indonesia',
  'Bandung Institute of Technology', 'Gadjah Mada University', 'Chulalongkorn University',
  'Mahidol University', 'National University of Singapore', 'Nanyang Technological University',
  
  // East Asian Universities
  'Tsinghua University', 'Peking University', 'Fudan University', 'Shanghai Jiao Tong University',
  'University of Tokyo', 'Kyoto University', 'Osaka University', 'Tohoku University',
  'Seoul National University', 'KAIST', 'Yonsei University', 'Korea University',
  
  // Australian Universities
  'Australian National University', 'Monash University', 'University of New South Wales',
  'University of Queensland', 'University of Adelaide', 'RMIT University', 'Griffith University',
  'Curtin University', 'Deakin University', 'La Trobe University',
  
  // Islamic Universities Worldwide
  'International Islamic University Malaysia', 'International Islamic University Islamabad',
  'Islamic University of Madinah', 'Umm Al-Qura University', 'King Saud University',
  'Islamic University of Technology', 'International Islamic University Chittagong',
  'Imam Muhammad ibn Saud Islamic University', 'Taibah University', 'Princess Nourah bint Abdulrahman University',
  
  'Other'
].sort((a, b) => {
  // Keep 'Other' at the end
  if (a === 'Other') return 1;
  if (b === 'Other') return -1;
  return a.localeCompare(b);
});

const SECTORS = [
  'Technology', 'Finance & Banking', 'Healthcare & Medicine', 'Education', 'Engineering',
  'Marketing & Advertising', 'Consulting', 'Legal', 'Real Estate', 'Manufacturing',
  'Retail & E-commerce', 'Media & Entertainment', 'Non-profit', 'Government', 'Construction',
  'Transportation', 'Energy & Utilities', 'Agriculture', 'Hospitality & Tourism', 
  'Religious Services', 'Skilled Trades', 'Art & Design', 'Sports & Recreation',
  'Food & Beverage', 'Security', 'Research & Development', 'Social Services', 'Other'
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
  'Other': ['Other']
};

const AVAILABILITIES = [
  'Weekdays', 'Weekends', 'Evenings', 'Flexible', 'Mornings only', 'Afternoons only', 'By appointment'
];

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string, code: string) => void;
  placeholder?: string;
}

export const CountrySelect = ({ value, onValueChange, placeholder = "Select country" }: CountrySelectProps) => (
  <Select value={value} onValueChange={(countryName) => {
    const country = COUNTRIES.find(c => c.name === countryName);
    onValueChange(countryName, country?.code || '');
  }}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {COUNTRIES.map(country => (
        <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface StateSelectProps {
  countryCode: string;
  value: string;
  onValueChange: (value: string, code: string) => void;
  placeholder?: string;
}

export const StateSelect = ({ countryCode, value, onValueChange, placeholder = "Select state/province" }: StateSelectProps) => {
  const states = State.getStatesOfCountry(countryCode);
  
  if (!countryCode || states.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select country first" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No states available</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={(stateName) => {
      const state = states.find(s => s.name === stateName);
      onValueChange(stateName, state?.isoCode || '');
    }}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {states.map(state => (
          <SelectItem key={state.isoCode} value={state.name}>{state.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface CitySelectProps {
  countryCode: string;
  stateCode: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const CitySelect = ({ countryCode, stateCode, value, onValueChange, placeholder = "Select city" }: CitySelectProps) => {
  const cities = City.getCitiesOfState(countryCode, stateCode);
  
  if (!countryCode || !stateCode || cities.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={stateCode ? "Select state first" : "Select country and state first"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No cities available</SelectItem>
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
        {cities.map(city => (
          <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

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
    } else {
      setShowOtherInput(false);
      onValueChange(selectedValue);
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
          {UNIVERSITIES.map(uni => (
            <SelectItem key={uni} value={uni}>{uni}</SelectItem>
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
            Add
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
  onOtherSelected?: (value: string) => void;
}

export const OccupationSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select occupation", 
  sector,
  disabled,
  onOtherSelected 
}: OccupationSelectProps) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

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

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      onValueChange(selectedValue);
    }
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onValueChange(otherValue.trim());
      if (onOtherSelected) {
        onOtherSelected(otherValue.trim());
      }
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
          {occupations.map(occupation => (
            <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showOtherInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter your occupation"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
          />
          <Button onClick={handleOtherSubmit} size="sm">
            Add
          </Button>
        </div>
      )}
    </div>
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
