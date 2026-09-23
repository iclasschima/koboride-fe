import type { MetadataRoute } from "next";
import { COMPANY_DESCRIPTION, COMPANY_NAME } from "@/lib/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: COMPANY_NAME,
    short_name: COMPANY_NAME,
    description: COMPANY_DESCRIPTION,
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
