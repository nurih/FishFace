import { expect, test } from "bun:test";
import { getRound } from "../src/lib/round";

test("round starts on a UTC four-hour boundary", () => {
  const round = getRound(new Date("2026-08-23T07:59:59.999Z"));
  expect(round.id).toBe("2026-08-23T04:00:00.000Z");
  expect(round.endsAt.toISOString()).toBe("2026-08-23T08:00:00.000Z");
});

test("round advances at its end", () => {
  expect(getRound(new Date("2026-08-23T08:00:00.000Z")).id).toBe("2026-08-23T08:00:00.000Z");
});
