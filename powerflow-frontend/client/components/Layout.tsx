import { ElectricBackground } from "@/components/ElectricBackground";
import NavBar from "@/components/NavBar";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, HelpCircle, Shield, FileText, Zap } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <ElectricBackground />
      <NavBar />
      <main className="container py-10 min-h-[70vh]">{children}</main>
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-20">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">POWERFLOW</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Powerflow is a decentralized energy trading platform that enables seamless
                transactions between energy producers and consumers. Our mission is to revolutionize
                the energy market by creating a transparent, efficient, and accessible marketplace
                for renewable energy trading.
              </p>
              <p className="text-xs text-muted-foreground font-medium">UPI FOR POWER</p>
            </div>

            {/* Resources & Support */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Resources & Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support Center</span>
                  </Link>
                </li>
                <li>
                  <Link to="/forecast" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span>AI Forecast & Analytics</span>
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span>My Profile & Settings</span>
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Terms of Service</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Contact Information</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Email Support</span>
                    <a href="mailto:hackathon0690@gmail.com" className="text-foreground hover:text-primary transition-colors">
                      hackathon0690@gmail.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Phone Support</span>
                    <a href="tel:+911234567890" className="text-foreground hover:text-primary transition-colors">
                      +91 123 456 7890
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs mb-1">Location</span>
                    <span className="text-foreground">India</span>
                  </div>
                </li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-3">Follow Us</p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="h-8 w-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                    aria-label="Twitter"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="h-8 w-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="h-8 w-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                    aria-label="GitHub"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span>© {new Date().getFullYear()} Powerflow. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs">Made by Team KANNon</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
