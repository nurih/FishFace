# Tasks

## 1. Foundation

- [x] Initialize Bun/Next.js plain-JavaScript application.
- [x] Add environment configuration and direct MongoDB driver connection.
- [x] Add collection/index setup documentation.
- [x] Add and run local fish-image collection script.

## 2. Gameplay

- [x] Implement UTC four-hour rounds and durable player/fish assignment.
- [x] Implement webcam device selection, cropped countdown capture, retake, and cleanup.
- [x] Submit selflies with asynchronous fetch and in-place ranking state.

## 3. Scoring and leaderboard

- [x] Call Atlas multimodal embeddings for submitted images.
- [x] Run exact Vector Search and store all three score measures.
- [x] Store selfies in GridFS and expose public display URLs.
- [x] Render the current player's latest capture and a scrollable leaderboard of the latest 24 scored submissions.

## 4. Validation

- [x] Test round boundaries and score selection.
- [ ] Test assignment reuse and leaderboard ordering against MongoDB.
- [ ] Test API input and service-failure responses.
- [ ] Run Bun tests and production build.
