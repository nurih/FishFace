import schema from "./schema";

export const leaderboardSort = {
  targetWon: -1,
  assignedFishRank: 1,
  targetMargin: -1,
  createdAt: 1,
};

export async function rankFish(database, embedding) {
  const fish = database.collection(schema.fish.name);
  const fishCount = await fish.countDocuments({ active: true });
  if (!fishCount) throw new Error("No active fish are available.");
  const index = schema.fish.searchIndexes[0];
  const matches = await fish.aggregate([
    {
      $vectorSearch: {
        index: index.name,
        path: "embedding",
        queryVector: embedding,
        exact: true,
        limit: fishCount,
        filter: { active: true },
      },
    },
    { $project: { species: 1, filename: 1, imageUrl: 1, score: { $meta: "vectorSearchScore" } } },
  ]).toArray();
  return matches;
}

export function scoreAssignedFish(matches, fishId) {
  const rank = matches.findIndex((fish) => String(fish._id) === String(fishId));
  if (rank < 0) throw new Error("Assigned fish was not returned by the vector index.");
  const assignedFish = matches[rank];
  const closestMatchFish = matches[0];
  const bestAlternative = matches.find((fish) => String(fish._id) !== String(fishId));
  return {
    assignedFishSimilarity: assignedFish.score,
    closestCatalogSimilarity: closestMatchFish.score,
    assignedFishRank: rank + 1,
    targetWon: rank === 0,
    targetMargin: assignedFish.score - (bestAlternative?.score ?? 0),
    closestMatchFish,
  };
}
