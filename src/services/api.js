import axios from "axios";

/** --------------------------------------------------------------
 *  Helper to obtain a clean base URL.
 *  Guarantees that the URL ends with `/api`.
 * -------------------------------------------------------------- */
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  // Trim whitespace and trailing slashes
  url = url.trim().replace(/\/+$/, "");
  // Ensure we always end with /api
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
};

/** --------------------------------------------------------------
 *  Central Axios instance used by the whole app.
 * -------------------------------------------------------------- */
const API = axios.create({
  baseURL: getBaseURL(),
});

/* -----------------------------------------------------------------
 *  Request interceptor – guarantees that every request body is
 *  a proper JSON string and that the correct header is sent.
 * ----------------------------------------------------------------- */
API.interceptors.request.use((config) => {
  // Ensure JSON payload – only when there is a data object.
  if (config.data && typeof config.data !== "string") {
    config.data = JSON.stringify(config.data);
  }

  // Set the proper Content‑Type header (overwrites any default).
  config.headers = {
    ...(config.headers || {}),
    "Content-Type": "application/json",
  };

  // Attach JWT token if present.
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;