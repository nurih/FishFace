# FishFace

The most exciting fish-impersonation game built with MongoDB Atlas, Atlas multimodal embeddings, Atlas Vector Search, and the MongoDB driver.

## Gameplay

```mermaid
sequenceDiagram

  actor Player
  participant Web as UX
  participant API@{ "type" : "control" } as App Backend
  participant AI@{ "type" : "boundary" } as Voyage AI
  participant DB@{"type":"database"} as MongoDB Atlas

  Player->>Web: enter name and request fish
  Web->>API: POST /api/assignment
  API->>DB: reuse or create four-hour assignment
  DB-->>API: assigned fish
  API-->>Web: fish and round
  Player->>Web: capture selfie and score
  Web->>API: POST /api/submit
  API->>AI: create selfie embedding
  AI-->>API: 1024-dimension vector
  API->>DB: vector-search active fish
  DB-->>API: ranked fish matches
  API-->>Web: target rank and score
  Player->>Web: publish result
  Web->>API: POST /api/submit
  API->>DB: store selfie and scored submission
  API-->>Web: leaderboard entry
```

Rounds last four hours. A player keeps one assigned fish per round unless they choose a reroll. A score wins when the assigned fish is the highest-ranked catalog match for the selfie; the leaderboard orders scored submissions by win, target rank, target margin, and time.

## Local development

Prerequisites: Bun, Python (only for `collect:fish`), and a MongoDB Atlas deployment with Atlas Vector Search and Atlas AI access.

```powershell
Copy-Item .env.example .env.local
bun install
bun run dev
```

Set these server-side values in `.env.local`:

```dotenv
MONGO_URL=mongodb+srv://...
MONGODB_DB=fishface
MONGODB_ATLAS_AI_API_KEY=...
```

`MONGODB_ATLAS_AI_API_KEY` is a MongoDB Atlas model API key used only by the server-side embedding request. Do not expose it to the browser.

Run the test suite and production build with:

```powershell
bun test
bun run build
```

To run the built app locally:

```powershell
bun run start
```

## Deploy

Deploy to a host that supports a Node.js Next.js server. Configure the same three environment variables as production secrets; `MONGO_URL` must be able to reach the Atlas deployment from the host. Use `bun run build` as the build command and `bun run start` as the start command. The app is not a static export: its API routes require a running server.

Before the first deployment, load the catalog and create its indexes from a machine with the production environment variables:

```powershell
bun run seed
```

Run this only after adding catalog images to `data/fish/images`. It creates ordinary indexes and the `fish_embedding` Atlas Vector Search index, then inserts embeddings for previously unseeded `fish-*` images. Ensure the Atlas Search index is ready before accepting submissions.

## MongoDB and embeddings

The app uses the `MONGODB_DB` database (default `fishface`) and these collections:

- `fish`: active catalog fish, source metadata, and a 1024-dimension image embedding.
- `assignments`: one fish per player per four-hour round, enforced by a unique index.
- `submissions`: scored attempts, their embeddings, and leaderboard fields.
- `selfies.files` / `selfies.chunks`: GridFS storage for published selfies.
- `fish.files` / `fish.chunks`: optional GridFS storage for catalog images.

The seed script sends every catalog image to Atlas AI's `voyage-multimodal-3.5` model with `input_type: null` and stores its 1024-dimension embedding in `fish.embedding`. At score time, the server sends the selfie to the same model. It then runs an exact cosine-similarity `$vectorSearch` across active fish using `fish_embedding`, which ranks the full catalog and yields the assigned fish's rank and similarity margin.

The stored similarity is a multimodal vector-search score, not a calibrated percentage of human likeness. Treat it as a ranking signal.

## Fish catalog

Collect candidate images with:

```powershell
bun run collect:fish
```

This downloads the curated URLs in `scripts/getFish.py` to `.tmp/fish-images`. Review image source licenses before selecting files for `data/fish/images`, preprocessing them, or publishing them. Then run `bun run seed` to embed and insert the selected `fish-*` images.
