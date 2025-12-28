
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


console.log("Starting app initialization...");

// Used by index.html pre-boot fallback to detect whether JS executed at all.
;(window as any).__APP_BOOT_OK__ = true;

// iOS WebKit detection and immediate handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isWebKit = /WebKit/.test(navigator.userAgent);
const isIOSPrivate = isIOS && (() => {
  try {
    localStorage.setItem('__ios_test__', 'test');
    localStorage.removeItem('__ios_test__');
    return false;
  } catch { return true; }
})();

console.log('Device info:', { isIOS, isWebKit, isIOSPrivate });

const createIOSFallback = () => `
  <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f7fafc;">
    <div style="max-width: 400px; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #1a365d; margin-bottom: 16px; font-size: 28px; font-weight: bold;">Muslim Professionals Network</h1>
      <p style="color: #4a5568; margin-bottom: 16px; line-height: 1.5;">Connect with Muslim professionals worldwide</p>
      ${isIOS ? `
        <div style="background: #fef5e7; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f6d55c;">
          <p style="color: #92400e; font-size: 14px; font-weight: 500;">iOS detected</p>
          <p style="color: #92400e; font-size: 12px;">For best experience, try Chrome or disable private mode</p>
        </div>
      ` : ''}
      <div style="margin: 24px 0;">
        <a href="/search" style="display: block; width: 100%; padding: 14px; background: #38a169; color: white; text-decoration: none; border-radius: 8px; margin-bottom: 12px; font-size: 16px; font-weight: 500; box-sizing: border-box;">Find Professionals</a>
        <a href="/login" style="display: block; width: 100%; padding: 14px; background: #3182ce; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500; box-sizing: border-box;">Join Community</a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 20px;">Having trouble? Try refreshing the page or switching browsers.</p>
    </div>
  </div>
`;

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  document.body.innerHTML = createIOSFallback();
} else {
  console.log("Root element found, rendering app...");
  
  const renderApp = () => {
    try {
      console.log("Rendering React app...");
      const reactRoot = createRoot(root);
      
      // For iOS, render with error handling
      if (isIOS) {
        console.log("iOS detected: rendering with enhanced error handling");
        
        // Immediate render - no delays for iOS
        reactRoot.render(<App />);
        
        // Verify render success after short delay (older iPhones can take longer to mount)
        setTimeout(() => {
          const appElement = document.querySelector('[data-app-ready]');
          if (!appElement) {
            console.log("App failed to render on iOS, showing fallback");
            root.innerHTML = createIOSFallback();
          } else {
            console.log("iOS app render successful");
          }
        }, 2500);
      } else {
        reactRoot.render(<App />);
      }
      
      console.log("App render initiated");
    } catch (error) {
      console.error("Critical error rendering app:", error);
      root.innerHTML = createIOSFallback();
    }
  };

  // Immediate render - remove all timeout delays
  renderApp();
}
