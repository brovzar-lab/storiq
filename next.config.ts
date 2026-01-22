import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the correct root directory for turbopack to find .env.local
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
