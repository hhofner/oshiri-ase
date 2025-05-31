import { Handlers } from "$fresh/server.ts";

// In-memory storage for drip count
// In a real application, you'd use a database
let dripCount = 0;

// We'll initialize the count from the API request rather than at module load time
// This avoids issues with the server not being ready when this module loads

export const handler: Handlers = {
  // Get current drip count
  async GET(req) {
    // Always fetch pins to get the accurate count
    // This ensures the count is always up-to-date
    const url = new URL(req.url);
    try {
      const response = await fetch(`${url.origin}/api/pins`);
      if (response.ok) {
        const pins = await response.json();
        // If pins count is greater than our stored count, update it
        if (pins.length > dripCount) {
          dripCount = pins.length;
        }
      }
    } catch (error) {
      console.error("Error fetching pins for drip count:", error);
      // Continue with existing count if fetch fails
    }
    
    return new Response(JSON.stringify({ count: dripCount }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  
  // Increment drip count
  POST(req) {
    try {
      // Increment the count
      dripCount++;
      
      return new Response(
        JSON.stringify({
          success: true,
          count: dripCount
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error) {
      console.error("Error incrementing drip count:", error);
      return new Response(
        JSON.stringify({ error: "Failed to increment drip count" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};