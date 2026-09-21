import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "qvbkqgsvagfutwznrlzw.supabase.co";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "turfske.vercel.app" }],
        destination: "https://turfske.co.ke/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;