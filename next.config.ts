import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  /* keep any other settings you might already have in here */
};

export default nextConfig;