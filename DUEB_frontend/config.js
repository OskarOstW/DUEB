// config.js
import { API_BASE_URL } from '@env';

// Use the environment variable with a fallback for production safety
export const BASE_URL = API_BASE_URL || 'https://api-placeholder-for-production.com';

