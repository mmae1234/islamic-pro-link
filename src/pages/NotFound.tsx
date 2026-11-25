import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Search, UserPlus, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { setSEOTitle } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setSEOTitle("Page Not Found | Muslim Professionals Network");
    // Keep 404s out of search results.
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = robots?.getAttribute("content") ?? null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex");
    console.warn("404: no route for", location.pathname);
    return () => {
      if (previous === null) robots?.remove();
      else robots?.setAttribute("content", previous);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-primary mb-2">404</p>
          <h1 className="text-3xl font-bold text-foreground mb-3">We couldn't find that page</h1>
          <p className="text-muted-foreground mb-8">
            The link may be old or mistyped. Here are a few places to go instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="hero">
              <Link to="/search">
                <Search className="w-4 h-4 mr-2" />
                Find Professionals
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/signup">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Free
                </Link>
              </Button>
            )}
          </div>
          <Link to="/" className="inline-block mt-6 text-sm text-muted-foreground underline">
            Back to the homepage
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
