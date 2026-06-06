import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mark pdf-parse as an external package to avoid worker bundling issues
  serverExternalPackages: ["pdf-parse"],

  // Set root to parent dir so the .agent symlink target is within Turbopack's filesystem boundary
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  // Exclude the .agent symlink (points outside project root) from output tracing
  outputFileTracingExcludes: {
    "*": [".agent/**"],
  },

  // Exclude .agent from webpack's file watcher to avoid symlink escape issues
  webpack(config) {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored)
          ? config.watchOptions.ignored
          : config.watchOptions?.ignored
            ? [config.watchOptions.ignored]
            : []),
        "**/\\.agent/**",
      ],
    };
    return config;
  },
};

export default nextConfig;
