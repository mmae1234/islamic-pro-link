import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setSEOTitle } from "@/lib/utils";

const SITE = "Muslim Professionals Network";

// Browser-tab title per route. Runs on every navigation before the page's own
// effects, so pages that set a more specific title (a business name, etc.)
// still win.
const TITLES: Record<string, string> = {
  "": `${SITE} - Connect, Grow, Succeed`,
  search: "Find Professionals",
  businesses: "Muslim-Owned Businesses",
  about: "About",
  login: "Sign In",
  signup: "Join",
  "forgot-password": "Reset Your Password",
  "reset-password": "Choose a New Password",
  dashboard: "Dashboard",
  "edit-profile": "Edit Profile",
  "edit-business-profile": "Edit Business Profile",
  profile: "Profile",
  business: "Business",
  mentorship: "Mentorship",
  messages: "Messages",
  favorites: "Saved",
  settings: "Settings",
  contact: "Contact",
  feedback: "Feedback",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  help: "Help",
  donations: "Support Us",
  news: "News",
  organizations: "Organizations",
  careers: "Careers",
  scholarships: "Scholarships",
  admin: "Admin",
  "auth-gate": "Sign In to Continue",
  diag: "Diagnostics",
  auth: "Confirming",
};

const RouteTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const segment = pathname.split("/")[1] ?? "";
    const page = TITLES[segment];
    if (segment === "") setSEOTitle(TITLES[""]);
    else setSEOTitle(`${page ?? "Page Not Found"} | ${SITE}`);
  }, [pathname]);

  return null;
};

export default RouteTitle;
