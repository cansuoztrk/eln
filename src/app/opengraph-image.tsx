import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const alt = `${brand.name} — gerçekten avantajlı fiyatlar`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0a0c10", color: "#eaedf2", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#3a55e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800 }}>
            {/* Radar işareti SVG ile çizilir: yazı tipinde olmayan bir glif dış font indirmesini tetikler */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="19" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" />
              <circle cx="22" cy="22" r="10" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="3" />
              <path d="M22 22 L37 13" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <circle cx="22" cy="22" r="3.5" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>{brand.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>İyi fiyatı arama.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: "#9cadff" }}>Gerçekten avantajlı olanı gör.</div>
        </div>
        <div style={{ fontSize: 28, color: "#aab2bf" }}>Kargo dâhil karşılaştırma · doğrulanmış fiyat geçmişi · uçak bileti fırsatları</div>
      </div>
    ),
    size,
  );
}
