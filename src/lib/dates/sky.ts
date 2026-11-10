/**
 * The shared sky. Small astronomy for the Beyond Distance page: where the sun
 * is over each city and what the moon looks like tonight.
 *
 * The coordinates are the public centres of two cities, written here as
 * constants. Nothing on the site ever asks for or stores anyone's location.
 */

export type City = { key: "istanbul" | "baku"; latitude: number; longitude: number };

export const ISTANBUL: City = { key: "istanbul", latitude: 41.0082, longitude: 28.9784 };
export const BAKU: City = { key: "baku", latitude: 40.4093, longitude: 49.8671 };

const RAD = Math.PI / 180;

/** Great-circle distance between two points, in kilometres. */
export function distanceKm(a: City, b: City): number {
  const dLat = (b.latitude - a.latitude) * RAD;
  const dLon = (b.longitude - a.longitude) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * RAD) * Math.cos(b.latitude * RAD) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function julianDay(instant: Date): number {
  return instant.getTime() / 86_400_000 + 2440587.5;
}

/** Elevation of the sun above the horizon, in degrees (NOAA approximation). */
export function sunElevation(city: City, instant: Date): number {
  const n = julianDay(instant) - 2451545.0;
  const meanLongitude = (280.46 + 0.9856474 * n) % 360;
  const meanAnomaly = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );

  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const localSidereal = (gmst * 15 + city.longitude) * RAD;
  const hourAngle = localSidereal - rightAscension;

  const lat = city.latitude * RAD;
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle),
  );
  return elevation / RAD;
}

export type SkyPhase = "night" | "dawn" | "day" | "dusk";

/**
 * Night below −6° (civil twilight), day above +6°. In between it is dawn
 * while the sun climbs and dusk while it sinks.
 */
export function skyPhase(city: City, instant: Date): SkyPhase {
  const now = sunElevation(city, instant);
  if (now <= -6) return "night";
  if (now >= 6) return "day";
  const soon = sunElevation(city, new Date(instant.getTime() + 10 * 60_000));
  return soon > now ? "dawn" : "dusk";
}

export const SKY_PHASE_TR: Record<SkyPhase, string> = {
  night: "gece",
  dawn: "gün doğuyor",
  day: "gündüz",
  dusk: "gün batıyor",
};

const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 6 January 2000, 18:14 UTC. */
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);

export type MoonPhase = {
  /** 0 = new, 0.5 = full, back to 1 = new. */
  cycle: number;
  /** Lit fraction of the disc, 0..1. */
  illumination: number;
  waxing: boolean;
  name: string;
};

/** The same moon over both cities — its phase does not depend on where you stand. */
export function moonPhase(instant: Date): MoonPhase {
  const days = (instant.getTime() - NEW_MOON_EPOCH) / 86_400_000;
  const cycle = (((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH;
  const illumination = (1 - Math.cos(2 * Math.PI * cycle)) / 2;

  const name =
    cycle < 0.03 || cycle > 0.97
      ? "Yeni ay"
      : cycle < 0.22
        ? "Hilal"
        : cycle < 0.28
          ? "İlk dördün"
          : cycle < 0.47
            ? "Şişkin ay"
            : cycle < 0.53
              ? "Dolunay"
              : cycle < 0.72
                ? "Küçülen ay"
                : cycle < 0.78
                  ? "Son dördün"
                  : "Son hilal";

  return { cycle, illumination, waxing: cycle < 0.5, name };
}
