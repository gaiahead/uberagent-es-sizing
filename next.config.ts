import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/uberagent-es-sizing",
  images: { unoptimized: true },
};

export default nextConfig;
