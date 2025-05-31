// Utility functions for Mastodon authentication
import { setCookie, getCookies, deleteCookie } from "https://deno.land/std@0.182.0/http/cookie.ts";

// Constants
const MASTODON_INSTANCE = "famichiki.jp";
const CLIENT_NAME = "Oshiri-Ase Counter";
const SCOPES = "read:accounts";
const REDIRECT_URI = Deno.env.get("REDIRECT_URI") || "http://localhost:8000/api/auth/callback";

// Type definitions
export interface MastodonApp {
  id: string;
  client_id: string;
  client_secret: string;
}

export interface MastodonUser {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

// Cookie names
const APP_COOKIE = "mastodon_app";
const TOKEN_COOKIE = "mastodon_token";
const STATE_COOKIE = "mastodon_state";

// Register the application with the Mastodon instance
export async function registerApp(): Promise<MastodonApp> {
  try {
    // Check if we already have app credentials stored
    const savedApp = Deno.env.get("MASTODON_APP");
    if (savedApp) {
      return JSON.parse(savedApp);
    }
    
    const response = await fetch(`https://${MASTODON_INSTANCE}/api/v1/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_name: CLIENT_NAME,
        redirect_uris: REDIRECT_URI,
        scopes: SCOPES,
        website: Deno.env.get("WEBSITE") || "http://localhost:8000",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register app: ${response.statusText}`);
    }

    const app = await response.json();
    return app;
  } catch (error) {
    console.error("Error registering Mastodon app:", error);
    throw error;
  }
}

// Generate the authorization URL for the user to log in
export async function getAuthorizationUrl(app: MastodonApp): Promise<{ url: string; state: string }> {
  // Generate a random state string for CSRF protection
  const state = crypto.randomUUID();
  
  const params = new URLSearchParams({
    client_id: app.client_id,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  return {
    url: `https://${MASTODON_INSTANCE}/oauth/authorize?${params.toString()}`,
    state,
  };
}

// Exchange the authorization code for an access token
export async function getAccessToken(app: MastodonApp, code: string): Promise<TokenResponse> {
  const response = await fetch(`https://${MASTODON_INSTANCE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: app.client_id,
      client_secret: app.client_secret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch the user's account information
export async function fetchUserAccount(token: string): Promise<MastodonUser> {
  const response = await fetch(`https://${MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user account: ${response.statusText}`);
  }

  const account = await response.json();
  
  return {
    id: account.id,
    username: account.username,
    display_name: account.display_name || account.username,
    avatar: account.avatar,
  };
}

// Set authentication cookies
export function setAuthCookies(
  response: Response,
  app: MastodonApp,
  token: TokenResponse,
): void {
  setCookie(response.headers, {
    name: APP_COOKIE,
    value: JSON.stringify(app),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  setCookie(response.headers, {
    name: TOKEN_COOKIE,
    value: JSON.stringify(token),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

// Set the state cookie for CSRF protection
export function setStateCookie(response: Response, state: string): void {
  setCookie(response.headers, {
    name: STATE_COOKIE,
    value: state,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 10, // 10 minutes
  });
}

// Get app and token from cookies
export function getAuthFromCookies(request: Request): {
  app: MastodonApp | null;
  token: TokenResponse | null;
  state: string | null;
} {
  const cookies = getCookies(request.headers);
  
  const appCookie = cookies[APP_COOKIE];
  const tokenCookie = cookies[TOKEN_COOKIE];
  const stateCookie = cookies[STATE_COOKIE];
  
  return {
    app: appCookie ? JSON.parse(appCookie) : null,
    token: tokenCookie ? JSON.parse(tokenCookie) : null,
    state: stateCookie || null,
  };
}

// Clear auth cookies
export function clearAuthCookies(response: Response): void {
  deleteCookie(response.headers, APP_COOKIE, { path: "/" });
  deleteCookie(response.headers, TOKEN_COOKIE, { path: "/" });
  deleteCookie(response.headers, STATE_COOKIE, { path: "/" });
}