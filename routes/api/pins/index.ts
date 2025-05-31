import { Handlers } from "$fresh/server.ts";
import { getAuthFromCookies, fetchUserAccount } from "../../../utils/mastodon.ts";

// In-memory storage for pins
// In a real application, you'd use a database
const pins: Record<string, {
  id: string;
  userId: string;
  username: string;
  lat: number;
  lng: number;
  timestamp: number;
}> = {};

export const handler: Handlers = {
  // Get all pins
  async GET() {
    try {
      const pinsList = Object.values(pins).map(pin => ({
        id: pin.id,
        username: pin.username,
        lat: pin.lat,
        lng: pin.lng,
        timestamp: pin.timestamp
      }));
      
      return new Response(JSON.stringify(pinsList), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error("Error fetching pins:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pins" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  },
  
  // Add a new pin
  async POST(req) {
    try {
      // Check authentication
      const { token } = getAuthFromCookies(req);
      
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
      
      // Get user info
      const user = await fetchUserAccount(token.access_token);
      
      // Parse request body
      const body = await req.json();
      const { lat, lng } = body;
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return new Response(
          JSON.stringify({ error: "Invalid coordinates" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
      
      // Generate pin ID
      const pinId = crypto.randomUUID();
      
      // Store the pin
      pins[pinId] = {
        id: pinId,
        userId: user.id,
        username: user.username,
        lat,
        lng,
        timestamp: Date.now()
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          pin: {
            id: pinId,
            username: user.username,
            lat,
            lng
          }
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error) {
      console.error("Error creating pin:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create pin" }),
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