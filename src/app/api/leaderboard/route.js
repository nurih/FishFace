import { NextResponse } from "next/server";
import { db } from "@/lib/mongo";
import { leaderboardLimit, latestSubmissionSort, toLeaderboardEntry } from "@/lib/leaderboard";
import { leaderboardSort } from "@/lib/scoring";
import schema from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const playerId = new URL(request.url).searchParams.get("playerId");
    const submissions = (await db()).collection(schema.submissions.name);
    const [entries, currentEntry] = await Promise.all([
      submissions.aggregate([
        { $match: { status: "scored" } },
        { $sort: latestSubmissionSort },
        { $limit: leaderboardLimit },
        { $sort: leaderboardSort },
      ]).toArray(),
      playerId ? submissions.findOne({ status: "scored", playerId }, { sort: { createdAt: -1 } }) : null,
    ]);
    return NextResponse.json({
      currentEntry: currentEntry ? toLeaderboardEntry(currentEntry) : null,
      entries: entries.map(toLeaderboardEntry),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
