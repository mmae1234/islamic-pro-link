
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced error handling for mobile browsers
const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  // Create a fallback element for mobile
  document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; text-align: center;"><h1>Muslim Professionals</h1><p>Loading website...</p><p><a href="/login">Login</a> | <a href="/search">Search</a></p></div>';
} else {
  console.log("Root element found, rendering app...");
  
  try {
    const reactRoot = createRoot(root);
    reactRoot.render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    // Mobile-friendly fallback
    root.innerHTML = `
      <div style="padding: 20px; font-family: Arial; text-align: center; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; margin-bottom: 20px;">Muslim Professionals</h1>
        <p style="color: #4a5568; margin-bottom: 20px;">We're experiencing technical difficulties loading the full website.</p>
        <div style="margin: 20px 0;">
          <a href="/login" style="display: inline-block; padding: 10px 20px; background: #3182ce; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">Login</a>
          <a href="/search" style="display: inline-block; padding: 10px 20px; background: #38a169; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">Search Professionals</a>
        </div>
        <p style="color: #718096; font-size: 14px;">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    `;
  }
}
