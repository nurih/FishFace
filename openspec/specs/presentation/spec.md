# Presentation

## Purpose
Define the public leaderboard and the separate view of a player's latest published result.

## Requirements

### Requirement: Latest leaderboard
The application SHALL show a scrollable leaderboard of the latest 24 published scores, ordered by target result, rank, and margin.

#### Scenario: Entry selected
- **WHEN** an intake player selects an entry
- **THEN** the view shows its 250 by 250 pixel selfie, target and best-match fish, result, rank, and margin

### Requirement: Current player's latest capture
The application SHALL show the current player's latest published capture separately from the leaderboard.

#### Scenario: Player has a published result
- **WHEN** the player has a scored entry in any round
- **THEN** the view shows its selfie, target fish, closest fish, rank, and result
