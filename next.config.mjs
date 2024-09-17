import withPWA from 'next-pwa';

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

// Configuración de PWA para cachear todo
const withPWAConfig = withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development', // Desactivar PWA en desarrollo
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https?.*/, // Cachear todas las rutas HTTP(S)
            handler: 'CacheFirst', // Estrategia: Prioridad al cache
            options: {
                cacheName: 'http-calls', // Nombre del caché para todas las solicitudes HTTP
                expiration: {
                    maxEntries: 500, // Limitar el número de entradas en caché
                    maxAgeSeconds: 60 * 60 * 24 * 30, // Mantener en cache durante 30 días
                },
                cacheableResponse: {
                    statuses: [0, 200], // Cachea respuestas con códigos de estado 0 o 200
                },
            },
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, // Cachear todas las imágenes
            handler: 'CacheFirst', // Prioridad al cache
            options: {
                cacheName: 'images-cache',
                expiration: {
                    maxEntries: 200, // Limitar el número de imágenes cacheadas
                    maxAgeSeconds: 60 * 60 * 24 * 30, // Cache por 30 días
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
        {
            urlPattern: /\/_next\/static\/.*/, // Cachear archivos estáticos generados por Next.js
            handler: 'CacheFirst',
            options: {
                cacheName: 'static-next-cache',
                expiration: {
                    maxEntries: 100, // Limitar el número de archivos estáticos
                    maxAgeSeconds: 60 * 60 * 24 * 30, // Cache por 30 días
                },
            },
        },
    ],
});



// Combina ambas configuraciones
const combinedConfig = withPWAConfig(nextConfig);

export default combinedConfig;
