import { expect, mock, test } from "bun:test";
import { ObjectId } from "mongodb";

const date = new Date("2026-10-12T12:00:00Z");
const fish = { species: "Fish", imageUrl: "/fish.jpg" };
const entries = Array.from({ length: 14 }, (_, index) => ({
  _id: new ObjectId(), createdAt: new Date(date.getTime() + index * 1000),
  status: "scored", source: index === 13 ? "booth" : "main", fullName: `Player ${index + 1}`,
  fish, closestMatchFish: fish, selfieFileId: new ObjectId(), targetMargin: 0.5,
}));
entries.push({ ...entries[13], _id: new ObjectId(), source: "main", fullName: "Newest game",
  createdAt: new Date(date.getTime() + 14000) });

function matches(entry, filter) {
  return entry.status === filter.status && (!filter.source || entry.source === filter.source) &&
    (!filter.selfieFileId?.$exists || Boolean(entry.selfieFileId)) &&
    (!filter._id || entry._id.equals(filter._id)) && (!filter.$or ||
      entry.createdAt < filter.$or[0].createdAt.$lt ||
      (entry.createdAt.getTime() === filter.$or[1].createdAt.getTime() && entry._id.toString() < filter.$or[1]._id.$lt.toString()));
}

const submissions = {
  findOne: async (filter) => entries.find((entry) => matches(entry, filter)) || null,
  find: (filter) => ({
    sort: () => ({ limit: (count) => ({ toArray: async () => entries.filter((entry) => matches(entry, filter))
      .sort((a, b) => b.createdAt - a.createdAt || b._id.toString().localeCompare(a._id.toString()))
      .slice(0, count) }) }),
  }),
};
mock.module("@/lib/mongo", () => ({ withDatabase: async (work) => work({ collection: () => submissions }) }));
const { GET } = await import("../src/app/api/booth/gallery/route.js");

test("gallery batches published booth and game selfies, then wraps", async () => {
  const first = await (await GET(new Request("http://localhost/api/booth/gallery"))).json();
  expect(first.entries.map((entry) => entry.fullName)).toEqual(
    ["Newest game", ...Array.from({ length: 11 }, (_, index) => `Player ${14 - index}`)],
  );
  expect(first.entries[0].targetMargin).toBeUndefined();
  expect(first.nextBefore).toBe(first.entries.at(-1).id);

  const second = await (await GET(new Request(`http://localhost/api/booth/gallery?before=${first.nextBefore}`))).json();
  expect(second.entries.map((entry) => entry.fullName)).toEqual(["Player 3", "Player 2", "Player 1"]);
  expect(second.nextBefore).toBeNull();

  const wrapped = await (await GET(new Request(`http://localhost/api/booth/gallery?before=${second.entries.at(-1).id}`))).json();
  expect(wrapped.entries[0].fullName).toBe("Newest game");
});

test("gallery excludes unpublished booth selfies", async () => {
  entries.push({ ...entries[13], _id: new ObjectId(), status: "booth", fullName: "Unpublished",
    createdAt: new Date(date.getTime() + 15000) });
  try {
    const response = await GET(new Request("http://localhost/api/booth/gallery"));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.entries[0].fullName).toBe("Newest game");
    expect(result.entries.some((entry) => entry.fullName === "Unpublished")).toBe(false);
  } finally {
    entries.pop();
  }
});
