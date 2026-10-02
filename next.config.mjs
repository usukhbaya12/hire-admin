/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["srv666826.hstgr.cloud", "api.hire.mn", "localhost"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};
export default nextConfig;
