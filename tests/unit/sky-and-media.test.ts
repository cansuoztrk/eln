import { describe, expect, it } from "vitest";
import { BAKU, distanceKm, ISTANBUL, moonPhase, skyPhase, sunElevation } from "@/lib/dates/sky";
import { baseMime, extensionFor, isAllowed, rejectionReason, sniff, sniffMatches } from "@/lib/media/rules";

describe("the shared sky", () => {
  it("puts the two city centres about 1,760 km apart", () => {
    const km = distanceKm(ISTANBUL, BAKU);
    expect(km).toBeGreaterThan(1730);
    expect(km).toBeLessThan(1790);
    expect(distanceKm(BAKU, ISTANBUL)).toBeCloseTo(km, 6);
  });

  it("has the sun up at local noon and down at local midnight in both cities", () => {
    // 09:00 UTC = 12:00 Istanbul / 13:00 Baku; 21:00 UTC = 00:00 / 01:00.
    const noon = new Date("2026-06-21T09:00:00Z");
    const midnight = new Date("2026-06-21T21:00:00Z");
    for (const city of [ISTANBUL, BAKU]) {
      expect(sunElevation(city, noon)).toBeGreaterThan(50);
      expect(sunElevation(city, midnight)).toBeLessThan(-10);
      expect(skyPhase(city, noon)).toBe("day");
      expect(skyPhase(city, midnight)).toBe("night");
    }
  });

  it("sees the sun rise in Baku before Istanbul", () => {
    const earlyMorning = new Date("2026-03-20T02:30:00Z"); // 06:30 Baku, 05:30 Istanbul
    expect(sunElevation(BAKU, earlyMorning)).toBeGreaterThan(sunElevation(ISTANBUL, earlyMorning));
  });

  it("tracks the moon through known phases", () => {
    // Reference lunations (UTC): new 2026-11-09, full 2026-11-24, new 2026-12-09.
    expect(moonPhase(new Date("2026-11-09T07:00:00Z")).illumination).toBeLessThan(0.03);
    expect(moonPhase(new Date("2026-11-24T14:00:00Z")).illumination).toBeGreaterThan(0.97);
    expect(moonPhase(new Date("2026-11-24T14:00:00Z")).name).toBe("Dolunay");
    expect(moonPhase(new Date("2026-11-16T12:00:00Z")).waxing).toBe(true);
    expect(moonPhase(new Date("2026-12-01T12:00:00Z")).waxing).toBe(false);
    const cycle = moonPhase(new Date("2026-07-01T00:00:00Z")).cycle;
    expect(cycle).toBeGreaterThanOrEqual(0);
    expect(cycle).toBeLessThan(1);
  });
});

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(values.flatMap((v) => (typeof v === "number" ? [v] : [...v].map((c) => c.charCodeAt(0)))).concat(new Array(16).fill(0)));

describe("upload rules", () => {
  it("recognises files by their first bytes, not their names", () => {
    expect(sniff(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniff(bytes(0x89, "PNG"))).toBe("image/png");
    expect(sniff(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
    expect(sniff(bytes("RIFF", 0, 0, 0, 0, "WAVE"))).toBe("audio/wav");
    expect(sniff(bytes(0x1a, 0x45, 0xdf, 0xa3))).toBe("audio/webm");
    expect(sniff(bytes("OggS"))).toBe("audio/ogg");
    expect(sniff(bytes(0, 0, 0, 0x20, "ftyp"))).toBe("audio/mp4");
    expect(sniff(bytes("ID3"))).toBe("audio/mpeg");
    expect(sniff(bytes("<svg"))).toBeNull();
    expect(sniff(bytes("MZ"))).toBeNull();
  });

  it("rejects a file whose content does not match what it claims to be", () => {
    expect(sniffMatches("image/jpeg", "image/jpeg")).toBe(true);
    expect(sniffMatches("image/jpeg", "image/png")).toBe(false);
    expect(sniffMatches("image/png", null)).toBe(false);
    expect(sniffMatches("audio/webm;codecs=opus", "audio/webm")).toBe(true);
    expect(sniffMatches("audio/x-m4a", "audio/mp4")).toBe(true);
    expect(sniffMatches("image/jpeg", "audio/mpeg")).toBe(false);
  });

  it("allows only the listed types and sizes", () => {
    expect(isAllowed("image", "image/jpeg")).toBe(true);
    expect(isAllowed("image", "image/svg+xml")).toBe(false);
    expect(isAllowed("image", "image/heic")).toBe(false);
    expect(isAllowed("image", "audio/webm")).toBe(false);
    expect(isAllowed("audio", "audio/webm;codecs=opus")).toBe(true);
    expect(rejectionReason("image", { type: "image/jpeg", size: 1024 })).toBeNull();
    expect(rejectionReason("image", { type: "image/jpeg", size: 0 })).toMatch(/boş/);
    expect(rejectionReason("image", { type: "image/jpeg", size: 31 * 1024 * 1024 })).toMatch(/büyük/);
    expect(rejectionReason("image", { type: "application/pdf", size: 10 })).toMatch(/JPEG/);
    expect(baseMime("Audio/WebM; codecs=opus")).toBe("audio/webm");
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("text/html")).toBeNull();
  });
});
