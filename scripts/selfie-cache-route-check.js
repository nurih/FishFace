import { expect, mock, test } from "bun:test";
import { ObjectId } from "mongodb";

const id = String(new ObjectId());
mock.module("@/lib/mongo", () => ({
  withDatabase: async (work) => work({}),
  readSelfie: async (_, fileId) => fileId === id
    ? { bytes: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" } : null,
}));
const { GET } = await import("../src/app/api/media/[kind]/[id]/route.js");

test("selfies have seven-day immutable browser caching", async () => {
  const response = await GET(new Request(`http://localhost/api/media/selfie/${id}`), {
    params: Promise.resolve({ kind: "selfie", id }),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, max-age=604800, immutable");
  expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
});

test("missing selfies do not receive the seven-day cache policy", async () => {
  const response = await GET(new Request("http://localhost/api/media/selfie/missing"), {
    params: Promise.resolve({ kind: "selfie", id: String(new ObjectId()) }),
  });
  expect(response.status).toBe(404);
  expect(response.headers.get("Cache-Control")).toBeNull();
});
