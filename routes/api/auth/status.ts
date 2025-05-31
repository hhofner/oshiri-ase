import { Handlers } from "$fresh/server.ts";
import {
  getAuthFromCookies,
  fetchUserAccount,
} from "../../../utils/mastodon.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // Get auth data from cookies
      const { token } = getAuthFromCookies(req);
      
      // If not logged in
      if (!token) {
        return new Response(
          JSON.stringify({ 
            isLoggedIn: false 
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      // Fetch user information
      const user = await fetchUserAccount(token.access_token);
      
      return new Response(
        JSON.stringify({
          isLoggedIn: true,
          user,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Status check error:", error);
      
      // Return not logged in on error
      return new Response(
        JSON.stringify({ 
          isLoggedIn: false,
          error: "Failed to verify authentication status"
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};