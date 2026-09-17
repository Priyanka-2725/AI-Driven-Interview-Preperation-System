/**
 * In-memory token storage for the access token.
 * 
 * Why this is in-memory rather than localStorage:
 * Storing access tokens (JWTs) in localStorage exposes them to Cross-Site Scripting (XSS) 
 * attacks, where any malicious script can read and exfiltrate the token. Keeping the token 
 * entirely within a JavaScript variable closure guarantees it cannot be stolen via XSS.
 * The trade-off is that a hard page reload clears the variable, requiring a background 
 * silent refresh (using the secure httpOnly refresh token cookie) to re-establish the session.
 */

let accessToken: string | null = null;

export const getToken = (): string | null => {
  return accessToken;
};

export const setToken = (token: string): void => {
  accessToken = token;
};

export const clearToken = (): void => {
  accessToken = null;
};
