
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Allow images from Firebase Storage
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.istockphoto.com', // Added for istockphoto
        port: '',
        pathname: '/**',
      }
    ],
  },
  output: 'standalone', // Required for optimized Docker builds
};

export default nextConfig;
