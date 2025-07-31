import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, Search, MessageCircle, LogOut, Settings } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">MP</span>
            </div>
            <span className="text-xl font-bold text-foreground">MuslimsPros</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-foreground hover:text-primary transition-smooth">
              Find Professionals
            </Link>
            <Link to="/mentorship" className="text-foreground hover:text-primary transition-smooth">
              Mentorship
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-smooth">
              About
            </Link>
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
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
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
                  <Link to="/login">Join Now</Link>
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
                className="text-foreground hover:text-primary transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Professionals
              </Link>
              <Link 
                to="/mentorship" 
                className="text-foreground hover:text-primary transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Mentorship
              </Link>
              {user && (
                <Link 
                  to="/messages" 
                  className="text-foreground hover:text-primary transition-smooth px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                </Link>
              )}
              <Link 
                to="/about" 
                className="text-foreground hover:text-primary transition-smooth px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/dashboard">Dashboard</Link>
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
                      <Link to="/login">Join Now</Link>
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