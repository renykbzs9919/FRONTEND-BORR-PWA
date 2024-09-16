import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // Ignorar errores de ESLint durante el build
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Ignorar errores de TypeScript durante el build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Otras configuraciones adicionales
};

// Configuración para PWA
const withPWAConfig = withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
})(nextConfig);

export default withPWAConfig;
