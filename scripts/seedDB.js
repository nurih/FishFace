import { readdir } from "node:fs/promises";
import { basename, extname } from "node:path";
import { GridFSBucket, MongoClient } from "mongodb";
import { createImageEmbedding } from "../src/lib/atlas-ai.js";
import schema from "../data/schema.json" with { type: "json" };

['MONGO_URL',
  'MONGODB_DB',
  'MONGODB_ATLAS_AI_API_KEY'
].forEach(key => {
  if (!process.env[key]) { throw Error(`${key} is not configured`) }
})

const contentTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const client = new MongoClient(process.env.MONGO_URL);

try {
  const database = client.db(process.env.MONGODB_DB);
  await createFishDocuments(database);
  await prepareCollections(database);
  await uploadImages(database);
} finally {
  await client.close();
}

async function createFishDocuments(database) {
  const imageDirectory = new URL("../data/fish/images/", import.meta.url);
  const fish = database.collection(schema.fish.name);
  for (const filename of await readdir(imageDirectory)) {
    const contentType = contentTypes[extname(filename).toLowerCase()];
    if (!filename.startsWith("fish-") || !contentType || await fish.findOne({ filename })) continue;
    const bytes = Buffer.from(await Bun.file(new URL(filename, imageDirectory)).arrayBuffer());
    const embedding = await createImageEmbedding({ bytes, contentType });
    await fish.insertOne({
      filename,
      species: basename(filename, extname(filename)),
      active: true,
      embedding,
      createdAt: new Date(),
    });
    console.log(`Created ${filename}`);
  }
}

async function uploadImages(database) {
  const imageDirectory = new URL("../data/fish/images/", import.meta.url);
  const bucket = new GridFSBucket(database, { bucketName: schema.fish.name });
  const fishFiles = database.collection(schema.fishFiles.name);
  const fish = database.collection(schema.fish.name);
  for (const filename of await readdir(imageDirectory)) {
    const contentType = contentTypes[extname(filename).toLowerCase()];
    if (!filename.startsWith("fish-") || !contentType) continue;
    let file = await fishFiles.findOne({ filename });
    if (!file) {
      const bytes = Buffer.from(await Bun.file(new URL(filename, imageDirectory)).arrayBuffer());
      const stream = bucket.openUploadStream(filename, { contentType });
      await new Promise((resolve, reject) => stream.on("error", reject).on("finish", resolve).end(bytes));
      file = await fishFiles.findOne({ filename });
      console.log(`Uploaded ${filename}`);
    }
    await fish.updateOne(
      { filename },
      { $set: { imageFileId: file._id, imageContentType: contentType } },
    );
  }
}

async function prepareCollections(database) {
  for (const { name, indexes = [], searchIndexes = [] } of Object.values(schema)) {
    const collection = database.collection(name);
    for (const { key, options } of indexes) await collection.createIndex(key, options);
    for (const index of searchIndexes) await collection.createSearchIndex(index);
    console.log(`Seeded indexes for ${name}.`);
  }
}
