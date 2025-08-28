import { useMemo } from 'react';

export function useEnvironment() {
  const isProduction = useMemo(() => {
    // FORCE PRODUCTION MODE: Always return true to use Netlify functions
    return true;
  }, []);

  const apiBaseUrl = useMemo(() => {
    // FORCE NETLIFY FUNCTIONS: Always use relative URLs to avoid Replit connection
    return '';
  }, [isProduction]);

  return {
    isProduction: true,
    isDevelopment: false,
    apiBaseUrl: '',
  };
}