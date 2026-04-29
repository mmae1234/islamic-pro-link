import { Link } from "react-router-dom";
import { Heart, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">MP</span>
              </div>
              <span className="text-xl font-bold">Muslim Pros Network</span>
            </div>
            <p className="text-primary-foreground/80 mb-4 leading-relaxed">
              Connecting Muslim professionals worldwide to build careers that align with their values and faith.
            </p>
            <div className="flex items-center text-sm text-primary-foreground/70">
              <Heart className="w-4 h-4 mr-2 text-accent" />
              Made with love from the Ummah
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Find Professionals
                </Link>
              </li>
              <li>
                <Link to="/mentorship" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Mentorship
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  News
                </Link>
              </li>
              <li>
                <Link to="/donations" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Donations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Get In Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center text-primary-foreground/80">
                <Mail className="w-4 h-4 mr-3 text-accent" />
                <span className="text-sm">contact@muslimprosnet.com</span>
              </div>
              <div className="flex items-start text-primary-foreground/80">
                <MapPin className="w-4 h-4 mr-3 mt-0.5 text-accent" />
                <span className="text-sm">Global Community<br />Serving Worldwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-primary-foreground/70 mb-4 md:mb-0">
              <div>© {new Date().getFullYear()} Muslim Pros. All rights reserved.</div>
              <div className="mt-1">
                Designed by{" "}
                <a href="https://tajdeedtech.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Tajdeed Tech
                </a>
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="https://x.com/MuslimProsNet" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-accent transition-smooth">
                <span className="sr-only">Twitter / X</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;