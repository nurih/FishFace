# Presentation Specification

## ADDED Requirements

### Requirement: Latest leaderboard

The application SHALL display a scrollable leaderboard containing the latest 24 scored submissions across all rounds, ranked by target result, target rank, and target margin.

#### Scenario: Latest scores are requested

- **WHEN** the leaderboard loads
- **THEN** it returns up to 24 scored submissions from all players, ranked by leaderboard result

#### Scenario: Intake player inspects a leaderboard record

- **WHEN** an intake player selects a leaderboard item
- **THEN** the application displays the entry's selfie, assigned target, and best-match fish at 250 by 250 pixels, with its target result, rank, and margin

### Requirement: Current player's latest capture

The application SHALL display the current player's most recently scored capture, assigned target fish, and closest catalog match separately from the leaderboard.

#### Scenario: Player has scored a capture

- **WHEN** the current player has a scored submission in any round
- **THEN** the view displays their latest capture, target fish, closest matching fish, target rank, and target result
