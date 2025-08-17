
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Users, MessageCircle, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/diverse-professionals-hero.jpg";

const Hero = () => {
  const { user } = useAuth();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-primary">
      {/* iOS-specific viewport fixes */}
      <style>{`
        @supports (-webkit-touch-callout: none) {
          .hero-container {
            min-height: -webkit-fill-available;
          }
        }
        
        @media (max-width: 480px) {
          .hero-container {
            min-height: 100vh;
            min-height: 100dvh;
            padding: 0.75rem;
          }
          
          .hero-text {
            font-size: 1.75rem;
            line-height: 1.2;
          }
          
          .hero-subtitle {
            font-size: 0.875rem;
            line-height: 1.4;
          }
        }
      `}</style>

      {/* Background image and overlay */}
      <img
        src={heroImage}
        alt="Diverse Muslim professionals networking at a conference"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
        decoding="async"
        {...({ fetchpriority: "high" } as any)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>

      {/* Content - Mobile First */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 hero-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-4 sm:space-y-6">
            <h1 className="hero-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-foreground leading-tight">
              Connect with Muslim 
              <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent mt-1">
                Professionals
              </span>
              Worldwide
            </h1>
            
            <p className="hero-subtitle text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/90 max-w-xl mx-auto lg:mx-0">
              Join the largest professional network for the Muslim community. Find mentors, 
              build connections, and advance your career while staying true to your values.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center lg:justify-start pt-2">
              <Button variant="accent" size="lg" className="font-semibold hover:shadow-glow w-full sm:w-auto text-sm sm:text-base" asChild>
                <Link to={user ? "/search" : "/auth-gate"}>
                  <Search className="w-4 h-4 mr-2" />
                  Find Professionals
                </Link>
              </Button>
              {user ? (
                <Button variant="elegant" size="lg" className="font-semibold hover:shadow-elegant w-full sm:w-auto text-sm sm:text-base" asChild>
                  <Link to="/businesses">
                    <Users className="w-4 h-4 mr-2" />
                    Find Businesses
                  </Link>
                </Button>
              ) : (
                <Button variant="elegant" size="lg" className="font-semibold hover:shadow-elegant w-full sm:w-auto text-sm sm:text-base" asChild>
                  <Link to="/login">
                    <Users className="w-4 h-4 mr-2" />
                    Join Community
                  </Link>
                </Button>
              )}
            </div>

            {/* Stats - Responsive Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-primary-foreground/20">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent">10K+</div>
                <div className="text-xs sm:text-sm text-primary-foreground/80">Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent">50+</div>
                <div className="text-xs sm:text-sm text-primary-foreground/80">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent">200+</div>
                <div className="text-xs sm:text-sm text-primary-foreground/80">Industries</div>
              </div>
            </div>
          </div>

          {/* Feature Cards - Hidden on mobile for better performance */}
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
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};

export default Hero;
