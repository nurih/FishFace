import { apiFetch } from "./api-client";

export function createGalleryCache(fetchBatch, now = Date.now) {
  let entries = [];
  let nextBefore = null;
  let index = 0;
  let refreshedAt = null;
  let pending = null;
  let version = 0;

  async function load(before) {
    const data = await fetchBatch(before);
    const known = new Set(entries.map((entry) => entry.id));
    if (before) {
      entries.push(...data.entries.filter((entry) => !known.has(entry.id)));
      nextBefore = data.nextBefore;
    } else {
      const currentId = entries[index]?.id;
      const nextIndex = entries.length && index >= 0
        ? index + data.entries.filter((entry) => !known.has(entry.id)).length : 0;
      const latestIds = new Set(data.entries.map((entry) => entry.id));
      if (!entries.length) nextBefore = data.nextBefore;
      entries = [...data.entries, ...entries.filter((entry) => !latestIds.has(entry.id))];
      index = currentId ? entries.findIndex((entry) => entry.id === currentId) : nextIndex;
    }
  }

  async function refresh() {
    if (pending) await pending;
    if (refreshedAt !== null && now() - refreshedAt < 60000) return;
    const startedVersion = version;
    pending = load(null);
    try {
      await pending;
      if (version === startedVersion) refreshedAt = now();
    } finally { pending = null; }
  }

  return {
    refresh,
    invalidate() {
      version += 1;
      refreshedAt = null;
      index = -1;
    },
    async next() {
      if (pending) await pending;
      if (refreshedAt === null) await refresh();
      if (index >= entries.length && nextBefore) {
        pending = load(nextBefore);
        try { await pending; } finally { pending = null; }
      }
      if (index >= entries.length) index = 0;
      return entries[index++] || null;
    },
  };
}

export const boothGalleryCache = createGalleryCache(async (before) => {
  if (document.hidden) throw new Error("Gallery is paused.");
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const response = await apiFetch(`/api/booth/gallery${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load gallery.");
  return response.json();
});
