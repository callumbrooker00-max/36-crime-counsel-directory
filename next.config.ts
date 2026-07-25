import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Belt-and-braces noindex for the whole portal (NFR-11): a header covers
  // non-HTML responses too, alongside the <meta robots> tag in the layout.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
