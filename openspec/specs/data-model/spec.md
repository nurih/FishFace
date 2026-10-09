# Data model

## Purpose
Define direct MongoDB storage for published selfies and the vector index used to rank fish.

## Requirements

### Requirement: Direct MongoDB persistence
The application SHALL use the MongoDB Node.js driver without an ORM. Published selfie bytes SHALL reside in the `selfies` GridFS bucket and be referenced by their submission documents.

#### Scenario: Selfie is published
- **WHEN** a player enters a scored selfie into the leaderboard
- **THEN** the application stores its image in GridFS and its file ID in the submission

### Requirement: Atlas Vector Search index
The fish catalog SHALL index its image embeddings for Atlas Vector Search with the model's vector dimensions.

#### Scenario: Selfie is ranked
- **WHEN** the server ranks a selfie
- **THEN** it runs exact Vector Search across active fish
