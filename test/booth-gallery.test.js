import { expect, test } from "bun:test";

test("booth gallery cycles through published results", async () => {
  const process = Bun.spawn(["bun", "test", "./scripts/booth-gallery-route-check.js"], {
    cwd: import.meta.dir + "/..", stdout: "pipe", stderr: "pipe",
  });
  const [output, errors, exitCode] = await Promise.all([
    new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited,
  ]);
  expect(exitCode, `${output}\n${errors}`).toBe(0);
});
