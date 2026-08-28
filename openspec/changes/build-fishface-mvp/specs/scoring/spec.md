# Scoring Specification

## Requirement: Atlas image embeddings

The preprocessed fish catalog and submitted selfies SHALL use `voyage-multimodal-3.5` with `input_type: null`. The system SHALL send submitted selfies through the Atlas multimodal embedding API and store the resulting vectors for Vector Search.

#### Scenario: Valid selfie is submitted

- **WHEN** a supported image under the provider size limit is submitted
- **THEN** the server creates its image embedding before ranking it

#### Scenario: Embedding fails

- **WHEN** Atlas rejects or cannot process the image
- **THEN** the server returns an error and the Play view remains available for retry

## Requirement: Three persisted measures

The system SHALL persist assigned-fish similarity, closest-catalog similarity, and exact assigned-fish rank for every successfully scored submission.

#### Scenario: Assigned fish is ranked

- **WHEN** the selfie embedding is searched against the active fish catalog
- **THEN** the system records the assigned fish's Vector Search score and one-based position among all catalog results

## Requirement: Active leaderboard score

The active leaderboard SHALL rank scored submissions by assigned-fish similarity in the current round.

#### Scenario: Player submits multiple attempts

- **WHEN** a player has multiple scored submissions in the current round
- **THEN** each submission remains eligible for the top-50 leaderboard
