import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
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
        ],
        disallow: ["/dashboard/", "/admin/", "/api/", "/properties/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
