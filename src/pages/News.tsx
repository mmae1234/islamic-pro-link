import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Newspaper, Search, Clock, Tag } from "lucide-react";

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Muslim Professional News
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest news, achievements, and stories from the Muslim professional community worldwide.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      placeholder="Search news articles..." 
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer">
                    <Tag className="w-3 h-3 mr-1" />
                    Technology
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer">
                    <Tag className="w-3 h-3 mr-1" />
                    Healthcare
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer">
                    <Tag className="w-3 h-3 mr-1" />
                    Business
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer">
                    <Tag className="w-3 h-3 mr-1" />
                    Education
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Message */}
          <Card className="shadow-soft bg-primary/5 border-primary/20">
            <CardContent className="p-12 text-center">
              <Newspaper className="w-20 h-20 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                News Feed Coming Soon
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're working on bringing you the latest news and stories from Muslim professionals around the world. 
                This section will feature:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                <div className="text-left">
                  <h3 className="font-semibold text-foreground mb-2">Featured Content</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Professional achievements and success stories</li>
                    <li>• Industry insights and career advice</li>
                    <li>• Community events and networking opportunities</li>
                    <li>• Islamic perspectives on professional development</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground mb-2">Interactive Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tag-based article filtering</li>
                    <li>• Comment and discussion sections</li>
                    <li>• Bookmark favorite articles</li>
                    <li>• Share articles with your network</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Subscribe to Updates
                </Button>
                <Button variant="outline" disabled>
                  <Newspaper className="w-4 h-4 mr-2" />
                  Submit a Story
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Want to be notified when the news feed launches? 
                <a href="mailto:news@muslimspros.com" className="text-primary hover:underline ml-1">
                  Contact us
                </a> to join our early notification list.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;