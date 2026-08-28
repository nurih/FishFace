import { NextResponse } from "next/server";
import { ObjectId, GridFSBucket } from "mongodb";
import { db, readSelfie } from "@/lib/mongo";
import schema from "@/lib/schema";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { kind, id } = await params;
    if (!ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });
    if (kind === "selfie") {
      const image = await readSelfie(id);
      return image ? new NextResponse(image.bytes, { headers: { "Content-Type": image.contentType } }) : new NextResponse(null, { status: 404 });
    }
    if (kind !== "fish") return new NextResponse(null, { status: 404 });
    const database = await db();
    const fish = await database.collection(schema.fish.name).findOne({ _id: new ObjectId(id) });
    if (!fish) return new NextResponse(null, { status: 404 });
    const file = fish.imageFileId ? null : await database.collection(schema.fishFiles.name).findOne({ filename: fish.filename });
    const imageFileId = fish.imageFileId || file?._id;
    if (!imageFileId) return new NextResponse(null, { status: 404 });
    const bucket = new GridFSBucket(database, { bucketName: schema.fish.name });
    const chunks = [];
    await new Promise((resolve, reject) => bucket.openDownloadStream(imageFileId)
      .on("data", (chunk) => chunks.push(chunk)).on("error", reject).on("end", resolve));
    return new NextResponse(Buffer.concat(chunks), { headers: { "Content-Type": fish.imageContentType || file?.contentType || "image/jpeg" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
