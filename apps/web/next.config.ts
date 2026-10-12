import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shugo-protocol/sdk"],
  // ... any other config you have
};

export default nextConfig;