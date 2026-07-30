/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If your GitHub Pages URL is https://<username>.github.io/AeroCAD_Studio, uncomment the line below:
  // basePath: process.env.NODE_ENV === 'production' ? '/AeroCAD_Studio' : '',
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
