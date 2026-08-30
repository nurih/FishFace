import { NextResponse } from "next/server";
import { GridFSBucket, ObjectId } from "mongodb";
import { getRound } from "@/lib/round";
import { db } from "@/lib/mongo";
import { leaderboardSort } from "@/lib/scoring";
import { toLeaderboardEntry } from "@/lib/leaderboard";
import schema from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const round = getRound();
    const playerId = new URL(request.url).searchParams.get("playerId");
    const submissions = (await db()).collection(schema.submissions.name);
    const [entries, currentEntry] = await Promise.all([
      submissions.aggregate([
        { $match: { roundId: round.id, status: "scored" } },
        { $sort: leaderboardSort },
        { $limit: 50 },
      ]).toArray(),
      playerId ? submissions.findOne({ roundId: round.id, status: "scored", playerId }, { sort: { createdAt: -1 } }) : null,
    ]);
    return NextResponse.json({
      round: { id: round.id, endsAt: round.endsAt },
      currentEntry: currentEntry ? toLeaderboardEntry(currentEntry) : null,
      entries: entries.map(toLeaderboardEntry),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "A valid leaderboard entry is required." }, { status: 400 });
    const database = await db();
    const submissions = database.collection(schema.submissions.name);
    const entry = await submissions.findOne({ _id: new ObjectId(id) });
    if (!entry) return NextResponse.json({ error: "Leaderboard entry not found." }, { status: 404 });
    await submissions.deleteOne({ _id: entry._id });
    if (entry.selfieFileId) {
      const bucket = new GridFSBucket(database, { bucketName: schema.selfiesFiles.name.replace(".files", "") });
      await bucket.delete(entry.selfieFileId);
    }
    return NextResponse.json({ deleted: String(entry._id) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to delete leaderboard entry." }, { status: 500 });
  }
}
