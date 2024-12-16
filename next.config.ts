/** @type {import('next').NextConfig} */

const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/py/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  images: {
    domains: ["outpaintingai.s3.us-east-1.amazonaws.com"],
  },
};

export default nextConfig;
