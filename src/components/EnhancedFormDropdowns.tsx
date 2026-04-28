import { useState, useEffect } from "react";
import {
  loadCountry,
  loadState,
  loadCity,
  type CountryItem,
  type StateItem,
  type CityItem,
} from "@/lib/csc-lazy";
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

// Comprehensive universities list from various global rankings
const UNIVERSITIES = [
  // US Universities (Top Tier)
  'Harvard University', 'Stanford University', 'Massachusetts Institute of Technology (MIT)', 
  'Yale University', 'Princeton University', 'Columbia University', 'University of Pennsylvania',
  'Cornell University', 'Dartmouth College', 'Brown University', 'University of Chicago',
  'Northwestern University', 'Duke University', 'Johns Hopkins University', 'Vanderbilt University',
  'Rice University', 'Washington University in St. Louis', 'University of Notre Dame',
  'University of California, Berkeley', 'University of California, Los Angeles (UCLA)',
  'University of Southern California (USC)', 'University of Michigan', 'University of Virginia',
  'Carnegie Mellon University', 'Emory University', 'Georgetown University', 'University of Rochester',
  'Tufts University', 'Boston University', 'New York University', 'Brandeis University',
  'Case Western Reserve University', 'Georgia Institute of Technology', 'University of North Carolina at Chapel Hill',
  'Wake Forest University', 'Tulane University', 'Boston College', 'College of William & Mary',
  'University of Texas at Austin', 'University of Wisconsin-Madison', 'University of Illinois at Urbana-Champaign',
  'Pennsylvania State University', 'University of Washington', 'University of California, San Diego',
  'University of California, Davis', 'University of California, Irvine', 'University of California, Santa Barbara',
  'University of Florida', 'Ohio State University', 'Purdue University', 'University of Minnesota',
  'Arizona State University', 'University of Arizona', 'University of Colorado Boulder',

  // UK Universities
  'University of Oxford', 'University of Cambridge', 'Imperial College London', 
  'London School of Economics and Political Science (LSE)', 'University College London (UCL)',
  'King\'s College London', 'University of Edinburgh', 'University of Manchester',
  'University of Warwick', 'University of Bristol', 'University of Glasgow', 'University of Birmingham',
  'University of Sheffield', 'University of Nottingham', 'University of Southampton', 'University of Leeds',
  'University of York', 'Lancaster University', 'University of Bath', 'University of Exeter',
  'Durham University', 'University of St Andrews', 'Queen Mary University of London',
  'University of Liverpool', 'Cardiff University', 'University of Newcastle', 'University of Surrey',

  // Canadian Universities
  'University of Toronto', 'McGill University', 'University of British Columbia', 'University of Alberta',
  'McMaster University', 'Université de Montréal', 'University of Waterloo', 'Queen\'s University',
  'University of Calgary', 'Simon Fraser University', 'University of Ottawa', 'Dalhousie University',
  'University of Western Ontario', 'University of Saskatchewan', 'University of Manitoba',
  'Carleton University', 'Concordia University', 'York University',

  // Australian Universities
  'University of Melbourne', 'Australian National University', 'University of Sydney', 
  'University of Queensland', 'University of New South Wales', 'Monash University',
  'University of Western Australia', 'University of Adelaide', 'University of Technology Sydney',
  'Macquarie University', 'Queensland University of Technology', 'Griffith University',
  'Deakin University', 'RMIT University', 'University of Wollongong',

  // European Universities
  'ETH Zurich', 'University of Zurich', 'Technical University of Munich', 'University of Amsterdam',
  'Delft University of Technology', 'KU Leuven', 'University of Copenhagen', 'Stockholm University',
  'University of Oslo', 'University of Helsinki', 'Karolinska Institute', 'Technical University of Denmark',
  'Université PSL (Paris)', 'Sorbonne University', 'École Polytechnique', 'Sciences Po',
  'University of Bologna', 'Sapienza University of Rome', 'Bocconi University',
  'University of Barcelona', 'Universidad Autónoma de Madrid', 'IE University',
  'Humboldt University of Berlin', 'University of Heidelberg', 'RWTH Aachen University',

  // Middle Eastern Universities
  'King Fahd University of Petroleum and Minerals (KFUPM)', 'King Saud University', 
  'King Abdulaziz University', 'American University of Beirut', 'University of Jordan',
  'Cairo University', 'American University in Cairo', 'Qatar University', 'United Arab Emirates University',
  'Khalifa University', 'American University of Sharjah', 'Istanbul Technical University',
  'Boğaziçi University', 'Middle East Technical University', 'Sabancı University',
  'Koç University', 'Bilkent University', 'Tel Aviv University', 'Hebrew University of Jerusalem',
  'Technion - Israel Institute of Technology', 'University of Tehran', 'Sharif University of Technology',

  // Asian Universities
  'National University of Singapore', 'Nanyang Technological University', 'University of Hong Kong',
  'Chinese University of Hong Kong', 'Hong Kong University of Science and Technology',
  'Seoul National University', 'Korea Advanced Institute of Science and Technology (KAIST)', 'Yonsei University',
  'Peking University', 'Tsinghua University', 'Fudan University', 'Shanghai Jiao Tong University',
  'Zhejiang University', 'University of Science and Technology of China', 'Nanjing University',
  'Indian Institute of Technology Bombay', 'Indian Institute of Technology Delhi', 
  'Indian Institute of Science Bangalore', 'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur', 'Indian Institute of Technology Madras',
  'University of Malaya', 'Universiti Kebangsaan Malaysia', 'Universiti Sains Malaysia',
  'Bandung Institute of Technology', 'University of Indonesia', 'Gadjah Mada University',
  'Lahore University of Management Sciences (LUMS)', 'University of the Punjab', 
  'Quaid-i-Azam University', 'National University of Sciences and Technology (NUST)',
  'University of Dhaka', 'Bangladesh University of Engineering and Technology',
  'University of Tokyo', 'Kyoto University', 'Osaka University', 'Tohoku University',
  'Tokyo Institute of Technology', 'Waseda University', 'Keio University',

  // African Universities
  'University of Cape Town', 'University of the Witwatersrand', 'Stellenbosch University',
  'University of KwaZulu-Natal', 'American University in Cairo',
  'Al-Azhar University', 'University of Lagos', 'University of Ibadan',
  'Makerere University', 'University of Nairobi', 'University of Ghana',

  // Latin American Universities
  'University of São Paulo', 'University of Campinas', 'Pontifical Catholic University of Chile',
  'University of Chile', 'Universidad Nacional Autónoma de México (UNAM)',
  'Tecnológico de Monterrey', 'Universidad de Buenos Aires', 'Universidad de los Andes (Colombia)',

  'Other'
].sort((a, b) => {
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
    'Database Administrator', 'Mobile App Developer', 'AI/ML Engineer', 'Cloud Architect',
    'Quality Assurance Engineer', 'Technical Writer', 'IT Support Specialist'
  ],
  'Healthcare & Medicine': [
    'Doctor', 'Nurse', 'Pharmacist', 'Dentist', 'Therapist', 'Surgeon',
    'Medical Technician', 'Healthcare Administrator', 'Medical Researcher', 'Radiologist',
    'Psychiatrist', 'Physical Therapist', 'Veterinarian', 'Physician Assistant',
    'Medical Laboratory Scientist', 'Respiratory Therapist', 'Occupational Therapist'
  ],
  'Finance & Banking': [
    'Financial Analyst', 'Investment Banker', 'Accountant', 'Financial Advisor',
    'Credit Analyst', 'Insurance Agent', 'Tax Consultant', 'Auditor',
    'Risk Manager', 'Portfolio Manager', 'Loan Officer', 'Wealth Manager',
    'Compliance Officer', 'Islamic Banking Specialist', 'Forex Trader'
  ],
  'Education': [
    'Teacher', 'Professor', 'Principal', 'Academic Coordinator', 'Researcher',
    'Educational Consultant', 'Curriculum Developer', 'School Counselor',
    'Librarian', 'Training Specialist', 'Instructional Designer', 'Academic Advisor',
    'Education Administrator', 'Tutor', 'Educational Psychologist'
  ],
  'Engineering': [
    'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
    'Aerospace Engineer', 'Environmental Engineer', 'Structural Engineer',
    'Industrial Engineer', 'Petroleum Engineer', 'Biomedical Engineer',
    'Nuclear Engineer', 'Marine Engineer', 'Mining Engineer', 'Materials Engineer'
  ],
  'Legal': [
    'Lawyer', 'Judge', 'Paralegal', 'Legal Consultant', 'Court Reporter',
    'Legal Secretary', 'Mediator', 'Legal Researcher', 'Patent Attorney',
    'Corporate Lawyer', 'Criminal Defense Attorney', 'Immigration Lawyer',
    'Family Law Attorney', 'Intellectual Property Lawyer', 'Islamic Law Expert'
  ],
  'Marketing & Sales': [
    'Marketing Manager', 'Sales Manager', 'Digital Marketing Specialist', 'Sales Representative',
    'Brand Manager', 'Social Media Manager', 'Content Creator', 'SEO Specialist',
    'Public Relations Specialist', 'Market Research Analyst', 'Account Manager',
    'Business Development Manager', 'E-commerce Manager', 'Growth Hacker'
  ],
  'Media & Communication': [
    'Journalist', 'Editor', 'Photographer', 'Videographer', 'Content Writer',
    'Communications Manager', 'Radio Host', 'TV Producer', 'Graphic Designer',
    'Copywriter', 'News Anchor', 'Documentary Filmmaker', 'Podcast Host',
    'Social Media Influencer', 'Voice Over Artist'
  ],
  'Arts & Design': [
    'Artist', 'Graphic Designer', 'Interior Designer', 'Fashion Designer',
    'Architect', 'Musician', 'Writer', 'Animator', 'Web Designer',
    'Product Designer', 'Art Director', 'Illustrator', 'Sculptor',
    'Calligrapher', 'Islamic Art Specialist'
  ],
  'Business & Management': [
    'Business Analyst', 'Project Manager', 'HR Manager', 'Operations Manager',
    'Consultant', 'Entrepreneur', 'Executive Assistant', 'Business Development Manager',
    'Strategy Consultant', 'Change Management Specialist', 'Process Improvement Specialist',
    'Supply Chain Manager', 'Quality Manager', 'Business Coach'
  ],
  'Construction & Trades': [
    'Plumber', 'Electrician', 'Carpenter', 'Mason', 'Painter', 'Roofer',
    'HVAC Technician', 'Construction Manager', 'Welder', 'Heavy Equipment Operator',
    'Crane Operator', 'Tiler', 'Glazier', 'Insulation Worker', 'Concrete Finisher'
  ],
  'Transportation & Logistics': [
    'Driver', 'Pilot', 'Logistics Coordinator', 'Supply Chain Manager',
    'Fleet Manager', 'Warehouse Manager', 'Delivery Driver', 'Ship Captain',
    'Air Traffic Controller', 'Freight Broker', 'Customs Broker', 'Dispatcher'
  ],
  'Hospitality & Tourism': [
    'Hotel Manager', 'Chef', 'Waiter/Waitress', 'Tour Guide', 'Event Planner',
    'Restaurant Manager', 'Travel Agent', 'Concierge', 'Bartender',
    'Housekeeping Manager', 'Banquet Manager', 'Front Desk Manager', 'Sommelier'
  ],
  'Sports & Fitness': [
    'Athlete', 'Coach', 'Personal Trainer', 'Sports Manager', 'Physiotherapist',
    'Sports Commentator', 'Fitness Instructor', 'Sports Photographer',
    'Sports Nutritionist', 'Athletic Trainer', 'Recreation Director', 'Referee'
  ],
  'Security & Safety': [
    'Security Guard', 'Police Officer', 'Firefighter', 'Security Manager',
    'Emergency Medical Technician', 'Safety Inspector', 'Private Investigator',
    'Cybersecurity Specialist', 'Loss Prevention Officer', 'Emergency Coordinator'
  ],
  'Islamic Services': [
    'Imam', 'Sheikh', 'Quran Teacher', 'Islamic Scholar', 'Mosque Administrator',
    'Islamic Counselor', 'Halal Food Inspector', 'Islamic Finance Advisor',
    'Religious Education Coordinator', 'Islamic Center Director', 'Chaplain',
    'Islamic Studies Professor', 'Quran Reciter', 'Islamic Calligrapher'
  ],
  'Agriculture & Environment': [
    'Farmer', 'Agricultural Engineer', 'Environmental Scientist', 'Forestry Specialist',
    'Veterinarian', 'Agricultural Inspector', 'Landscape Architect',
    'Environmental Consultant', 'Conservation Scientist', 'Food Scientist',
    'Horticulturist', 'Agricultural Technician', 'Wildlife Biologist'
  ],
  'Social Services': [
    'Social Worker', 'Community Organizer', 'Counselor', 'Case Manager',
    'Non-profit Director', 'Program Coordinator', 'Youth Worker',
    'Family Therapist', 'Substance Abuse Counselor', 'Mental Health Counselor',
    'Community Development Specialist', 'Refugee Resettlement Coordinator'
  ],
  'Retail & Customer Service': [
    'Shop Owner', 'Store Manager', 'Sales Associate', 'Customer Service Representative',
    'Cashier', 'Merchandiser', 'Inventory Manager', 'Visual Merchandiser',
    'Customer Success Manager', 'Retail Buyer', 'Store Supervisor'
  ],
  'Manufacturing': [
    'Production Manager', 'Quality Control Inspector', 'Machine Operator',
    'Manufacturing Engineer', 'Assembly Line Worker', 'Plant Manager',
    'Production Supervisor', 'Maintenance Technician', 'Industrial Designer',
    'Lean Manufacturing Specialist', 'Safety Coordinator'
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

export const CountrySelect = ({ value, onValueChange, placeholder = "Select country" }: CountrySelectProps) => {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadCountry()
      .then((mod) => {
        if (!mounted) return;
        const list = mod.getAllCountries().slice().sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load country list:", err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading countries…" : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {countries.map(country => (
          <SelectItem key={country.isoCode} value={country.name}>{country.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface StateProvinceSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  country: string;
  placeholder?: string;
}

export const StateProvinceSelect = ({ value, onValueChange, country, placeholder = "Select state/province" }: StateProvinceSelectProps) => {
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) { setStates([]); return; }
    let mounted = true;
    setLoading(true);
    Promise.all([loadCountry(), loadState()])
      .then(([CountryMod, StateMod]) => {
        if (!mounted) return;
        const countryData = CountryMod.getAllCountries().find(c => c.name === country);
        if (!countryData) { setStates([]); setLoading(false); return; }
        const list = StateMod.getStatesOfCountry(countryData.isoCode)
          .slice().sort((a, b) => a.name.localeCompare(b.name));
        setStates(list);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load state list:", err);
        setStates([]);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [country]);

  if (!country || (states.length === 0 && !loading)) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={country ? "No states available" : "Select country first"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{country ? "No states available" : "Select country first"}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading states…" : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {states.map(state => (
          <SelectItem key={state.isoCode} value={state.name}>{state.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface CitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  country: string;
  stateProvince: string;
  placeholder?: string;
}

export const CitySelect = ({ value, onValueChange, country, stateProvince, placeholder = "Select city" }: CitySelectProps) => {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country || !stateProvince) { setCities([]); return; }
    let mounted = true;
    setLoading(true);
    Promise.all([loadCountry(), loadState(), loadCity()]).then(([CountryMod, StateMod, CityMod]) => {
      if (!mounted) return;
      const countryData = CountryMod.getAllCountries().find(c => c.name === country);
      if (!countryData) { setCities([]); setLoading(false); return; }
      const stateData = StateMod.getStatesOfCountry(countryData.isoCode).find(s => s.name === stateProvince);
      if (!stateData) { setCities([]); setLoading(false); return; }
      const list = CityMod.getCitiesOfState(countryData.isoCode, stateData.isoCode)
        .slice().sort((a, b) => a.name.localeCompare(b.name));
      setCities(list);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [country, stateProvince]);

  if (!country || !stateProvince || (cities.length === 0 && !loading)) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={!country ? "Select country first" : !stateProvince ? "Select state/province first" : "No cities available"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{!country ? "Select country first" : !stateProvince ? "Select state/province first" : "No cities available"}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading cities…" : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {cities.map(city => (
          <SelectItem key={`${city.stateCode}-${city.name}`} value={city.name}>{city.name}</SelectItem>
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
        <SelectContent className="max-h-60 overflow-y-auto">
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