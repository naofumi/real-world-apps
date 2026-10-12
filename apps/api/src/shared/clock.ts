export function nowIso(): string {
  return new Date().toISOString();
}

export function nextIso(previous: string): string {
  const now = Date.now();
  const prev = Date.parse(previous);
  return new Date(now > prev ? now : prev + 1).toISOString();
}
