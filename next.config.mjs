/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Sources are already WebP; skipping AVIF keeps first-request encoding fast.
    formats: ["image/webp"],
    qualities: [75, 85],
  },
};

export default nextConfig;
