import { Handlers } from "$fresh/server.ts";

// Function to get the total number of drips
async function getTotalDrips(req: Request): Promise<number> {
  try {
    // Get the host from the request
    const url = new URL(req.url);
    // Get the drip count from the dedicated API endpoint using the same host
    const response = await fetch(`${url.origin}/api/drip-count`);
    if (response.ok) {
      const data = await response.json();
      return data.count;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching drip count for OG image:", error);
    return 0;
  }
}

// Function to generate SVG for OG image
function generateSvgImage(count: number): string {
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="630" fill="#f0f9ff" />
      
      <!-- Sweat Emoji -->
      <text x="600" y="200" font-size="120" text-anchor="middle" dominant-baseline="middle">💦</text>
      
      <!-- Count -->
      <text x="600" y="350" font-size="160" font-weight="bold" fill="#0ea5e9" text-anchor="middle" dominant-baseline="middle">${count}</text>
      
      <!-- Title -->
      <text x="600" y="450" font-size="80" font-weight="500" fill="#0ea5e9" text-anchor="middle" dominant-baseline="middle">お尻汗</text>
      
      <!-- Description line 1 -->
      <text x="600" y="520" font-size="40" fill="#334155" text-anchor="middle" dominant-baseline="middle">Counting the number of times sweat has</text>
      
      <!-- Description line 2 -->
      <text x="600" y="570" font-size="40" fill="#334155" text-anchor="middle" dominant-baseline="middle">dripped down the crack of a butt</text>
    </svg>
  `;
}

export const handler: Handlers = {
  async GET(req) {
    try {
      const count = await getTotalDrips(req);
      
      // Generate the SVG
      const svgContent = generateSvgImage(count);
      
      // Return the SVG with appropriate headers
      return new Response(svgContent, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=60, s-maxage=60",
        }
      });
    } catch (error) {
      console.error("Error generating OG image:", error);
      return new Response("Error generating image", { status: 500 });
    }
  },
};