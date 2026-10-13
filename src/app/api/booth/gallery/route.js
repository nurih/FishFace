import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { withDatabase } from "@/lib/mongo";
import schema from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const before = new URL(request.url).searchParams.get("before");
    return await withDatabase(async (database) => {
      const submissions = database.collection(schema.submissions.name);
      const filter = { status: "scored", source: "booth" };
      if (before && ObjectId.isValid(before)) {
        const current = await submissions.findOne({ _id: new ObjectId(before), ...filter });
        if (current) filter.$or = [
          { createdAt: { $lt: current.createdAt } },
          { createdAt: current.createdAt, _id: { $lt: current._id } },
        ];
      }
      let entry = await submissions.findOne(filter, { sort: { createdAt: -1, _id: -1 } });
      if (!entry && filter.$or) entry = await submissions.findOne({ status: "scored", source: "booth" }, { sort: { createdAt: -1, _id: -1 } });
      return NextResponse.json({ entry: entry ? {
        id: String(entry._id), fullName: entry.fullName, target: entry.fish,
        selfieUrl: `/api/media/selfie/${entry.selfieFileId}`, match: entry.closestMatchFish,
      } : null });
    });
  } catch {
    return NextResponse.json({ error: "Unable to load photo booth results." }, { status: 500 });
  }
}
