"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** What `signImages` on the server returns for one photo. */
export type DisplayImage = {
  assetId: string;
  width: number;
  height: number;
  placeholder: string | null;
  thumb: string;
  medium: string;
  large: string;
};

type Props = {
  image: DisplayImage;
  /** Describe the photo. Pass "" only when it is purely decorative. */
  alt: string;
  /** How wide the image is laid out, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  /** Load immediately — only for the one image that opens a page. */
  priority?: boolean;
  /** `natural` keeps the photo's own proportions; `fill` covers its parent. */
  mode?: "natural" | "fill";
  fit?: "cover" | "contain";
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
};

/**
 * A real photograph: blurred preview first, then the sharpest variant the
 * layout needs, fading in once it has loaded. Variants are pre-generated and
 * metadata-free; the URLs are short-lived and signed.
 */
export function SmartImage({
  image,
  alt,
  sizes,
  priority,
  mode = "natural",
  fit = "cover",
  className,
  imgClassName,
  style,
}: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // An image that finished before hydration never fires onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);

  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : undefined;

  return (
    <div
      className={cn("relative overflow-hidden bg-beige", mode === "fill" && "size-full", className)}
      style={{ ...(mode === "natural" && ratio ? { aspectRatio: ratio } : null), ...style }}
    >
      {image.placeholder ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny inline preview
        <img
          src={image.placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-full scale-110 object-cover blur-xl transition-opacity duration-700",
            loaded ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-taupe">
          Fotoğraf şu an yüklenemedi. Sayfayı yenilemek yeterli olur.
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- signed, pre-sized variants; the Next optimizer must not proxy private media
        <img
          ref={ref}
          src={image.medium}
          srcSet={`${image.thumb} 520w, ${image.medium} 1280w, ${image.large} 2400w`}
          sizes={sizes}
          alt={alt}
          width={image.width || undefined}
          height={image.height || undefined}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "relative size-full transition-opacity duration-700 ease-soft",
            fit === "cover" ? "object-cover" : "object-contain",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
