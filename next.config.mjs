/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "srv666826.hstgr.cloud",
      "api.hire-test.cloud",
      "api.hire.mn",
      "localhost",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};
export default nextConfig;
