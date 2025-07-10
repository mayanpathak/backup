import axios from "axios";
import { API_URL } from "./config";

// Validate base URL at load time
if (!API_URL || typeof API_URL !== "string") {
  throw new Error("API_URL is not defined correctly in config.js");
}

// Create axios instance with enhanced configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enable sending cookies with requests
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Debug log base URL (development only)
if (process.env.NODE_ENV === "development") {
  console.log("[Axios Config] API base URL:", API_URL);
}

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      // Dev logging
      if (process.env.NODE_ENV === "development") {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (err) {
      console.error("Request interceptor error:", err);
      return config;
    }
  },
  (error) => {
    console.error("Request setup error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    try {
      // Store new token if present in response body
      if (response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      // Store refreshed token from headers
      const refreshedToken = response.headers["x-refreshed-token"];
      if (refreshedToken) {
        localStorage.setItem("authToken", refreshedToken);
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth] Token refreshed from header");
        }
      }

      return response;
    } catch (err) {
      console.error("Response interceptor error:", err);
      return response;
    }
  },
  (error) => {
    const { response, code } = error;

    if (code === "ECONNABORTED") {
      console.error("Timeout error:", error);

      window.dispatchEvent(
        new CustomEvent("api_error", {
          detail: {
            type: "TIMEOUT_ERROR",
            message: "Server timeout. Please try again later or check your connection.",
          },
        })
      );

      if (["/login", "/register"].includes(window.location.pathname)) {
        window.dispatchEvent(
          new CustomEvent("auth_form_error", {
            detail: {
              message: "Server timed out. Please retry or check server status.",
            },
          })
        );
      }

    } else if (code === "ERR_NETWORK") {
      console.error("Network error:", error);

      window.dispatchEvent(
        new CustomEvent("api_error", {
          detail: {
            type: "NETWORK_ERROR",
            message: "Network error. Please check your internet connection or try again.",
          },
        })
      );

    } else if (response) {
      const status = response.status;
      const data = response.data || {};

      console.error(`API Error ${status}:`, data);

      if (status === 401) {
        window.dispatchEvent(
          new CustomEvent("auth_error", {
            detail: {
              type: "AUTH_ERROR",
              code: data.code || "UNAUTHORIZED",
              message: data.message || "Session expired. Please log in again.",
            },
          })
        );

        if (!["/login", "/register"].includes(window.location.pathname)) {
          window.location.href = "/login";
        }

      } else if (status === 404) {
        window.dispatchEvent(
          new CustomEvent("api_error", {
            detail: {
              type: "NOT_FOUND",
              message: "Requested resource not found.",
            },
          })
        );
      } else {
        // Generic fallback for unhandled status codes
        window.dispatchEvent(
          new CustomEvent("api_error", {
            detail: {
              type: "SERVER_ERROR",
              message: data.message || "An error occurred. Please try again.",
            },
          })
        );
      }
    } else {
      // Unknown error fallback
      console.error("Unknown error:", error);

      window.dispatchEvent(
        new CustomEvent("api_error", {
          detail: {
            type: "UNKNOWN_ERROR",
            message: "An unexpected error occurred. Please try again.",
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
