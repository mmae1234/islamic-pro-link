import { createRoot } from 'react-dom/client'
import './index.css'

// Simple test component to debug mobile loading
function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>Mobile Test - App is Loading!</h1>
      <p>If you can see this, React is working on mobile.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

// Add comprehensive error handling
const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px;">ROOT NOT FOUND ERROR</div>';
} else {
  console.log("Root element found, rendering simple app...");
  try {
    createRoot(root).render(<SimpleApp />);
    console.log("Simple app rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    root.innerHTML = '<div style="padding: 20px; font-family: Arial; background: red; color: white;">RENDER ERROR: ' + error + '</div>';
  }
}
