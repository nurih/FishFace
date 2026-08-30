export const ROUND_MS = 4 * 60 * 60 * 1000;

export function getRound(date = new Date()) {
  const startMs = Math.floor(date.getTime() / ROUND_MS) * ROUND_MS;
  return {
    id: new Date(startMs).toISOString(),
    startsAt: new Date(startMs),
    endsAt: new Date(startMs + ROUND_MS),
  };
}
