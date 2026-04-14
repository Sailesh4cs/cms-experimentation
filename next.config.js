/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brandportal.ingkacentres.com",
      },
    ],
  },
};

module.exports = nextConfig;