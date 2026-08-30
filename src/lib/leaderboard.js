import { publicFish } from "./fishface";

export function toLeaderboardEntry(entry) {
  return {
    id: String(entry._id), fullName: entry.fullName, fish: publicFish(entry.fish),
    closestMatchFish: publicFish(entry.closestMatchFish), targetWon: entry.targetWon,
    targetMargin: entry.targetMargin, assignedFishRank: entry.assignedFishRank,
    imageUrl: `/api/media/selfie/${entry.selfieFileId}`,
  };
}
