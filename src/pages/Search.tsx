import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, MapPin, Mail, Phone, Filter } from "lucide-react";

// Sample data for demonstration
const sampleProfessionals = [
  {
    id: 1,
    name: "Dr. Amina Hassan",
    title: "Senior Software Engineer",
    company: "Tech Corp",
    location: "Toronto, Canada",
    sector: "Technology",
    specialty: "Machine Learning",
    university: "University of Toronto",
    experience: "8 years",
    languages: ["English", "Arabic"],
    email: "amina.hassan@example.com",
    verified: true
  },
  {
    id: 2,
    name: "Omar Abdullah",
    title: "Marketing Director",
    company: "Global Marketing Inc",
    location: "London, UK",
    sector: "Marketing",
    specialty: "Digital Marketing",
    university: "London Business School",
    experience: "12 years",
    languages: ["English", "Urdu"],
    email: "omar.abdullah@example.com",
    verified: true
  },
  {
    id: 3,
    name: "Fatima Al-Zahra",
    title: "Financial Analyst",
    company: "Investment Bank",
    location: "Dubai, UAE",
    sector: "Finance",
    specialty: "Investment Analysis",
    university: "American University of Sharjah",
    experience: "6 years",
    languages: ["English", "Arabic"],
    email: "fatima.alzahra@example.com",
    verified: true
  }
];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [results, setResults] = useState(sampleProfessionals);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  const handleSearch = () => {
    // Simple search implementation
    let filteredResults = sampleProfessionals.filter(professional => {
      const matchesName = professional.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !selectedCountry || professional.location.includes(selectedCountry);
      const matchesSector = !selectedSector || professional.sector === selectedSector;
      
      return matchesName && matchesCountry && matchesSector;
    });
    
    setResults(filteredResults);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Muslim Professionals
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search and connect with Muslim professionals across various industries and locations worldwide.
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="search">Name or Keyword</Label>
                <Input
                  id="search"
                  placeholder="Search professionals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="UAE">United Arab Emirates</SelectItem>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sector</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sectors</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full" variant="hero">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                Map View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Search Results ({results.length} professionals found)
          </h2>

          {viewMode === "table" ? (
            <div className="grid gap-6">
              {results.map((professional) => (
                <Card key={professional.id} className="shadow-soft hover:shadow-elegant transition-smooth">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold">
                              {professional.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {professional.name}
                            </h3>
                            <p className="text-muted-foreground">{professional.title}</p>
                          </div>
                          {professional.verified && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {professional.location}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Company:</strong> {professional.company}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Sector:</strong> {professional.sector}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Experience:</strong> {professional.experience}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{professional.specialty}</Badge>
                          <Badge variant="outline">{professional.university}</Badge>
                          {professional.languages.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="hero" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="h-96 shadow-soft">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Map view will be implemented with React-Leaflet integration.
                    <br />
                    This will show professional locations on an interactive map.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;