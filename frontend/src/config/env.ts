const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'test' ? 'http://localhost:5000/api/v1' : undefined);

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL in environment");
}

export const env = {
  API_BASE_URL: apiBaseUrl,
  APP_NAME: import.meta.env.VITE_APP_NAME || "AI Interview Prep",
};
