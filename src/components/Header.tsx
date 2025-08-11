import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, Search, MessageCircle, LogOut, Settings, Heart } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [isBusiness, setIsBusiness] = useState(false);
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setBusinessId(null);
      setBusinessName(null);
      setIsBusiness(false);
      return;
    }
    Promise.all([
      supabase
        .from('business_accounts')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
    ]).then(([bizRes, profRes]) => {
      if (!isMounted) return;
      const biz = (bizRes as any).data;
      if (biz) {
        setBusinessId(biz.id);
        setBusinessName(biz.name ?? null);
      } else {
        setBusinessId(null);
        setBusinessName(null);
      }
      setIsBusiness(((profRes as any).data)?.role === 'business' || (user as any)?.user_metadata?.account_type === 'business');
    });
    return () => { isMounted = false; };
  }, [user]);

  const location = useLocation();
  const onBusinessContext = location.pathname.startsWith('/dashboard/business') || location.pathname.startsWith('/business/');
  const showBiz = isBusiness || onBusinessContext;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-background text-foreground backdrop-blur-md border-b border-border sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">MP</span>
            </div>
            <span className="text-xl font-bold text-foreground">Muslim Professionals</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-foreground hover:text-accent transition-smooth">
              Find Professionals
            </Link>
            <Link to="/businesses" className="text-foreground hover:text-accent transition-smooth">
              Find Businesses
            </Link>
            <Link to="/mentorship" className="text-foreground hover:text-accent transition-smooth">
              Mentorship
            </Link>
            <DropdownMenu>
            <DropdownMenuTrigger className="text-foreground hover:text-accent transition-smooth">
                Resources
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border shadow-elegant z-50">
                <DropdownMenuItem asChild>
                  <Link to="/careers">Careers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/scholarships">Scholarships</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/organizations">Organizations</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-foreground hover:text-accent transition-smooth">
                About
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border shadow-elegant z-50">
                <DropdownMenuItem asChild>
                  <Link to="/about">About Us</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/donations">Support Our Mission</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/search">
                    <Search className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/messages">
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                </Button>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-semibold">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover border border-border shadow-elegant" align="end">
                    {businessId ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Business Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/business/${businessId}`} className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Business Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : showBiz ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Business Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Business Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/profile/${user.id}`} className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/businesses" className="flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        Find Businesses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/signup?src=header">Join Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/search" 
                className="text-foreground hover:text-accent transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Professionals
              </Link>
              <Link 
                to="/businesses" 
                className="text-foreground hover:text-accent transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Businesses
              </Link>
              <Link 
                to="/mentorship" 
                className="text-foreground hover:text-accent transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Mentorship
              </Link>
              {user && (
                <>
                  <Link 
                    to="/messages" 
                    className="text-foreground hover:text-accent transition-smooth px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                </>
              )}
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-foreground">Resources</p>
                <div className="ml-2 mt-2 space-y-2">
                  <Link 
                    to="/careers" 
                    className="block text-foreground hover:text-accent transition-smooth py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Careers
                  </Link>
                  <Link 
                    to="/scholarships" 
                    className="block text-foreground hover:text-accent transition-smooth py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Scholarships
                  </Link>
                  <Link 
                    to="/organizations" 
                    className="block text-foreground hover:text-accent transition-smooth py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organizations
                  </Link>
                </div>
              </div>
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-foreground">About</p>
                <div className="ml-2 mt-2 space-y-2">
                  <Link 
                    to="/about" 
                    className="block text-foreground hover:text-accent transition-smooth py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/donations" 
                    className="block text-foreground hover:text-accent transition-smooth py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Support Our Mission
                  </Link>
                </div>
              </div>
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={(businessId || showBiz) ? "/dashboard/business" : "/dashboard"}>Dashboard</Link>
                    </Button>
                    <Button variant="hero" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button variant="hero" size="sm" asChild>
                      <Link to="/signup?src=header">Join Now</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;