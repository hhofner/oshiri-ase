import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component, url }: PageProps) {
  const origin = url.origin;
  const ogImageUrl = `${origin}/api/og-image`;
  
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>お尻汗</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍑</text></svg>" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="お尻汗 - Oshiri Ase Counter" />
        <meta property="og:description" content="Counting the number of times sweat has dripped down the crack of a butt" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="お尻汗 - Oshiri Ase Counter" />
        <meta name="twitter:description" content="Counting the number of times sweat has dripped down the crack of a butt" />
        <meta name="twitter:image" content={ogImageUrl} />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
