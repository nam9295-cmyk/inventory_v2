import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "초코창고",
    short_name: "초코창고",
    description: "Very Good Chocolate inventory",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8e6",
    theme_color: "#f7c948",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
