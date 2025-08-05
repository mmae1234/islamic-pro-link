import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add error boundary to catch React errors
const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
} else {
  console.log("Root element found, rendering app...");
  try {
    createRoot(root).render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    // Fallback simple content
    root.innerHTML = '<div style="padding: 20px; font-family: Arial;">Website loading error. Please refresh the page.</div>';
  }
}
