
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Starting app initialization...");

// Enhanced error handling for mobile browsers
const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  // Create a fallback for mobile
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="color: #1a365d; margin-bottom: 20px; font-size: 24px;">Muslim Professionals</h1>
      <p style="color: #4a5568; margin-bottom: 20px;">Loading website...</p>
      <div style="margin: 20px 0;">
        <a href="/login" style="display: inline-block; padding: 12px 24px; background: #3182ce; color: white; text-decoration: none; border-radius: 8px; margin: 8px; font-size: 16px;">Login</a>
        <a href="/search" style="display: inline-block; padding: 12px 24px; background: #38a169; color: white; text-decoration: none; border-radius: 8px; margin: 8px; font-size: 16px;">Search</a>
      </div>
    </div>
  `;
} else {
  console.log("Root element found, rendering app...");
  
  try {
    const reactRoot = createRoot(root);
    reactRoot.render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Critical error rendering app:", error);
    // Enhanced mobile-friendly fallback
    root.innerHTML = `
      <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f7fafc;">
        <div style="max-width: 400px; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1a365d; margin-bottom: 16px; font-size: 28px; font-weight: bold;">Muslim Professionals</h1>
          <p style="color: #4a5568; margin-bottom: 24px; line-height: 1.5;">Connect with Muslim professionals worldwide</p>
          <div style="margin: 24px 0;">
            <a href="/search" style="display: block; width: 100%; padding: 14px; background: #38a169; color: white; text-decoration: none; border-radius: 8px; margin-bottom: 12px; font-size: 16px; font-weight: 500;">Find Professionals</a>
            <a href="/login" style="display: block; width: 100%; padding: 14px; background: #3182ce; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500;">Join Community</a>
          </div>
          <p style="color: #718096; font-size: 14px; margin-top: 20px;">Having trouble? Try refreshing the page.</p>
        </div>
      </div>
    `;
  }
}
