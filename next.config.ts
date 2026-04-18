/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // Verhindert, dass der Build bei Fehlern abbricht
    ignoreBuildErrors: true,
  },
  eslint: {
    // Verhindert, dass ESLint den Build stoppt
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;