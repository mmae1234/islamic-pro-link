import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Users, 
  Globe, 
  Target,
  CheckCircle,
  Star
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About MuslimsPros
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Empowering the Muslim professional community through meaningful connections, 
              mentorship opportunities, and career advancement while staying true to our values.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  I created MuslimsPros while being unemployed, believing that the best thing I can do in my life right now is to help others, hoping that Allah accepts this from me.
                </p>
                
                <blockquote className="border-l-4 border-primary pl-6 mb-6 bg-muted/30 p-4 rounded-r-lg">
                  <p className="text-lg text-foreground font-medium mb-3 italic">
                    "A Muslim is a brother of another Muslim. … Whoever fulfills the needs of his brother, Allah will fulfill his needs; whoever removes the troubles of his brother, Allah will remove one of his troubles on the Day of Resurrection."
                  </p>
                  <cite className="text-sm text-muted-foreground font-normal">
                    — Prophet Muhammad (ﷺ) | Al-Bukhari and Muslim
                  </cite>
                </blockquote>
                
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  MuslimsPros is my way of applying this Hadith — a platform for Muslims to support, connect with, and uplift each other. We believe that faith and professional success go hand in hand, and our platform provides a space where professionals can build meaningful relationships while staying true to their Islamic values.
                </p>
                
                <Button variant="hero" size="lg">
                  Join Our Community
                </Button>
              </div>
              
              <div className="grid gap-6">
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Values-Driven</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Built on Islamic principles of brotherhood, integrity, and mutual support.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Global Reach</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Connecting Muslim professionals across continents and cultures.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary-glow" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Purpose-Driven</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Focused on meaningful professional growth and community building.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Growing Community
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of Muslim professionals who are building successful careers 
                and meaningful connections on our platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10K+</div>
                <div className="text-lg font-semibold text-foreground mb-2">Professionals</div>
                <div className="text-sm text-muted-foreground">Active members worldwide</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-accent mb-2">50+</div>
                <div className="text-lg font-semibold text-foreground mb-2">Countries</div>
                <div className="text-sm text-muted-foreground">Global representation</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary-glow mb-2">200+</div>
                <div className="text-lg font-semibold text-foreground mb-2">Industries</div>
                <div className="text-sm text-muted-foreground">Diverse professional fields</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">5K+</div>
                <div className="text-lg font-semibold text-foreground mb-2">Connections</div>
                <div className="text-sm text-muted-foreground">Successful professional matches</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose MuslimsPros?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We understand the unique challenges and opportunities facing Muslim professionals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Halal Environment",
                  description: "Professional networking that respects Islamic values and principles."
                },
                {
                  title: "Quality Connections",
                  description: "Connect with verified professionals who share your values and goals."
                },
                {
                  title: "Mentorship Programs",
                  description: "Access structured guidance from experienced Muslim professionals."
                },
                {
                  title: "Privacy Focused",
                  description: "Your privacy and personal information are protected with highest standards."
                },
                {
                  title: "Global Community",
                  description: "Network with professionals across different countries and cultures."
                },
                {
                  title: "Career Growth",
                  description: "Resources and opportunities to advance your professional journey."
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <Star className="w-12 h-12 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your Professional Network?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Join MuslimsPros today and connect with professionals who understand 
                your journey and share your values.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/search">Find Professionals</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">Join Our Community</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/donations">Support Our Mission</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;