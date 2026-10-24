import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/hesap", "/git/", "/api/", "/ara", "/ucak-bileti/ara", "/giris", "/kayit", "/favoriler", "/test-baglanti"] }],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
