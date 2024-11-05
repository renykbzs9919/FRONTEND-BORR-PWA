import withPWAInit from "@ducanh2912/next-pwa";
/** @type {import('next').NextConfig} */



const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cacha todos los GET de la API, incluyendo rutas dinámicas con IDs
        urlPattern: /^https:\/\/back-borr-pwa-production\.up\.railway\.app\/api\/.*$/,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-get-cache',
          expiration: {
            maxEntries: 200, // Número máximo de entradas en la caché
            maxAgeSeconds: 7 * 24 * 60 * 60, // Duración de 7 días
          },
          networkTimeoutSeconds: 10, // Tiempo de espera antes de usar la caché
        },
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
