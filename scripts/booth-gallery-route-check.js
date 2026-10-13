import { expect, mock, test } from "bun:test";
import { ObjectId } from "mongodb";

const date = new Date("2026-10-12T12:00:00Z");
const fish = { species: "Fish", imageUrl: "/fish.jpg" };
const entries = [1, 2, 3].map((number) => ({
  _id: new ObjectId(), createdAt: new Date(date.getTime() + number * 1000),
  status: "scored", source: "booth", fullName: `Player ${number}`,
  fish, closestMatchFish: fish, selfieFileId: new ObjectId(), targetMargin: 0.5,
}));
entries.push({ ...entries[2], _id: new ObjectId(), source: "main", createdAt: new Date(date.getTime() + 4000) });

const submissions = {
  findOne: async (filter, options) => {
    if (filter._id) return entries.find((entry) => entry._id.equals(filter._id) && entry.status === filter.status && entry.source === filter.source) || null;
    return entries.filter((entry) => entry.status === filter.status && entry.source === filter.source && (!filter.$or ||
      entry.createdAt < filter.$or[0].createdAt.$lt ||
      (entry.createdAt.getTime() === filter.$or[1].createdAt.getTime() && entry._id.toString() < filter.$or[1]._id.$lt.toString())))
      .sort((a, b) => b.createdAt - a.createdAt || b._id.toString().localeCompare(a._id.toString()))[0] || null;
  },
};
mock.module("@/lib/mongo", () => ({ withDatabase: async (work) => work({ collection: () => submissions }) }));
const { GET } = await import("../src/app/api/booth/gallery/route.js");

test("gallery moves newest to oldest, then queries the newest again without scores", async () => {
  let before = "";
  for (const expected of [3, 2, 1, 3]) {
    const response = await GET(new Request(`http://localhost/api/booth/gallery${before ? `?before=${before}` : ""}`));
    expect(response.status).toBe(200);
    const { entry } = await response.json();
    expect(entry.fullName).toBe(`Player ${expected}`);
    expect(entry.targetMargin).toBeUndefined();
    before = entry.id;
  }
});


