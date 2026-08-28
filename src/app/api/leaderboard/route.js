import { NextResponse } from "next/server";
import { getRound } from "@/lib/round";
import { db } from "@/lib/mongo";
import schema from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toEntry(entry) {
  return {
    id: String(entry._id), fullName: entry.fullName, fish: entry.fish,
    score: entry.assignedFishSimilarity, closestCatalogSimilarity: entry.closestCatalogSimilarity,
    assignedFishRank: entry.assignedFishRank, imageUrl: `/api/media/selfie/${entry.selfieFileId}`,
  };
}

export async function GET(request) {
  try {
    const round = getRound();
    const playerId = new URL(request.url).searchParams.get("playerId");
    const submissions = (await db()).collection(schema.submissions.name);
    const [entries, currentEntry] = await Promise.all([
      submissions.aggregate([
        { $match: { roundId: round.id, status: "scored" } },
        { $sort: { assignedFishSimilarity: -1, createdAt: 1 } },
        { $limit: 50 },
      ]).toArray(),
      playerId ? submissions.findOne({ roundId: round.id, status: "scored", playerId }, { sort: { createdAt: -1 } }) : null,
    ]);
    return NextResponse.json({
      round: { id: round.id, endsAt: round.endsAt },
      currentEntry: currentEntry ? toEntry(currentEntry) : null,
      entries: entries.map(toEntry),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
