import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { setSEOTitle, setSEOMeta } from "@/lib/utils";
import { useEffect } from "react";
import { 
  Heart, 
  Users, 
  Globe, 
  Target,
  CheckCircle,
  Star,
  Network,
  Handshake,
  BookOpen,
  Building,
  Award,
  MessageCircle
} from "lucide-react";

const About = () => {
  const { user } = useAuth();

  useEffect(() => {
    setSEOTitle("About Us - Muslim Professionals Network | Our Story & Mission");
    setSEOMeta("description", "Learn about Muslim Professionals Network's mission to empower Muslims in building meaningful careers while staying true to Islamic values. Discover our story and community features.");
    setSEOMeta("keywords", "Muslim Professionals Network about, Islamic networking story, Muslim career platform mission, halal professional community");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 sm:py-20 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              About Muslim Professionals Network
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed">
              Muslim Professionals Network empowers Muslims to build meaningful careers while staying 
              true to their faith. We provide a community where mentorship, collaboration, and professional 
              growth are aligned with Islamic values.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Our Story
              </h2>
              
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                <p className="text-lg leading-relaxed">
                  This platform began during a period of personal challenge, while I was unemployed. I wanted to 
                  turn that moment into something meaningful: an opportunity to serve others for the sake of 
                  Allah. Muslim Professionals Network is the result, a community built to help Muslims find 
                  support, guidance, and opportunities through one another.
                </p>
                
                <blockquote className="border-l-4 border-primary pl-6 my-8 bg-muted/30 p-6 rounded-r-lg">
                  <p className="text-lg text-foreground font-medium mb-3 italic leading-relaxed">
                    "A Muslim is the brother of another Muslim. Whoever fulfills the needs of his 
                    brother, Allah will fulfill his needs; whoever removes the troubles of his brother, 
                    Allah will remove one of his troubles on the Day of Resurrection."
                  </p>
                  <cite className="text-sm text-muted-foreground font-normal">
                    — Prophet Muhammad (ﷺ)
                  </cite>
                </blockquote>
                
                <p className="text-lg leading-relaxed">
                  Muslim Professionals Network is our way of applying this hadith in today's world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Can Do Section */}
        <section className="py-16 sm:py-20 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                What You Can Do Here
              </h2>
              <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
                On the platform, members can:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Network className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Discover & Connect
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Discover and connect with Muslim professionals from diverse industries and countries.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Handshake className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Mentorship
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Offer or seek mentorship to help guide career growth and share knowledge.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 text-primary-glow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Business Showcase
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Showcase businesses and services to a values-driven community.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Career Opportunities
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Explore career and internship opportunities shared by members and partners.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Scholarships & Support
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Discover scholarships designed to support Muslim students and young professionals.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-6 h-6 text-primary-glow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Professional Exchange
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Exchange opportunities from jobs to collaborations in a trusted environment.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 text-center">
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  We believe that professional success and Islamic values are not only compatible, 
                  but they also strengthen one another, <em>in shā' Allāh</em>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <Star className="w-12 h-12 text-accent" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your Professional Network?
              </h2>
              <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                Join Muslim Professionals Network today and connect with professionals who understand 
                your journey and share your values.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/search">Find Professionals</Link>
                </Button>
                {!user && (
                  <Button variant="secondary" size="lg" asChild>
                    <Link to="/login">Join Our Community</Link>
                  </Button>
                )}
                <Button variant="secondary" size="lg" asChild>
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