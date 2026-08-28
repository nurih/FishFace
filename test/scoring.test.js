import { expect, test } from "bun:test";
import { scoreAssignedFish } from "../src/lib/scoring";

test("stores all ranking measures for the assigned fish", () => {
  const scores = scoreAssignedFish([
    { _id: "closest", score: 0.91 },
    { _id: "assigned", score: 0.76 },
  ], "assigned");
  expect(scores).toEqual({
    assignedFishSimilarity: 0.76,
    closestCatalogSimilarity: 0.91,
    assignedFishRank: 2,
  });
});

test("rejects a target absent from ranked fish", () => {
  expect(() => scoreAssignedFish([], "assigned")).toThrow("Assigned fish");
});
