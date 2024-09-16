import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Embutidos Mardely",
    short_name: "embmardely",
    description: "Empresa de embutidos Mardely",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/mardely-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/mardely-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
