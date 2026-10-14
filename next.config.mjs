/** @type {import('next').NextConfig} */
const nextConfig = process.env.GH_STATIC_EXPORT ? {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_SITE_BASE_PATH || "",
  trailingSlash: true,
} : {
  async redirects() {
    return [{
      source: "/booth/result/:id",
      destination: "/booth/result?id=:id",
      permanent: true,
    }];
  },
};

export default nextConfig;
