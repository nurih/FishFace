# FishFace

Webcam fish impersonation game. Built with Bun, Next.js, MongoDB Atlas, Atlas multimodal embeddings, Atlas Vector Search, and the MongoDB driver.

## Run

```powershell
Copy-Item .env.example .env.local
bun install
bun run dev
```

Set `MONGO_URL`, `MONGODB_ATLAS_AI_API_KEY`, and the Atlas database name. Create a MongoDB Atlas model API key for the server-side multimodal embedding request.

## MongoDB setup

The app uses the database named by `MONGODB_DB` (defaults to `fishface`) and these collections:

- `fish`: preprocessed active fish documents and their embeddings.
- `assignments`: one assigned fish per player and four-hour round.
- `submissions`: scored selfie attempts and leaderboard data.
- `selfies.files` and `selfies.chunks`: GridFS bucket holding submitted selfies.

Fish images normally use the `imageUrl` field. If a fish instead has an `imageFileId`, the app reads it from the optional `fish.files` and `fish.chunks` GridFS bucket.

## Fish catalog

Preprocess and insert each catalog fish with this shape:

```json
{
  "species": "Pufferfish",
  "active": true,
  "imageUrl": "https://example.com/pufferfish.jpg",
  "embedding": [0.01]
}
```

Generate fish embeddings with Atlas's `voyage-multimodal-3.5` model using `input_type: null`, the same model and mode used for selfies. Create the `fish_embedding` Atlas Vector Search index and assignment uniqueness index with:

```powershell
bun run seed
```

## Collect starter fish images

Run the curated URL downloader with Python:

```powershell
bun run collect:fish
```

It downloads the URLs listed in `scripts/getFish.py` to `.tmp/fish-images`. Review downloaded images and their source licenses before selecting files for `data/fish/images`, preprocessing, or publishing them.

## Commands

```powershell
bun test
bun run build
```
