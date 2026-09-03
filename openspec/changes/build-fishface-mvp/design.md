# Design

## Round and identity

A round is a global UTC window of four hours. The round ID is its start timestamp. A browser creates and retains an anonymous player ID; the player supplies a full name once. The `(roundId, playerId)` assignment contains one randomly selected active fish. A player can reroll during a round; the assignment is replaced with a different active fish.

## Submission and scoring

The browser draws a centered square crop box over the live webcam view. After a three-second countdown, it captures only that crop, then resizes it to at most 240 by 240 pixels before posting it with `fetch` as multipart form data. The page remains on the Play view and shows a ranking state while the request awaits completion.

The server stores the selfie in the `selfies` GridFS bucket, sends it to Atlas's multimodal embedding API with `voyage-multimodal-3.5` and `input_type: null`, stores the returned vector on the submission, and performs exact Atlas Vector Search across active fish. Preprocessed fish use the same model and mode. A scored submission stores:

- `assignedFishSimilarity`: Vector Search score for the assigned fish.
- `closestCatalogSimilarity`: score of the highest matching catalog fish.
- `assignedFishRank`: one-based rank of the assigned fish across the full active catalog.

The leaderboard selects the latest 24 scored submissions across all rounds, then ranks them by target result, target rank, and target margin. A separate panel shows the current player's latest scored capture across all rounds.

## Collections

- `fish`: preprocessed catalog document with species, image reference, embedding, and active flag.
- `assignments`: unique `(roundId, playerId)` fish assignment.
- `submissions`: public submission metadata, persisted vector, three scores, assignment reference, and GridFS file ID.
- `selfies.files` and `selfies.chunks`: GridFS selfie storage.

Create a unique compound index on `assignments(roundId, playerId)` and an Atlas Vector Search index on `fish.embedding`. The index uses the same dimensionality as the configured `voyage-multimodal-3.5` output and supports exact search.

## Local catalog collection

A Python script downloads the curated image URLs in `scripts/getFish.py` into `.tmp/fish-images`. Its randomized delay and retry after HTTP 429 responses reduce the risk of rate limiting. Review downloaded images and their source licenses before selecting files for `data/fish/images` and catalog ingestion; the downloader does not claim species uniqueness or grant reuse rights.

## Failure handling

Invalid input is rejected before storage. Atlas embedding, Vector Search, and database failures return an in-place error; the player may retake or retry. The model API key and MongoDB URI remain server-only.
