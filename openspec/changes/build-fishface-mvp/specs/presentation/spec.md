# Presentation Specification

## Requirement: Active leaderboard

The application SHALL display a scrollable leaderboard for only the current global four-hour round, sorted by assigned-fish similarity from highest to lowest.

#### Scenario: Current scores are requested

- **WHEN** the leaderboard loads
- **THEN** it returns up to 50 scored submissions from all players in the active round

## Requirement: Current player's latest capture

The application SHALL display the current player's most recently scored capture and its assigned fish separately from the leaderboard.

#### Scenario: Player has scored a capture

- **WHEN** the current player has a scored submission in the active round
- **THEN** the view displays their latest capture, fish, and assigned-fish similarity
