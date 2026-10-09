import { getRound } from "./round";
import schema from "./schema";

export async function getAssignment(database, { playerId, fullName, reroll = false }) {
  const round = getRound();
  const assignments = database.collection(schema.assignments.name);
  const existing = await assignments.findOne({ roundId: round.id, playerId });
  if (existing && !reroll) return { ...existing, round };

  const [fish] = await database.collection(schema.fish.name).aggregate([
    { $match: { active: true, ...(existing ? { _id: { $ne: existing.fishId } } : {}) } },
    { $sample: { size: 1 } },
    { $project: { species: 1, imageUrl: 1, imageFileId: 1 } },
  ]).toArray();
  if (!fish) throw new Error("No active fish are available.");

  const assignment = {
    roundId: round.id,
    playerId,
    fullName,
    fishId: fish._id,
    createdAt: new Date(),
  };
  await assignments.updateOne({ roundId: round.id, playerId }, existing ? { $set: assignment } : { $setOnInsert: assignment }, { upsert: true });
  return { ...(await assignments.findOne({ roundId: round.id, playerId })), round };
}

export function publicFish(fish) {
  const localImageName = fish.filename || (fish.species?.startsWith("fish-") ? `${fish.species}.jpg` : null);
  return {
    id: String(fish._id ?? fish.id),
    species: fish.species,
    imageUrl: localImageName ? `/fish/${encodeURIComponent(localImageName)}` : fish.imageUrl || null,
  };
}
