/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Centralized backend base URL for client requests
export const BACKEND_BASE_URL = (typeof window !== "undefined" && (window as any).__POWERFLOW_API__)
  || (import.meta as any).env?.VITE_BACKEND_BASE_URL
  || "http://localhost:4000";
