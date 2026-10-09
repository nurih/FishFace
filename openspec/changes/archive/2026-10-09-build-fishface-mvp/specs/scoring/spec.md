# Scoring Specification

## ADDED Requirements

### Requirement: Atlas image embeddings

The preprocessed fish catalog and submitted selfies SHALL use `voyage-multimodal-3.5` with `input_type: null`. The system SHALL send submitted selfies through the Atlas multimodal embedding API and store the resulting vectors for Vector Search.

#### Scenario: Valid selfie is submitted

- **WHEN** a supported image under the provider size limit is submitted
- **THEN** the server creates its image embedding before ranking it

#### Scenario: Embedding fails

- **WHEN** Atlas rejects or cannot process the image
- **THEN** the server returns an error and the Play view remains available for retry

### Requirement: Target-relative result

The system SHALL compare each selfie against every active fish, persist the closest matching fish's public identity, exact assigned-fish rank, whether the target ranks first, and the target's score margin over the strongest non-target fish. Raw similarity values SHALL remain stored for diagnostics only.

#### Scenario: Assigned fish is ranked

- **WHEN** the selfie embedding is searched against the active fish catalog
- **THEN** the system records the closest fish, target rank, target-win result, and target margin

### Requirement: Latest leaderboard entries

The leaderboard SHALL select the latest 24 scored submissions, then rank target wins before losses, lower target rank next, and higher target margin next.

#### Scenario: Player submits multiple attempts

- **WHEN** players have more than 24 scored submissions across all rounds
- **THEN** only the latest 24 submissions appear on the leaderboard
