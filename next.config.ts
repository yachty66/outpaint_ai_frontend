/** @type {import('next').NextConfig} */

const nextConfig = {
  rewrites: async () => {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/api/:path*"
        }
      ];
    }
    return [];
  },
  images: {
    domains: ['www.stablecharacter.com'],
  }
};

export default nextConfig;