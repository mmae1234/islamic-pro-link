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
];

const SECTORS = [
  'Technology', 'Finance & Banking', 'Healthcare & Medicine', 'Education', 'Engineering',
  'Marketing & Advertising', 'Consulting', 'Legal', 'Real Estate', 'Manufacturing',
  'Retail & E-commerce', 'Media & Entertainment', 'Non-profit', 'Government', 'Construction',
  'Transportation', 'Energy & Utilities', 'Agriculture', 'Hospitality & Tourism', 
  'Religious Services', 'Skilled Trades', 'Art & Design', 'Sports & Recreation',
  'Food & Beverage', 'Security', 'Research & Development', 'Social Services', 'Other'
];

const OCCUPATIONS = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'Marketing Manager', 'Financial Analyst',
  'Consultant', 'Doctor', 'Nurse', 'Teacher', 'Professor', 'Lawyer', 'Engineer',
  'Designer', 'Sales Manager', 'HR Manager', 'Business Analyst', 'Project Manager',
  'Entrepreneur', 'Researcher', 'Student', 'Imam', 'Sheikh', 'Quran Teacher',
  'Islamic Scholar', 'Plumber', 'Electrician', 'Carpenter', 'Mechanic', 'Chef',
  'Security Guard', 'Driver', 'Accountant', 'Pharmacist', 'Dentist', 'Therapist',
  'Social Worker', 'Journalist', 'Photographer', 'Artist', 'Musician', 'Athlete',
  'Taxi Driver', 'Shop Owner', 'Farmer', 'Cleaner', 'Waiter/Waitress', 'Other'
];

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
  onOtherSelected?: (value: string) => void;
}

export const OccupationSelect = ({ value, onValueChange, placeholder = "Select occupation", onOtherSelected }: OccupationSelectProps) => {
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
          {OCCUPATIONS.map(occupation => (
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