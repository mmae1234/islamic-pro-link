import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, LogIn } from "lucide-react";
import heroImage from "@/assets/diverse-professionals-hero.jpg";

const StaticLandingFallback = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="bg-gradient-primary p-4">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MP</span>
            </div>
            <span className="text-lg font-bold text-primary-foreground">Muslim Professionals</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-primary">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Muslim professionals collaborating" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))';
              }
            }}
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Connect with Muslim 
              <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                Professionals
              </span>
              Worldwide
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join the largest professional network for the Muslim community. Build connections, 
              find mentors, and grow your career while staying true to your values.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="accent" size="xl" className="font-semibold hover:shadow-glow" asChild>
                <Link to="/login">
                  <Users className="w-5 h-5 mr-2" />
                  Join Now
                </Link>
              </Button>
              <Button variant="elegant" size="xl" className="font-semibold hover:shadow-elegant" asChild>
                <Link to="/login">
                  <LogIn className="w-5 h-5 mr-2" />
                  Login
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-primary-foreground/30 mb-8">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">10K+</div>
                <div className="text-sm text-primary-foreground/90">Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">50+</div>
                <div className="text-sm text-primary-foreground/90">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">200+</div>
                <div className="text-sm text-primary-foreground/90">Industries</div>
              </div>
            </div>

            {/* Mobile Notice */}
            <div className="bg-gradient-card/50 backdrop-blur-sm border border-border/30 rounded-lg p-4 text-center">
              <p className="text-sm text-primary-foreground/80">
                Some features are temporarily limited on mobile. Please sign up or login to explore our community fully.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Muslim Professionals. Connecting the global Muslim community.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StaticLandingFallback;