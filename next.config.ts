import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker build sets BUILD_STANDALONE=1 for a self-contained server bundle; plain `next start` keeps working.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  experimental: {
    agentFeedback: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
