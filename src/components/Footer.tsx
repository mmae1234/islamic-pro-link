import { Link } from "react-router-dom";
import { Heart, Mail, MapPin, Phone } from "lucide-react";

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
              <span className="text-xl font-bold">Muslim Pros</span>
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
              <div className="flex items-center text-primary-foreground/80">
                <Phone className="w-4 h-4 mr-3 text-accent" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start text-primary-foreground/80">
                <MapPin className="w-4 h-4 mr-3 mt-0.5 text-accent" />
                <span className="text-sm">Global Community<br />Serving Worldwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
      {/* Social icons */}
<div className="flex space-x-6">
  {/* Facebook (placeholder – update href when ready) */}
  <a
    href="https://facebook.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary-foreground/70 hover:text-accent transition-smooth inline-flex"
  >
    <span className="sr-only">Facebook</span>
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
    </svg>
  </a>

  {/* X (Twitter) */}
  <a
    href="https://x.com/MuslimProsNet"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary-foreground/70 hover:text-accent transition-smooth inline-flex"
  >
    <span className="sr-only">X (Twitter)</span>
    {/* X logo SVG */}
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.59L22.5 22h-6.03l-4.71-5.59L5.5 22H2.244l8.01-9.18L1.5 2h6.094l4.24 5.18L18.244 2zm-2.1 18h2.1L8.857 4h-2.1l9.387 16z"/>
    </svg>
  </a>

  {/* LinkedIn (placeholder – update href when ready) */}
  <a
    href="https://linkedin.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary-foreground/70 hover:text-accent transition-smooth inline-flex"
  >
    <span className="sr-only">LinkedIn</span>
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
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