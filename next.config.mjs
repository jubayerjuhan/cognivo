/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep pdf-parse out of the webpack bundle (it reads files at require time).
    serverComponentsExternalPackages: ["pdf-parse", "mongoose"],
  },
};

export default nextConfig;
