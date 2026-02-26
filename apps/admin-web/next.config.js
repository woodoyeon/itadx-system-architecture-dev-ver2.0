/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `http://localhost:${process.env.GATEWAY_API_PORT || 4003}/api/:path*` },
    ];
  },
};
module.exports = nextConfig;
