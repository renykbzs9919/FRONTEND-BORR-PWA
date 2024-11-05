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
        // Caching for all GET requests to your API
        urlPattern: /^https:\/\/back-borr-pwa-production\.up\.railway\.app\/api\/.*$/,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-get-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 día
          },
        },
      },
      {
        // Handling POST, PUT, and DELETE requests with background sync
        urlPattern: /^https:\/\/back-borr-pwa-production\.up\.railway\.app\/api\/.*$/,
        handler: 'NetworkOnly',
        method: ['POST', 'PUT', 'DELETE'],
        options: {
          backgroundSync: {
            name: 'api-queue',
            options: {
              maxRetentionTime: 24 * 60, // 24 horas
            },
          },
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
