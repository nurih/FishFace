import { expect, test } from "bun:test";
import { getAssignment, publicFish } from "../src/lib/fishface";

test("uses static assets for filename-backed fish images", () => {
  expect(publicFish({ _id: "fish-id", species: "fish-001", filename: "fish-001.jpg" }).imageUrl)
    .toBe("/fish/fish-001.jpg");
});

test("replaces a legacy Mongo fish URL with a static fish filename", () => {
  expect(publicFish({ id: "fish-id", species: "fish-009", imageUrl: "/api/media/fish/6a93b7858febb9b5a53e62de" }).imageUrl)
    .toBe("/fish/fish-009.jpg");
});

test("reroll replaces the assigned fish with a different active fish", async () => {
  const existing = { roundId: "round", playerId: "player", fishId: "old-fish" };
  let pipeline;
  let update;
  let assignmentLookups = 0;
  const database = {
    collection(name) {
      if (name === "assignments") return {
        findOne: async () => (++assignmentLookups === 1 ? existing : { ...existing, fishId: "new-fish" }),
        updateOne: async (...args) => { update = args; },
      };
      return {
        aggregate: (value) => {
          pipeline = value;
          return { toArray: async () => [{ _id: "new-fish" }] };
        },
      };
    },
  };

  const assignment = await getAssignment(database, { playerId: "player", fullName: "Name", reroll: true });

  expect(pipeline[0]).toEqual({ $match: { active: true, _id: { $ne: "old-fish" } } });
  expect(update[1].$set.fishId).toBe("new-fish");
  expect(assignment.fishId).toBe("new-fish");
});
