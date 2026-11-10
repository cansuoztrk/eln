import { Sparkle } from "@/components/decor";

/** A calm pause while a room is being prepared. */
export default function Loading() {
  return (
    <div role="status" aria-label="Yükleniyor" className="flex min-h-dvh items-center justify-center">
      <Sparkle className="size-5 animate-twinkle text-rose" />
    </div>
  );
}
