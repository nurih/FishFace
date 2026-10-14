import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { withDatabase } from "@/lib/mongo";
import schema from "@/lib/schema";

export async function POST(_request, { params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });

  try {
    const published = await withDatabase(async (database) => {
      const submissions = database.collection(schema.submissions.name);
      const _id = new ObjectId(id);
      return await submissions.findOneAndUpdate(
        { _id, status: "booth" },
        { $set: { status: "scored", source: "booth", publishedAt: new Date() } },
        { returnDocument: "after" },
      ) || await submissions.findOne({ _id, status: "scored", source: "booth" });
    });
    return published ? NextResponse.json({ id }) : new NextResponse(null, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to add this result to the leaderboard." }, { status: 500 });
  }
}
