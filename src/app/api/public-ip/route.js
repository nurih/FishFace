import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (!response.ok) throw new Error(`IP lookup failed with ${response.status}`);

    const { ip } = await response.json();
    console.log("API public IP:", ip);
    return NextResponse.json({ ip });
  } catch (error) {
    console.error("Could not determine API public IP:", error);
    return NextResponse.json({ error: "Could not determine API public IP." }, { status: 502 });
  }
}
