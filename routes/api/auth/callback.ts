import { Handlers } from "$fresh/server.ts";
import {
  registerApp,
  getAccessToken,
  fetchUserAccount,
  getAuthFromCookies,
  setAuthCookies,
} from "../../../utils/mastodon.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      
      if (!code) {
        return new Response(JSON.stringify({ error: "Authorization code missing" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      // Get stored state from cookie
      const { state: storedState } = getAuthFromCookies(req);
      
      // Validate state to prevent CSRF attacks
      if (!storedState || state !== storedState) {
        return new Response(JSON.stringify({ error: "Invalid state parameter" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      // Register app (or get cached app info)
      const app = await registerApp();
      
      // Exchange authorization code for access token
      const token = await getAccessToken(app, code);
      
      // Create the response with redirect to home page
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
      
      // Set authentication cookies
      setAuthCookies(response, app, token);
      
      return response;
    } catch (error) {
      console.error("Callback error:", error);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};