"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CategoryArt } from "./category-art";

/**
 * Ürün görseli: farklı en-boy oranlarında düzen bozulmaz (object-contain, sabit kutu), tembel
 * yükleme, yükleme hatasında kategori illüstrasyonuna düşer. Mağaza CDN'lerinden gelen görseller
 * doğrudan gösterilir (görsel işleme sunucumuzda yapılmaz; güvenli ve kota dostu).
 */
export function ProductImage({ src, alt, icon, className, priority = false }: { src: string | null; alt: string; icon: string | null; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed || !/^https:\/\//.test(src)) return <CategoryArt icon={icon} className={className} label={alt} />;
  return (
    <div className={cn("relative h-full w-full bg-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain p-3"
      />
    </div>
  );
}
