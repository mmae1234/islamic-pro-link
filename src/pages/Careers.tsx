import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Career Opportunities
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover career opportunities posted by the Muslim professional community.
            </p>
          </div>

          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-4">Coming Soon</h3>
              <p className="text-muted-foreground text-lg">
                We're working on bringing you the best career opportunities from the Muslim professional community. 
                This section will feature job postings, internships, and career development resources.
              </p>
              <p className="text-muted-foreground mt-4">
                Check back soon for exciting opportunities!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;