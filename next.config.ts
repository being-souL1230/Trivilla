import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.2"],

  experimental: {
    // Inline critical CSS into HTML — eliminates render-blocking CSS requests.
    // Works best with Tailwind's small CSS footprint.
    inlineCss: true,
  },

  // Cache headers for static assets (fonts, images under /_next/static)
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // External image domains for next/image (if used) — keep ready
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.imimg.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "tse1.mm.bing.net" },
      { protocol: "https", hostname: "tse2.mm.bing.net" },
      { protocol: "https", hostname: "tse3.mm.bing.net" },
      { protocol: "https", hostname: "tse4.mm.bing.net" },
      { protocol: "https", hostname: "recipes.timesofindia.com" },
      { protocol: "https", hostname: "th.bing.com" },
      { protocol: "https", hostname: "masalaandchai.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "bakeitwithlove.com" },
      { protocol: "https", hostname: "rahicafe.com" },
      { protocol: "https", hostname: "4.imimg.com" },
      { protocol: "https", hostname: "5.imimg.com" },
      { protocol: "https", hostname: "thehappyfoodie.co.uk" },
      { protocol: "https", hostname: "maharajaroyaldining.com" },
      { protocol: "https", hostname: "www.indianhealthyrecipes.com" },
      { protocol: "https", hostname: "static.vecteezy.com" },
      { protocol: "https", hostname: "tse1.explicit.bing.net" },
      { protocol: "https", hostname: "tse3.explicit.bing.net" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;