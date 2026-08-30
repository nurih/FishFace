import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { basename, extname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { readSelfie } from "@/lib/mongo";

export const runtime = "nodejs";

const fishImageDirectory = join(process.cwd(), "data", "fish", "images");
const contentTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_request, { params }) {
  try {
    const { kind, id } = await params;
    if (kind === "selfie") {
      if (!ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });
      const image = await readSelfie(id);
      return image ? new NextResponse(image.bytes, { headers: { "Content-Type": image.contentType } }) : new NextResponse(null, { status: 404 });
    }
    if (kind !== "fish") return new NextResponse(null, { status: 404 });
    const imageName = basename(id);
    if (imageName !== id || !imageName.startsWith("fish-")) return new NextResponse(null, { status: 404 });
    const extension = extname(imageName).toLowerCase();
    const candidates = extension ? [imageName] : Object.keys(contentTypes).map((candidate) => `${imageName}${candidate}`);
    for (const filename of candidates) {
      const contentType = contentTypes[extname(filename).toLowerCase()];
      if (!contentType) continue;
      try {
        return new NextResponse(await readFile(join(fishImageDirectory, filename)), { headers: { "Content-Type": contentType } });
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    return new NextResponse(null, { status: 404 });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
