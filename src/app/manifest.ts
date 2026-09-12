import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KoboRide",
    short_name: "KoboRide",
    description: "Send a package across Yaba on a bike. Pay the rider in cash.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0F3D2E",
    theme_color: "#0F3D2E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcuts: [
      {
        name: "Rider",
        short_name: "Rider",
        description: "Go online and accept jobs",
        url: "/rider",
      },
    ],
  };
}
