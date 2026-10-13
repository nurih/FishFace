import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { isLocalhost } from "@/lib/local-only";
import { withDatabase } from "@/lib/mongo";
import schema from "@/lib/schema";

export const dynamic = "force-dynamic";
const pageSize = 48;
const hidden = () => new NextResponse(null, { status: 404 });

export async function GET(request) {
  if (!isLocalhost(request.headers)) return hidden();
  const page = Number(new URL(request.url).searchParams.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1 || (page - 1) * pageSize > Number.MAX_SAFE_INTEGER) {
    return NextResponse.json({ error: "Invalid page." }, { status: 400 });
  }
  try {
    const result = await withDatabase(async (database) => {
      const submissions = database.collection(schema.submissions.name);
      const filter = { selfieFileId: { $exists: true } };
      const [total, entries] = await Promise.all([
        submissions.countDocuments(filter),
        submissions.find(filter, { projection: { selfieFileId: 1 } })
          .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      ]);
      return { page, pages: Math.max(1, Math.ceil(total / pageSize)), entries: entries.map((entry) => ({
        id: String(entry._id), imageUrl: `/api/media/selfie/${entry.selfieFileId}`,
      })) };
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load selfies." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isLocalhost(request.headers)) return hidden();
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) return hidden();
    } catch { return hidden(); }
  }
  let id;
  try { ({ id } = await request.json()); } catch { /* Invalid body. */ }
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return hidden();
  try {
    const deleted = await withDatabase(async (database) => {
      const submissions = database.collection(schema.submissions.name);
      const entry = await submissions.findOne({ _id: new ObjectId(id), selfieFileId: { $exists: true } });
      if (!entry) return false;
      const bucket = new GridFSBucket(database, { bucketName: schema.selfiesFiles.name.replace(".files", "") });
      await bucket.delete(entry.selfieFileId);
      await submissions.deleteOne({ _id: entry._id });
      return true;
    });
    return deleted ? NextResponse.json({ deleted: true }) : hidden();
  } catch {
    return NextResponse.json({ error: "Unable to delete selfie." }, { status: 500 });
  }
}
