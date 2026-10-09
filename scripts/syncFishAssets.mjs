const sourceDirectory = "data/fish/images";
const targetDirectory = "public/fish";
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

for await (const filename of new Bun.Glob("fish-*").scan({ cwd: sourceDirectory, onlyFiles: true })) {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!supportedExtensions.has(extension)) continue;
  await Bun.write(`${targetDirectory}/${filename}`, Bun.file(`${sourceDirectory}/${filename}`));
}
