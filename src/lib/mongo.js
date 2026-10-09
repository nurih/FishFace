import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import schema from "./schema";

export async function withDatabase(work) {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured.");
  const client = new MongoClient(process.env.MONGO_URL);
  try {
    await client.connect();
    return await work(client.db(process.env.MONGODB_DB || "fishface"));
  } finally {
    await client.close();
  }
}

export async function uploadSelfie(database, bytes, contentType) {
  const bucket = new GridFSBucket(database, { bucketName: schema.selfiesFiles.name.replace(".files", "") });
  const stream = bucket.openUploadStream(`selfie-${crypto.randomUUID()}.jpg`, {
    contentType,
  });
  await new Promise((resolve, reject) => {
    stream.on("error", reject).on("finish", resolve).end(bytes);
  });
  return stream.id;
}

export async function readSelfie(database, id) {
  const bucket = new GridFSBucket(database, { bucketName: schema.selfiesFiles.name.replace(".files", "") });
  const files = await database.collection(schema.selfiesFiles.name).find({ _id: new ObjectId(id) }).toArray();
  if (!files[0]) return null;
  const chunks = [];
  await new Promise((resolve, reject) => {
    bucket.openDownloadStream(files[0]._id)
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return { bytes: Buffer.concat(chunks), contentType: files[0].contentType || "image/jpeg" };
}
