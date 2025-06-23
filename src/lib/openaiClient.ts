import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  // Only embed the API key in development builds
  apiKey: import.meta.env.DEV ? import.meta.env.VITE_OPENAI_API_KEY || '' : '',
  // Disallow usage directly in the browser to avoid exposing the key
  dangerouslyAllowBrowser: false
});
