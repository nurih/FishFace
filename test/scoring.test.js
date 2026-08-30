import { expect, test } from "bun:test";
import { leaderboardSort, scoreAssignedFish } from "../src/lib/scoring";

test("stores a losing target's closest fish, rank, and margin", () => {
  const scores = scoreAssignedFish([
    { _id: "closest", species: "Closer fish", score: 0.91 },
    { _id: "assigned", score: 0.76 },
  ], "assigned");
  expect(scores.assignedFishSimilarity).toBe(0.76);
  expect(scores.closestCatalogSimilarity).toBe(0.91);
  expect(scores.assignedFishRank).toBe(2);
  expect(scores.targetWon).toBe(false);
  expect(scores.targetMargin).toBeCloseTo(-0.15);
  expect(scores.closestMatchFish).toMatchObject({ _id: "closest", species: "Closer fish" });
});

test("makes a target win when it is the closest fish", () => {
  const scores = scoreAssignedFish([
    { _id: "assigned", score: 0.91 },
    { _id: "other", score: 0.76 },
  ], "assigned");
  expect(scores.targetWon).toBe(true);
  expect(scores.assignedFishRank).toBe(1);
  expect(scores.targetMargin).toBeCloseTo(0.15);
  expect(scores.closestMatchFish._id).toBe("assigned");
});

test("defines leaderboard ordering by win, rank, and margin", () => {
  expect(leaderboardSort).toEqual({ targetWon: -1, assignedFishRank: 1, targetMargin: -1, createdAt: 1 });
});

test("rejects a target absent from ranked fish", () => {
  expect(() => scoreAssignedFish([], "assigned")).toThrow("Assigned fish");
});
