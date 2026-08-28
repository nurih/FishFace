import { NextResponse } from "next/server";
import { getAssignment, publicFish } from "@/lib/fishface";
import { db } from "@/lib/mongo";
import schema from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { playerId, fullName, reroll } = await request.json();
    if (!playerId || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "A full name and player ID are required." }, { status: 400 });
    }
    const assignment = await getAssignment(await db(), { playerId, fullName: fullName.trim(), reroll: Boolean(reroll) });
    const fish = await (await db()).collection(schema.fish.name).findOne({ _id: assignment.fishId });
    return NextResponse.json({
      round: { id: assignment.round.id, endsAt: assignment.round.endsAt },
      fish: publicFish(fish),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
