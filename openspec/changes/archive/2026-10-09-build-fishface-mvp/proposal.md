# FishFace MVP

## Why

FishFace needs a browser game where people impersonate a randomly assigned fish, receive a visual-similarity score, and join an ongoing leaderboard.

## What changes

- Add a React/Next.js web application written in plain JavaScript.
- Use the MongoDB Node.js driver, Atlas Vector Search, Atlas multimodal embeddings, and GridFS; do not use an ORM.
- Support cropped webcam capture with a countdown, in-place asynchronous scoring, a personal latest result, and a scrollable leaderboard of the latest 24 entries.
- Add a local curated-URL downloader to seed an initial fish-image dataset.

## Non-goals

- Accounts, authentication, moderation, and self-service deletion.
- Automatic species classification, licensing review, or embedding generation for collected images.
