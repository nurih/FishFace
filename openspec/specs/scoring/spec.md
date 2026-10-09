# Scoring

## Purpose
Define image embeddings, target-relative scores, and leaderboard order.

## Requirements

### Requirement: Atlas image embeddings
Catalog fish and selfies SHALL use Atlas multimodal embeddings from `voyage-multimodal-3.5` with `input_type: null`. Published submissions SHALL store the selfie vector.

#### Scenario: Image is scored
- **WHEN** a supported image is submitted
- **THEN** the server embeds it before ranking it, or returns an error that allows retry

### Requirement: Target-relative result
The system SHALL compare each selfie with every active fish. It SHALL record the closest fish, assigned fish rank, target win, and assigned fish similarity minus the strongest non-target similarity. Raw similarities SHALL be stored for diagnostics only.

#### Scenario: Target is ranked
- **WHEN** Vector Search returns ranked fish
- **THEN** the system calculates those results from the full active catalog

### Requirement: Latest leaderboard entries
The leaderboard SHALL take the latest 24 published scores across all rounds, then sort by target win, ascending target rank, and descending target margin.

#### Scenario: More than 24 entries exist
- **WHEN** the leaderboard loads
- **THEN** it ranks only the latest 24 published scores