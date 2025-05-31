import { Handlers } from "$fresh/server.ts";
import { clearAuthCookies } from "../../../utils/mastodon.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // Create the response
      const response = new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      // Clear authentication cookies
      clearAuthCookies(response);
      
      return response;
    } catch (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({ error: "Logout failed" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};