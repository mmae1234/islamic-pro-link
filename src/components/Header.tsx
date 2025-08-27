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
    <header className="bg-background/95 backdrop-blur-md text-foreground border-b border-border sticky top-0 z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Responsive */}
          <Link to="/" className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm sm:text-lg">MP</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground truncate hidden xs:block">
              Muslim Professionals Network
            </span>
            <span className="text-lg font-bold text-foreground xs:hidden">MP</span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {user ? (
              <>
                <Link to="/search" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Find Professionals
                </Link>
                <Link to="/businesses" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Find Businesses
                </Link>
                <Link to="/mentorship" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Mentorship
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth-gate?redirect=/search" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Find Professionals
                </Link>
                <Link to="/businesses" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Find Businesses
                </Link>
                <Link to="/auth-gate?redirect=/mentorship" className="text-foreground hover:text-accent transition-smooth text-sm">
                  Mentorship
                </Link>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-foreground hover:text-accent transition-smooth text-sm">
                Resources
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border shadow-elegant z-50">
                <DropdownMenuItem asChild>
                  <Link to="/careers" className="text-foreground text-sm">Careers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/scholarships" className="text-foreground text-sm">Scholarships</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/organizations" className="text-foreground text-sm">Organizations</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-foreground hover:text-accent transition-smooth text-sm">
                About
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border shadow-elegant z-50">
                <DropdownMenuItem asChild>
                  <Link to="/about" className="text-foreground text-sm">About Us</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/donations" className="text-foreground text-sm">Support Our Mission</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0">
                  <Link to="/search">
                    <Search className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0">
                  <Link to="/messages">
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                </Button>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                      <div className="w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-semibold">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-popover border border-border shadow-elegant text-foreground" align="end">
                    {businessId ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            Business Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/business/${businessId}`} className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            Business Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : showBiz ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            Business Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/business" className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            Business Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/profile/${user.id}`} className="flex items-center text-foreground">
                            <User className="w-4 h-4 mr-2" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="flex items-center text-foreground">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center text-foreground">
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center text-foreground">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-foreground">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm px-3">
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="text-xs sm:text-sm px-3">
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
              className="h-9 w-9"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Improved responsive design */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-1">
              {user ? (
                <>
                  <Link 
                    to="/search" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Professionals
                  </Link>
                  <Link 
                    to="/businesses" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Businesses
                  </Link>
                  <Link 
                    to="/mentorship" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mentorship
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth-gate?redirect=/search" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Professionals
                  </Link>
                  <Link 
                    to="/businesses" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Businesses
                  </Link>
                  <Link 
                    to="/auth-gate?redirect=/mentorship" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mentorship
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link 
                    to="/messages" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-4 py-3 rounded-lg text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                </>
              )}
              
              {/* Resources Section */}
              <div className="px-4 py-2 border-t border-border/50 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resources</p>
                <div className="space-y-1">
                  <Link 
                    to="/careers" 
                    className="block text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-3 py-2 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Careers
                  </Link>
                  <Link 
                    to="/scholarships" 
                    className="block text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-3 py-2 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Scholarships
                  </Link>
                  <Link 
                    to="/organizations" 
                    className="block text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-3 py-2 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organizations
                  </Link>
                </div>
              </div>
              
              {/* About Section */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</p>
                <div className="space-y-1">
                  <Link 
                    to="/about" 
                    className="block text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-3 py-2 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/donations" 
                    className="block text-foreground hover:text-accent hover:bg-accent/10 transition-smooth px-3 py-2 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Support Our Mission
                  </Link>
                </div>
              </div>
              
              {/* Auth Section */}
              <div className="flex flex-col space-y-3 px-4 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild className="justify-start">
                      <Link to={(businessId || showBiz) ? "/dashboard/business" : "/dashboard"}>
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="justify-start">
                      <LogOut className="w-4 h-4 mr-2" />
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
