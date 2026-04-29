/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["cdn.example.com"], // Add your CDN domains here
    },
    typescript: {
        tsconfigPath: "./tsconfig.json",
    },
};

export default nextConfig;
