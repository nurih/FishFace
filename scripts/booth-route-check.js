import { expect, mock, test } from "bun:test";
import { ObjectId } from "mongodb";

const fishId = new ObjectId();
const selfieFileId = new ObjectId();
const resultId = new ObjectId();
const fish = { _id: fishId, species: "fish-one", imageUrl: "/fish/fish-one.jpg" };
let inserted;
let boothQuery;
let leaderboardPipeline;
let publishCount = 0;

const submissions = {
  insertOne: async (document) => { inserted = document; return { insertedId: resultId }; },
  findOne: async (query) => {
    boothQuery = query;
    if (query._id && !query._id.equals(resultId)) return null;
    if (query.status && query.status !== inserted.status) return null;
    if (query.source && query.source !== inserted.source) return null;
    if (query.$or && !query.$or.some((filter) => Object.entries(filter).every(([key, value]) => inserted[key] === value))) return null;
    return { _id: resultId, ...inserted };
  },
  findOneAndUpdate: async (query, update) => {
    if (query.status !== inserted.status) return null;
    inserted = { ...inserted, ...update.$set };
    publishCount += 1;
    return { _id: resultId, ...inserted };
  },
  aggregate: (pipeline) => {
    leaderboardPipeline = pipeline;
    return { toArray: async () => inserted?.status === pipeline[0].$match.status ? [{ _id: resultId, ...inserted }] : [] };
  },
};
const database = { collection: (name) => name === "fish" ? { findOne: async () => fish } : submissions };

mock.module("@/lib/atlas-ai", () => ({ createImageEmbedding: async () => Array(1024).fill(0) }));
mock.module("@/lib/fishface", () => ({
  getAssignment: async () => ({ fishId, round: { id: "round" } }),
  publicFish: (value) => ({ id: String(value._id ?? value.id), species: value.species, imageUrl: value.imageUrl }),
}));
mock.module("@/lib/mongo", () => ({
  withDatabase: async (work) => work(database),
  uploadSelfie: async () => selfieFileId,
}));
mock.module("@/lib/scoring", () => ({
  rankFish: async () => [],
  scoreAssignedFish: () => ({
    closestMatchFish: fish, assignedFishRank: 1, targetWon: true, targetMargin: 0.2,
    assignedFishSimilarity: 0.9, closestCatalogSimilarity: 0.9,
  }),
  leaderboardSort: { targetWon: -1 },
}));

const { POST } = await import("../src/app/api/submit/route.js");
const { GET: getBooth } = await import("../src/app/api/booth/[id]/route.js");
const { POST: publishBooth } = await import("../src/app/api/booth/[id]/publish/route.js");
const { GET: getLeaderboard } = await import("../src/app/api/leaderboard/route.js");

test("End Turn adds the saved booth result once to the shared leaderboard", async () => {
  const form = new FormData();
  form.append("playerId", "booth-player");
  form.append("fullName", "Ada");
  form.append("image", new File(["image"], "selfie.jpg", { type: "image/jpeg" }));
  form.append("booth", "true");

  const saved = await POST(new Request("http://localhost/api/submit", { method: "POST", body: form }));
  expect(saved.status).toBe(200);
  expect((await saved.json()).id).toBe(String(resultId));
  expect(inserted.status).toBe("booth");
  expect(inserted.source).toBe("booth");
  expect(inserted.fullName).toBe("Ada");
  expect(inserted.selfieFileId).toEqual(selfieFileId);

  const reopened = await getBooth(null, { params: Promise.resolve({ id: String(resultId) }) });
  expect(reopened.status).toBe(200);
  expect(boothQuery.$or).toEqual([{ status: "booth" }, { status: "scored" }, { source: "booth" }]);
  const savedResult = await reopened.json();
  expect(savedResult.fullName).toBe("Ada");
  expect(savedResult.imageUrl).toBe(`/api/media/selfie/${selfieFileId}`);

  const before = await getLeaderboard(new Request("http://localhost/api/leaderboard"));
  expect((await before.json()).entries).toHaveLength(0);

  const params = { params: Promise.resolve({ id: String(resultId) }) };
  expect((await publishBooth(null, params)).status).toBe(200);
  expect((await publishBooth(null, params)).status).toBe(200);
  expect(publishCount).toBe(1);
  expect(inserted.status).toBe("scored");
  expect((await getBooth(null, params)).status).toBe(200);

  const after = await getLeaderboard(new Request("http://localhost/api/leaderboard"));
  expect((await after.json()).entries).toHaveLength(1);
  expect(leaderboardPipeline[0]).toEqual({ $match: { status: "scored" } });
});

test("booth permalink rejects an invalid ID", async () => {
  expect((await getBooth(null, { params: Promise.resolve({ id: "invalid" }) })).status).toBe(404);
});

test("a scored game result opens by submission ID, not selfie file ID", async () => {
  const form = new FormData();
  form.append("playerId", "game-player");
  form.append("fullName", "Ada");
  form.append("image", new File(["image"], "selfie.jpg", { type: "image/jpeg" }));
  form.append("publish", "true");

  const saved = await POST(new Request("http://localhost/api/submit", { method: "POST", body: form }));
  expect(saved.status).toBe(200);
  const { id } = await saved.json();
  expect(id).toBe(String(resultId));
  expect(inserted.status).toBe("scored");
  expect(inserted.source).toBeUndefined();

  const reopened = await getBooth(null, { params: Promise.resolve({ id }) });
  expect(reopened.status).toBe(200);
  expect((await reopened.json()).imageUrl).toBe(`/api/media/selfie/${selfieFileId}`);
  expect((await getBooth(null, { params: Promise.resolve({ id: String(selfieFileId) }) })).status).toBe(404);
});
