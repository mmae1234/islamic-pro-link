import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Search, 
  Users, 
  MessageCircle, 
  MapPin, 
  Award, 
  Shield,
  Globe,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find professionals by location, industry, expertise, and more with our powerful search filters.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Professional Network",
    description: "Connect with Muslim professionals from over 200 industries and 50+ countries worldwide.",
    color: "text-accent"
  },
  {
    icon: MessageCircle,
    title: "Secure Messaging",
    description: "Communicate directly with professionals through our secure, privacy-focused messaging system.",
    color: "text-primary-glow"
  },
  {
    icon: MapPin,
    title: "Location-Based Search",
    description: "Find professionals near you with our interactive map and location-based filtering.",
    color: "text-accent"
  },
  {
    icon: Award,
    title: "Mentorship Programs",
    description: "Access structured mentorship programs designed for career growth and professional development.",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Values-Aligned",
    description: "Connect with professionals who share your Islamic values and understand your unique perspective.",
    color: "text-primary-glow"
  }
];

const Features = () => {
  const { user } = useAuth();
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to 
            <span className="block text-primary">Build Your Career</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Muslim Pros provides comprehensive tools and features to help you connect, 
            grow, and succeed in your professional journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gradient-card border border-border rounded-xl p-6 shadow-soft hover:shadow-elegant transition-smooth group"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-smooth">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center shadow-elegant">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex -space-x-4">
                <Globe className="w-8 h-8 text-primary-foreground/80" />
                <Heart className="w-8 h-8 text-accent" />
                <Users className="w-8 h-8 text-primary-foreground/80" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Join Our Global Community?
            </h3>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Connect with thousands of Muslim professionals who are building 
              successful careers while staying true to their faith.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" className="font-semibold" asChild>
                <Link to={user ? "/dashboard" : "/login"}>
                  {user ? "Complete Your Profile" : "Create Your Profile"}
                </Link>
              </Button>
              <Button variant="elegant" size="lg" className="font-semibold" asChild>
                <Link to="/search">
                  Explore Professionals
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;