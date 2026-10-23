type ClassValue = string | false | null | undefined | 0 | ClassValue[];

/** Koşullu sınıf adlarını birleştirir. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(v);
  };
  values.forEach(walk);
  return out.join(" ");
}
