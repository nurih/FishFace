import { expect, test } from "bun:test";
import { createGalleryCache } from "../src/lib/booth-gallery-cache";

const entry = (id) => ({ id });

test("gallery loads older pages only as needed and loops without requests", async () => {
  const calls = [];
  const cache = createGalleryCache(async (before) => {
    calls.push(before);
    return before ? { entries: [entry("c")], nextBefore: null }
      : { entries: [entry("a"), entry("b")], nextBefore: "b" };
  });
  const shown = [];
  for (let index = 0; index < 7; index++) shown.push((await cache.next()).id);
  expect(shown).toEqual(["a", "b", "c", "a", "b", "c", "a"]);
  expect(calls).toEqual([null, "b"]);
});

test("refresh is deduplicated, waits 60 seconds, and preserves pagination", async () => {
  let time = 0;
  const calls = [];
  const cache = createGalleryCache(async (before) => {
    calls.push(before);
    return before ? { entries: [entry("c")], nextBefore: null }
      : { entries: time ? [entry("new"), entry("a")] : [entry("a"), entry("b")], nextBefore: "b" };
  }, () => time);
  await Promise.all([cache.refresh(), cache.refresh()]);
  expect((await cache.next()).id).toBe("a");
  expect((await cache.next()).id).toBe("b");
  time = 59999;
  await cache.refresh();
  expect(calls).toEqual([null]);
  time = 60000;
  await cache.refresh();
  expect((await cache.next()).id).toBe("c");
  expect((await cache.next()).id).toBe("new");
  expect(calls).toEqual([null, null, "b"]);
});

test("publish invalidation refreshes immediately and displays the newest entry", async () => {
  let published = false;
  let calls = 0;
  const cache = createGalleryCache(async () => {
    calls++;
    return { entries: published ? [entry("new"), entry("a")] : [entry("a")], nextBefore: null };
  });
  await cache.next();
  published = true;
  cache.invalidate();
  expect((await cache.next()).id).toBe("new");
  expect((await cache.next()).id).toBe("a");
  expect((await cache.next()).id).toBe("new");
  expect(calls).toBe(2);
});

test("failed refresh keeps cached slides available", async () => {
  let time = 0;
  const cache = createGalleryCache(async () => {
    if (time) throw new Error("Offline");
    return { entries: [entry("a")], nextBefore: null };
  }, () => time);
  await cache.next();
  time = 60000;
  await expect(cache.refresh()).rejects.toThrow("Offline");
  expect((await cache.next()).id).toBe("a");
});
