import { expect, test } from "bun:test";

test("hosted API responses use static fish images and Azure selfies", async () => {
  const originalOrigin = process.env.NEXT_PUBLIC_API_ORIGIN;
  const originalBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH;
  const originalFetch = globalThis.fetch;
  try {
    process.env.NEXT_PUBLIC_API_ORIGIN = "https://fishface.example.com";
    process.env.NEXT_PUBLIC_SITE_BASE_PATH = "/FishFace";
    const { apiFetch } = await import("../src/lib/api-client.js?hosted");
    globalThis.fetch = async (url) => {
      expect(url).toBe("https://fishface.example.com/api/leaderboard");
      return Response.json({ entries: [{
        fish: { imageUrl: "/api/media/fish/fish-005.jpg" },
        closestMatchFish: { imageUrl: "/fish/fish-008.jpg" },
        imageUrl: "/api/media/selfie/selfie-id",
      }] });
    };
    const response = await apiFetch("/api/leaderboard");
    expect(await response.json()).toEqual({ entries: [{
      fish: { imageUrl: "/FishFace/fish/fish-005.jpg" },
      closestMatchFish: { imageUrl: "/FishFace/fish/fish-008.jpg" },
      imageUrl: "https://fishface.example.com/api/media/selfie/selfie-id",
    }] });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalOrigin === undefined) delete process.env.NEXT_PUBLIC_API_ORIGIN;
    else process.env.NEXT_PUBLIC_API_ORIGIN = originalOrigin;
    if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_SITE_BASE_PATH;
    else process.env.NEXT_PUBLIC_SITE_BASE_PATH = originalBasePath;
  }
});
