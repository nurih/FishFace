import { readdir } from "node:fs/promises";
import { basename, extname } from "node:path";
import { MongoClient } from "mongodb";
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
  await prepareCollections(database);
  await createFishDocuments(database);
} finally {
  await client.close();
}

async function createFishDocuments(database) {
  const imageDirectory = new URL("../data/fish/images/", import.meta.url);
  const fishCollection = database.collection(schema.fish.name);
  for (const filename of await readdir(imageDirectory)) {
    console.log(`*** ${filename}`)
    const contentType = contentTypes[extname(filename).toLowerCase()];

    if (!filename.startsWith("fish-")) {
      console.log(`...Skipping ${filename}. Does not start with "fish-"`)
      continue;
    }
    if (!contentType) {
      console.log(`...Skipping ${filename}. Unsupported file type."`)
      continue;
    }
    if (await fishCollection.findOne({ filename })) {
      console.log(`...Skipping ${filename}. Already there."`)
      continue;
    }

    const bytes = Buffer.from(await Bun.file(new URL(filename, imageDirectory)).arrayBuffer());
    const embedding = await createImageEmbedding({ bytes, contentType });
    await fishCollection.insertOne({
      filename,
      species: basename(filename, extname(filename)),
      active: true,
      embedding,
      createdAt: new Date(),
    });
    console.log(`Created ${filename}`);
  }
}

async function prepareCollections(database) {
  for (const { name, indexes = [], searchIndexes = [] } of Object.values(schema)) {
    const collection = database.collection(name);
    await collection.drop();
    for (const { key, options } of indexes) await collection.createIndex(key, options);
    for (const index of searchIndexes) await collection.createSearchIndex(index);
    console.log(`Seeded indexes for ${name}.`);
  }
}
