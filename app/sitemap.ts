import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app";
  const now = new Date();

  const publicRoutes = [
    "",
    "/about",
    "/how-it-works",
    "/pricing",
    "/security",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/disclaimer",
    "/acceptable-use",
    "/refund-policy",
    "/data-processing",
    "/login",
    "/register",
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/pricing") ? 0.9 : 0.7,
  }));
}
