import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { toLeaderboardEntry } from "@/lib/leaderboard";
import { withDatabase } from "@/lib/mongo";
import schema from "@/lib/schema";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });

  try {
    const entry = await withDatabase((database) => database.collection(schema.submissions.name)
      .findOne({ _id: new ObjectId(id), $or: [{ status: "booth" }, { source: "booth" }] }));
    return entry ? NextResponse.json(toLeaderboardEntry(entry)) : new NextResponse(null, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to load this photo booth result." }, { status: 500 });
  }
}
