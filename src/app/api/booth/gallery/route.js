import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { withDatabase } from "@/lib/mongo";
import schema from "@/lib/schema";

export const dynamic = "force-dynamic";
const batchSize = 12;

export async function GET(request) {
  try {
    const before = new URL(request.url).searchParams.get("before");
    return await withDatabase(async (database) => {
      const submissions = database.collection(schema.submissions.name);
      const baseFilter = { status: "scored", selfieFileId: { $exists: true } };
      const filter = { ...baseFilter };
      if (before && ObjectId.isValid(before)) {
        const current = await submissions.findOne({ _id: new ObjectId(before), ...filter });
        if (current) filter.$or = [
          { createdAt: { $lt: current.createdAt } },
          { createdAt: current.createdAt, _id: { $lt: current._id } },
        ];
      }
      const findBatch = (query) => submissions.find(query, {
        projection: { fullName: 1, fish: 1, selfieFileId: 1, closestMatchFish: 1 },
      }).sort({ createdAt: -1, _id: -1 }).limit(batchSize + 1).toArray();
      let entries = await findBatch(filter);
      if (!entries.length && filter.$or) entries = await findBatch(baseFilter);
      const hasMore = entries.length > batchSize;
      entries = entries.slice(0, batchSize);
      return NextResponse.json({ entries: entries.map((entry) => ({
        id: String(entry._id), fullName: entry.fullName, target: entry.fish,
        selfieUrl: `/api/media/selfie/${entry.selfieFileId}`, match: entry.closestMatchFish,
      })), nextBefore: hasMore ? String(entries.at(-1)._id) : null });
    });
  } catch {
    return NextResponse.json({ error: "Unable to load photo booth results." }, { status: 500 });
  }
}
