import schema from "./schema";

export async function createImageEmbedding({ bytes, contentType }) {
  const key = process.env.MONGODB_ATLAS_AI_API_KEY;
  if (!key) throw new Error("MONGODB_ATLAS_AI_API_KEY is not configured.");

  const imageBase64 = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  const response = await fetch(schema.fish.embedding.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: [{ content: [{ type: "image_base64", image_base64: imageBase64 }] }],
      model: schema.fish.embedding.model,
      input_type: schema.fish.embedding.inputType,
      truncation: schema.fish.embedding.truncation,
      output_encoding: schema.fish.embedding.outputEncoding,
    }),
  });

  const body = await response.json();
  if (!response.ok || !Array.isArray(body.data?.[0]?.embedding)) {
    throw new Error(body.detail || "Atlas could not create an image embedding.");
  }
  return body.data[0].embedding;
}
