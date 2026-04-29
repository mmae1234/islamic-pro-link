import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Book, Users, Shield } from "lucide-react";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
};

const Help = () => {
  useEffect(() => {
    setSeo('Help Center – Muslim Pros', 'FAQs and help: linking, delinking, business profiles, social links.');
  }, []);
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
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('getting-started')?.scrollIntoView()}>
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

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('messaging')?.scrollIntoView()}>
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

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('privacy-safety')?.scrollIntoView()}>
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

          {/* Getting Started Section */}
          <Card className="mb-8" id="getting-started">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Creating Your Profile</h3>
                  <p className="text-muted-foreground mb-2">Start by completing your professional profile:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Add your full name and professional details</li>
                    <li>Select your occupation and industry sector</li>
                    <li>Upload a professional photo</li>
                    <li>Write a compelling bio highlighting your expertise</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Finding Professionals & Businesses</h3>
                  <p className="text-muted-foreground">Use our Find Professionals and Find Businesses pages to discover people and companies. Filter by location and more, favorite businesses to save them, and message owners directly.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messaging Section */}
          <Card className="mb-8" id="messaging">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Messaging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Sending Messages</h3>
                  <p className="text-muted-foreground mb-2">Connect with other professionals through our secure messaging system:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Visit a professional's profile and click "Send Message"</li>
                    <li>Compose a clear, professional introduction</li>
                    <li>Be specific about how you'd like to connect or collaborate</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Managing Conversations</h3>
                  <p className="text-muted-foreground">Access all your conversations from the Messages page. You can delete, archive, or report messages as needed.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Safety Section */}
          <Card className="mb-8" id="privacy-safety">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Safety
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Privacy</h3>
                  <p className="text-muted-foreground mb-2">We protect your information:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Your personal contact information is never shared publicly</li>
                    <li>You control what information appears on your profile</li>
                    <li>Messages are private and transmitted over secure (TLS) connections</li>
                    <li>Uploaded profile and business images are automatically screened for inappropriate content</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Blocking & Reporting</h3>
                  <p className="text-muted-foreground mb-2">You have tools to keep your experience safe:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Block any user from their profile or from professional cards (three-dot menu)</li>
                    <li>Report fake profiles or abusive messages — our moderation team reviews all reports</li>
                    <li>Manage blocked users in Settings → Privacy</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Deleting Your Account</h3>
                  <p className="text-muted-foreground">You can permanently delete your account and personal data anytime from Settings → Delete Account.</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

                <AccordionItem value="item-2b">
                  <AccordionTrigger>Who can create a business profile?</AccordionTrigger>
                  <AccordionContent>
                    Only users with a business account can create or manage a business profile. Professionals and visitors won't see prompts to create one. To create a business profile, sign up for a new business account; the Settings page no longer includes a create/manage button.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2c">
                  <AccordionTrigger>Can I favorite businesses?</AccordionTrigger>
                  <AccordionContent>
                    Yes. On business listings and profiles, use the "Favorite" button to save businesses. Your favorites appear in your Favorites page.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2d">
                  <AccordionTrigger>How do I link my profile to a business?</AccordionTrigger>
                  <AccordionContent>
                    Visit the business profile and use "Request to link profile" at the bottom. An admin will review and approve your request.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2e">
                  <AccordionTrigger>How can a business delink a professional?</AccordionTrigger>
                  <AccordionContent>
                    Go to Dashboard → Business Dashboard → Link Requests → Linked Professionals, then click "Delink" next to the professional you want to remove.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2f">
                  <AccordionTrigger>How do I add social media links to my profile?</AccordionTrigger>
                  <AccordionContent>
                    Professionals: open Edit Profile and add your Facebook, Instagram, and LinkedIn URLs.
                    Businesses: open the Business Dashboard and use the Social Links section to add Facebook, Instagram, LinkedIn, X, YouTube, TikTok, WhatsApp, or Telegram.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2g">
                  <AccordionTrigger>How do I block or unblock users?</AccordionTrigger>
                  <AccordionContent>
                    You can block users from their profile page or from professional cards using the menu (three dots). To unblock users, go to Settings → Privacy → Blocked Users section and click "Unblock" next to any user you want to unblock.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2h">
                  <AccordionTrigger>How do I delete message conversations?</AccordionTrigger>
                  <AccordionContent>
                    On the Messages page, click the "Delete" button next to any conversation. This will permanently delete the entire conversation thread for both you and the other user.
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
                    We take privacy and security seriously. Data is transmitted over secure (TLS) connections,
                    access to your data is governed by row-level security policies, and you control what
                    appears on your public profile. Uploaded images are automatically screened for
                    inappropriate content. Read our Privacy Policy for full details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>How do I support the platform?</AccordionTrigger>
                  <AccordionContent>
                    Visit the "Support Our Mission" page (linked in the header) to make a donation via PayPal.
                    Donations help us keep the platform free for the community.
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
                <Button variant="outline" className="flex-1" disabled>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat Coming Soon
                </Button>
                <Button className="flex-1" onClick={() => window.location.href = '/contact'}>
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