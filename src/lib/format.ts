const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("fr-FR");

/** Taille lisible à la française : « 245 Ko », « 1,2 Mo ». */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${integer.format(bytes)} octet${bytes > 1 ? "s" : ""}`;
  if (bytes < 1024 * 1024) return `${number.format(bytes / 1024)} Ko`;
  return `${number.format(bytes / 1024 / 1024)} Mo`;
}

export function formatInteger(n: number): string {
  return integer.format(n);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  return `${number.format(ms / 1000)} s`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Garde le début et la fin d'une longue valeur hexadécimale. */
export function shorten(hex: string, head = 8, tail = 6): string {
  return hex.length <= head + tail + 3 ? hex : `${hex.slice(0, head)}...${hex.slice(-tail)}`;
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
