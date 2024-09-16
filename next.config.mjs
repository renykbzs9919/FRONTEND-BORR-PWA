import withPWA from 'next-pwa';
import { serviceWorker } from 'next-service-worker';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

// Configuración de PWA
const withPWAConfig = withPWA({
    dest: 'public',
    disable: false,
    register: true,
    skipWaiting: true,
});

// Configuración de Service Worker con next-service-worker
const withServiceWorker = serviceWorker();

// Combina ambas configuraciones
const combinedConfig = withServiceWorker(withPWAConfig(nextConfig));

export default combinedConfig;
