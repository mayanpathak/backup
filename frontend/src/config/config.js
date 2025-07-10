/**
 * Application Configuration File
 * 
 * This file centralizes configuration constants used across the application.
 * It supports environment-based overrides while providing safe defaults.
 */

// --- API Configuration ---

/**
 * Base URL for API requests.
 * Falls back to a production-ready default if not provided via Vite environment variables.
 * Ensure `VITE_API_URL` is defined in `.env` for your environment-specific settings.
 */
export const API_URL = import.meta.env?.VITE_API_URL || 'https://soen-main-backend.vercel.app';

// Log the API URL (only in development for debugging)
if (import.meta.env?.MODE === 'development') {
  console.log('[Config] API URL:', API_URL);
}

// --- Application Metadata ---

/** Application name */
export const APP_NAME = 'CodeCollab';

// --- Session & Auth Settings ---

/** Session timeout duration in milliseconds (24 hours) */
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// --- Message Settings ---

/** Max messages returned per page (pagination limit) */
export const DEFAULT_MESSAGE_LIMIT = 100;

/** Max character length per message */
export const MAX_MESSAGE_LENGTH = 5000;

/** Delay for debounced message search input (in ms) */
export const MESSAGE_SEARCH_DELAY = 300;

// --- Standardized Error Messages ---

/**
 * Reusable error messages across the app.
 */
export const ERROR_MESSAGES = {
  SOCKET_CONNECTION: 'Unable to connect to the server. Please check your internet connection.',
  AUTHENTICATION: 'Authentication failed. Please log in again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  DEFAULT: 'An error occurred. Please try again later.',
};

// --- Export All as Default for Optional Namespace Import ---

export default {
  API_URL,
  APP_NAME,
  SESSION_TIMEOUT,
  DEFAULT_MESSAGE_LIMIT,
  MAX_MESSAGE_LENGTH,
  MESSAGE_SEARCH_DELAY,
  ERROR_MESSAGES,
};
