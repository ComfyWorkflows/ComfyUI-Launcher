/** @type {import('next').NextConfig} */
const nextConfig = {
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
