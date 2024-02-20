/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        proxyTimeout: 1000 * 60 * 10, // 10 minutes
    },
    async rewrites() {
        // rewrite all /api requests to localhost:4000
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_COMFYUI_LAUNCHER_SERVER_URL}/:path*`,
            },
        ];
    }
};

export default nextConfig;
