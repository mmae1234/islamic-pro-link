import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Book, Users, Shield } from "lucide-react";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Help Center</h1>
          
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for help topics..." 
                className="pl-10 text-lg py-6"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Learn how to create your profile and start connecting with professionals
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-primary mb-2" />
                <CardTitle>Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  How to communicate with other professionals on the platform
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
                <CardTitle>Privacy & Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Understand your privacy settings and stay safe on the platform
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="h-5 w-5 mr-2" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create a professional profile?</AccordionTrigger>
                  <AccordionContent>
                    To create a professional profile, sign up for an account and navigate to your dashboard. 
                    Click on "Complete Profile Setup" and fill in your professional information, skills, 
                    experience, and upload a professional photo.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>How can I search for professionals?</AccordionTrigger>
                  <AccordionContent>
                    Use the "Find Professionals" page to search by location, skills, industry, or expertise. 
                    You can filter results by experience level, rating, and availability.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>What is the mentorship program?</AccordionTrigger>
                  <AccordionContent>
                    Our mentorship program connects experienced professionals with those seeking guidance. 
                    You can either offer mentorship or request a mentor through the Mentorship section in your dashboard.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I message other users?</AccordionTrigger>
                  <AccordionContent>
                    Once you find a professional you'd like to connect with, click on their profile and 
                    use the "Send Message" button. All conversations are private and secure.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Is my information secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, we take privacy and security seriously. All personal information is encrypted and 
                    protected. You control what information is visible on your public profile. 
                    Read our Privacy Policy for more details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>How do I report inappropriate behavior?</AccordionTrigger>
                  <AccordionContent>
                    If you encounter inappropriate behavior, you can report it by clicking the "Report" 
                    button on any user's profile or message. Our team reviews all reports promptly.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can delete your account at any time by going to your account settings and 
                    selecting "Delete Account." This action is permanent and cannot be undone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
                <Button className="flex-1">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Help;