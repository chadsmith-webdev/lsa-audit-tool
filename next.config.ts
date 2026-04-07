import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/free-local-seo-audit",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
