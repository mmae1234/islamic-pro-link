import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Cities grouped by state/province for major countries
const CITIES_BY_STATE: { [country: string]: { [state: string]: string[] } } = {
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno', 'Oakland', 'San Jose'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
    'Florida': ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Tallahassee'],
    'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
    'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing'],
    'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Glendale'],
    'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge'],
    'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
    'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
    'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'],
    'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
    'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
    'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
    'Minnesota': ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'],
    'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
    'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
    'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
    'Oregon': ['Portland', 'Eugene', 'Salem', 'Gresham'],
    'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
    'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'],
    'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
    'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'],
    'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
    'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
    'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
    'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
    'West Virginia': ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown'],
    'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
    'Idaho': ['Boise', 'Nampa', 'Pocatello', 'Idaho Falls'],
    'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua'],
    'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry'],
    'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland'],
    'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket'],
    'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
    'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown'],
    'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'],
    'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
    'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka'],
    'Vermont': ['Burlington', 'Essex', 'South Burlington', 'Colchester'],
    'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette']
  },
  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kitchener', 'Windsor', 'Kingston'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke'],
    'British Columbia': ['Vancouver', 'Victoria', 'Burnaby', 'Richmond', 'Surrey', 'Kelowna'],
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Medicine Hat'],
    'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson'],
    'Saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw'],
    'Nova Scotia': ['Halifax', 'Sydney', 'Dartmouth', 'Truro'],
    'New Brunswick': ['Saint John', 'Moncton', 'Fredericton', 'Dieppe'],
    'Newfoundland and Labrador': ['St. Johns', 'Mount Pearl', 'Corner Brook', 'Conception Bay South'],
    'Prince Edward Island': ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall'],
    'Northwest Territories': ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith'],
    'Yukon': ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction'],
    'Nunavut': ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake']
  },
  'Australia': {
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Maitland'],
    'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Frankston'],
    'Queensland': ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba'],
    'Western Australia': ['Perth', 'Fremantle', 'Bunbury', 'Geraldton', 'Kalgoorlie'],
    'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge'],
    'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie'],
    'Northern Territory': ['Darwin', 'Alice Springs', 'Palmerston', 'Katherine'],
    'Australian Capital Territory': ['Canberra']
  },
  'United Kingdom': {
    'England': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Sheffield', 'Leeds', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling'],
    'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey']
  },
  'Germany': {
    'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Würzburg', 'Regensburg'],
    'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg'],
    'Baden-Württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg'],
    'Lower Saxony': ['Hanover', 'Braunschweig', 'Oldenburg', 'Osnabrück'],
    'Hesse': ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt'],
    'Berlin': ['Berlin'],
    'Hamburg': ['Hamburg'],
    'Saxony': ['Dresden', 'Leipzig', 'Chemnitz'],
    'Rhineland-Palatinate': ['Mainz', 'Ludwigshafen', 'Koblenz'],
    'Schleswig-Holstein': ['Kiel', 'Lübeck', 'Flensburg'],
    'Brandenburg': ['Potsdam', 'Cottbus', 'Brandenburg an der Havel'],
    'Saxony-Anhalt': ['Magdeburg', 'Halle', 'Dessau-Roßlau'],
    'Thuringia': ['Erfurt', 'Jena', 'Gera'],
    'Bremen': ['Bremen', 'Bremerhaven'],
    'Saarland': ['Saarbrücken', 'Neunkirchen'],
    'Mecklenburg-Vorpommern': ['Rostock', 'Schwerin', 'Neubrandenburg']
  },
  'Pakistan': {
    'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Sialkot', 'Sargodha'],
    'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah'],
    'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Kohat', 'Bannu'],
    'Balochistan': ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar'],
    'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza'],
    'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Kotli'],
    'Islamabad Capital Territory': ['Islamabad']
  },
  'India': {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur']
  }
};

interface CitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  country?: string;
  stateProvince?: string;
  placeholder?: string;
}

export const CitySelect = ({ 
  value, 
  onValueChange, 
  country = '', 
  stateProvince = '', 
  placeholder = "Select city" 
}: CitySelectProps) => {
  const getCitiesForSelection = () => {
    if (!country || !stateProvince) return [];
    
    const countryData = CITIES_BY_STATE[country];
    if (!countryData) return [];
    
    return countryData[stateProvince] || [];
  };

  const cities = getCitiesForSelection();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={!country || !stateProvince}>
      <SelectTrigger>
        <SelectValue placeholder={
          !country ? "Select country first" : 
          !stateProvince ? "Select state/province first" : 
          placeholder
        } />
      </SelectTrigger>
      <SelectContent>
        {cities.map(city => (
          <SelectItem key={city} value={city}>{city}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};