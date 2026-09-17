if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL in environment");
}

export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME || "AI Interview Coach",
};
