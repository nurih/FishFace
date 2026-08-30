import { expect, test } from "bun:test";
import { toLeaderboardEntry } from "../src/lib/leaderboard";

test("returns the target-relative leaderboard payload", () => {
  const entry = toLeaderboardEntry({
    _id: "submission", fullName: "Nuri", selfieFileId: "selfie",
    fish: { id: "target", species: "Target fish", imageUrl: "/target.jpg" },
    closestMatchFish: { id: "best", species: "Best fish", imageUrl: "/best.jpg" },
    targetWon: false, assignedFishRank: 3, targetMargin: -0.024,
  });
  expect(entry).toEqual({
    id: "submission", fullName: "Nuri", imageUrl: "/api/media/selfie/selfie",
    fish: { id: "target", species: "Target fish", imageUrl: "/target.jpg" },
    closestMatchFish: { id: "best", species: "Best fish", imageUrl: "/best.jpg" },
    targetWon: false, assignedFishRank: 3, targetMargin: -0.024,
  });
});

test("normalizes legacy stored fish URLs to filesystem image URLs", () => {
  const entry = toLeaderboardEntry({
    _id: "submission", selfieFileId: "selfie",
    fish: { id: "target", species: "fish-009", imageUrl: "/api/media/fish/old-target" },
    closestMatchFish: { id: "best", species: "fish-010", imageUrl: "/api/media/fish/old-best" },
  });
  expect(entry.fish.imageUrl).toBe("/api/media/fish/fish-009");
  expect(entry.closestMatchFish.imageUrl).toBe("/api/media/fish/fish-010");
});
