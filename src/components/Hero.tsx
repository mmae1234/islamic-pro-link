import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Search, Users, MessageCircle, Award } from "lucide-react";
import heroImage from "@/assets/new-hero-image.jpg";

const Hero = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Muslim professionals collaborating" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Connect with Muslim 
              <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                Professionals
              </span>
              Worldwide
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl">
              Join the largest professional network for the Muslim community. Find mentors, 
              build connections, and advance your career while staying true to your values.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="accent" size="xl" className="font-semibold hover:shadow-glow" asChild>
                <Link to="/search">
                  <Search className="w-5 h-5 mr-2" />
                  Find Professionals
                </Link>
              </Button>
              <Button variant="elegant" size="xl" className="font-semibold hover:shadow-elegant" asChild>
                <Link to={user ? "/dashboard" : "/login"}>
                  <Users className="w-5 h-5 mr-2" />
                  {user ? "Go to Dashboard" : "Join Community"}
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-primary-foreground/20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">10K+</div>
                <div className="text-sm text-primary-foreground/80">Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">50+</div>
                <div className="text-sm text-primary-foreground/80">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">200+</div>
                <div className="text-sm text-primary-foreground/80">Industries</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="hidden lg:block">
            <div className="grid gap-6">
              <div className="bg-gradient-card backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-elegant">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Smart Search</h3>
                    <p className="text-sm text-muted-foreground">Find professionals by location, industry, and expertise</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-card backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-elegant">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Direct Messaging</h3>
                    <p className="text-sm text-muted-foreground">Connect and communicate securely with professionals</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-card backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-elegant">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-glow" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Mentorship Programs</h3>
                    <p className="text-sm text-muted-foreground">Get guidance from experienced Muslim professionals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};

export default Hero;