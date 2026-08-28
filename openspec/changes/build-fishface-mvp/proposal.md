# FishFace MVP

## Why

FishFace needs a browser game where people impersonate a randomly assigned fish, receive a visual-similarity score, and compete in four-hour rounds.

## What changes

- Add a React/Next.js web application written in plain JavaScript.
- Use the MongoDB Node.js driver, Atlas Vector Search, Atlas multimodal embeddings, and GridFS; do not use an ORM.
- Support cropped webcam capture with a countdown, in-place asynchronous scoring, a current-round personal result, and a scrollable active-round leaderboard.
- Add a local curated-URL downloader to seed an initial fish-image dataset.

## Non-goals

- Accounts, authentication, moderation, historical-round UI, and self-service deletion.
- Automatic species classification, licensing review, or embedding generation for collected images.
