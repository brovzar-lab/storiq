import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mark pdf-parse as an external package to avoid worker bundling issues
  serverExternalPackages: ["pdf-parse"],

  // Set the correct root directory for turbopack to find .env.local
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
