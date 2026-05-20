import type { MetadataRoute } from "next";

const BASE_URL = "https://changelifemarketing.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    "/",
    "/about",
    "/products",
    "/businessplans",
    "/contact",
    "/legal",
    "/auth/login",
    "/auth/forgotpassword",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}