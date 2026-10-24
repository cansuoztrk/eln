"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 16 }}>
          <h1 style={{ fontSize: 24 }}>Hizmet geçici olarak kullanılamıyor</h1>
          <p style={{ color: "#555" }}>Veritabanına veya bir bağımlı servise erişilemiyor olabilir. Lütfen birkaç dakika sonra tekrar deneyin.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: 0, background: "#3a55e6", color: "#fff", fontWeight: 600 }}>
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
