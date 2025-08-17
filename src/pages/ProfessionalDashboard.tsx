import { useEffect } from "react";
import Dashboard from "./Dashboard";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
};

const ProfessionalDashboard = () => {
  useEffect(() => setSeo('Professional Dashboard – Muslim Pros', 'Manage your professional profile and mentorship settings'), []);

  return <Dashboard />;
};

export default ProfessionalDashboard;
