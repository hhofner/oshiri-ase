import { Handlers } from "$fresh/server.ts";
import {
  registerApp,
  getAuthorizationUrl,
  setStateCookie,
} from "../../../utils/mastodon.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // Register app with Mastodon (or get cached app info)
      const app = await registerApp();
      
      // Generate authorization URL and state
      const { url, state } = await getAuthorizationUrl(app);
      
      // Create the response
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: url,
        },
      });
      
      // Set state cookie for CSRF protection
      setStateCookie(response, state);
      
      return response;
    } catch (error) {
      console.error("Login error:", error);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};