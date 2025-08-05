import { createRoot } from 'react-dom/client'
import './index.css'

// Ultra-basic mobile test - maximum visibility
function SimpleApp() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: 'red', 
      color: 'white', 
      fontSize: '24px',
      fontWeight: 'bold',
      padding: '10px',
      boxSizing: 'border-box'
    }}>
      <div>MOBILE TEST</div>
      <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
      <div>UserAgent: {navigator.userAgent.substring(0, 50)}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
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
