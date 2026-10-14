import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const stage = path.join(root, ".tmp", "gh-static");
const output = path.join(root, "out");
const apiOrigin = process.env.FISHFACE_API_ORIGIN?.replace(/\/$/, "");
const basePath = process.env.FISHFACE_BASE_PATH ?? `/${process.env.GITHUB_REPOSITORY?.split("/").at(-1) || "FishFace"}`;

if (!apiOrigin || new URL(apiOrigin).origin !== apiOrigin) {
  throw new Error("Set FISHFACE_API_ORIGIN to the Azure Function App origin.");
}
if (basePath && !/^\/[\w-]+$/.test(basePath)) {
  throw new Error("FISHFACE_BASE_PATH must be empty or one path segment.");
}

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
for (const name of ["src", "public"]) await cp(path.join(root, name), path.join(stage, name), { recursive: true });
await mkdir(path.join(stage, "data"));
for (const name of ["package.json", "jsconfig.json", "next.config.mjs"]) {
  await cp(path.join(root, name), path.join(stage, name));
}
await cp(path.join(root, "data", "schema.json"), path.join(stage, "data", "schema.json"));
for (const name of ["src/app/api", "src/app/contact-sheet", "src/middleware.js"]) {
  await rm(path.join(stage, name), { recursive: true, force: true });
}

const cssFile = path.join(stage, "src", "app", "globals.css");
const css = await readFile(cssFile, "utf8");
await writeFile(cssFile, css.replaceAll('url("/', `url("${basePath}/`));

const build = Bun.spawn([process.execPath, "run", "build"], {
  cwd: stage,
  env: {
    ...process.env,
    GH_STATIC_EXPORT: "1",
    NEXT_PUBLIC_API_ORIGIN: apiOrigin,
    NEXT_PUBLIC_SITE_BASE_PATH: basePath,
  },
  stdout: "inherit",
  stderr: "inherit",
});
const exitCode = await build.exited;
if (exitCode) process.exit(exitCode);

await rm(output, { recursive: true, force: true });
await cp(path.join(stage, "out"), output, { recursive: true });
const notFoundFile = path.join(output, "404.html");
const notFound = await readFile(notFoundFile, "utf8");
const resultRedirect = `<script>
(() => {
  const resultPath = ${JSON.stringify(`${basePath}/booth/result`)};
  const pathname = window.location.pathname;
  if (!pathname.startsWith(resultPath + "/")) return;
  const id = pathname.slice(resultPath.length + 1).replace(/\\/$/, "");
  if (!id || id.includes("/")) return;
  const query = new URLSearchParams(window.location.search);
  query.set("id", decodeURIComponent(id));
  window.location.replace(resultPath + "/?" + query + window.location.hash);
})();
</script>`;
await writeFile(notFoundFile, notFound.replace("<head>", "<head>" + resultRedirect));
await writeFile(path.join(output, ".nojekyll"), "");
await rm(stage, { recursive: true });
console.log(`Static site written to ${output}`);
