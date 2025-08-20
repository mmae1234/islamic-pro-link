import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, Zap } from "lucide-react";

const Donations = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Support Muslim Professionals
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us build a stronger platform for the Muslim professional community. 
              Your donations enable us to keep the platform free and continuously improve our services.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Our Mission
              </h2>
              <p className="text-muted-foreground">
                Muslim Professionals was created to help Muslim professionals connect, grow their careers, 
                and support each other in alignment with Islamic values. Every donation helps us 
                maintain this platform and develop new features to better serve our community.
              </p>
            </CardContent>
          </Card>

          {/* Impact Areas */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-soft">
              <CardHeader className="text-center">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Platform Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Improve existing features and develop new tools to help professionals connect and grow.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Provide free access to all features and support for Muslims worldwide to build their careers.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Research and implement cutting-edge features to keep Muslim Pros at the forefront of professional networking.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Donation Options */}
          <Card className="shadow-soft">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Make a Donation</CardTitle>
              <p className="text-muted-foreground">
                Choose an amount that works for you. Every contribution makes a difference.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['$10', '$25', '$50', '$100'].map((amount) => (
                  <Button 
                    key={amount} 
                    variant="outline" 
                    className="h-16 text-lg font-semibold hover:bg-primary hover:text-primary-foreground"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Donation processing will be available soon. We're working on integrating secure payment options.
                </p>
                <Button disabled className="bg-muted text-muted-foreground">
                  PayPal Integration Coming Soon
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Muslim Professionals is committed to transparency. All donations will be used exclusively 
                  for platform development and community support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact for Large Donations */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-2">
              Interested in making a larger contribution or becoming a sponsor?
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:contact@muslimprosnet.com">
                Contact Us
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donations;