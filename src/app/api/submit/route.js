import { NextResponse } from "next/server";
import { createImageEmbedding } from "@/lib/atlas-ai";
import { getAssignment, publicFish } from "@/lib/fishface";
import { db, uploadSelfie } from "@/lib/mongo";
import { rankFish, scoreAssignedFish } from "@/lib/scoring";
import schema from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const form = await request.formData();
    const playerId = form.get("playerId");
    const fullName = form.get("fullName");
    const image = form.get("image");
    if (!playerId || typeof fullName !== "string" || !fullName.trim() || !(image instanceof File)) {
      return NextResponse.json({ error: "A name, player ID, and selfie are required." }, { status: 400 });
    }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(image.type) || image.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Use a JPEG, PNG, WEBP, or GIF under 20 MB." }, { status: 400 });
    }

    const database = await db();
    const assignment = await getAssignment(database, { playerId, fullName: fullName.trim() });
    const fish = await database.collection(schema.fish.name).findOne({ _id: assignment.fishId });
    const bytes = Buffer.from(await image.arrayBuffer());
    const selfieFileId = await uploadSelfie(bytes, image.type);
    const embedding = await createImageEmbedding({ bytes, contentType: image.type });
    const expectedDimensions = schema.fish.searchIndexes[0].definition.fields[0].numDimensions;
    if (embedding.length !== expectedDimensions) {
      throw new Error(`Embedding has ${embedding.length} dimensions; expected ${expectedDimensions}.`);
    }
    const scores = scoreAssignedFish(await rankFish(database, embedding), assignment.fishId);
    const result = await database.collection(schema.submissions.name).insertOne({
      roundId: assignment.round.id, playerId, fullName: fullName.trim(), fish: publicFish(fish),
      fishId: assignment.fishId, selfieFileId, embedding, status: "scored", ...scores, createdAt: new Date(),
    });
    return NextResponse.json({ id: String(result.insertedId), fish: publicFish(fish), ...scores });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to score this selfie." }, { status: 500 });
  }
}
