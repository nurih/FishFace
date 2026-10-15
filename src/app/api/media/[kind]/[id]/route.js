import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { readSelfie, withDatabase } from "@/lib/mongo";

export async function GET(request, { params }) {
  try {
    const { kind, id } = await params;
    if (kind === "selfie") {
      if (!ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });
      const image = await withDatabase((database) => readSelfie(database, id));
      return image ? new NextResponse(image.bytes, { headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=604800, immutable",
      } }) : new NextResponse(null, { status: 404 });
    }
    if (kind !== "fish") return new NextResponse(null, { status: 404 });
    if (!id.startsWith("fish-") || id.includes("/")) return new NextResponse(null, { status: 404 });
    const filename = /\.(jpg|jpeg|png|webp)$/i.test(id) ? id : `${id}.jpg`;
    return NextResponse.redirect(new URL(`/fish/${encodeURIComponent(filename)}`, request.url));
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
