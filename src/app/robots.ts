import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/rider", "/trips", "/profile"],
    },
    sitemap: "https://www.koboride.ng/sitemap.xml",
  };
}
