// Centralized environment detection
export function isProduction(): boolean {
  return window.location.hostname === 'oeconomia.io' || 
         window.location.hostname.includes('netlify.app') ||
         import.meta.env.PROD;
}

export function getApiBaseUrl(): string {
  // FORCE PRODUCTION MODE: Always use Netlify functions, never connect to Replit
  // This ensures the website works independently without Replit connection
  return '';
}

export function getEnvironmentInfo() {
  return {
    isProduction: true,
    isDevelopment: false,
    apiBaseUrl: getApiBaseUrl(),
    hostname: window.location.hostname,
    nodeEnv: 'production'
  };
}