# Gameplay

## Purpose
Define player turns, fish assignments, and webcam comparison.

## Requirements

### Requirement: Stable fish assignment
The system SHALL assign one random active fish per player in each UTC four-hour round. It SHALL reuse that assignment within the round unless the player rerolls.

#### Scenario: Assignment requested
- **WHEN** a player requests an assignment in a round
- **THEN** the system returns that player's existing fish or assigns a random active fish

#### Scenario: Player rerolls
- **WHEN** a player rerolls
- **THEN** the system assigns a different active fish

### Requirement: In-place comparison
The Play view SHALL score a capture asynchronously and show the result without publishing it. The player MAY retake the photo or change fish before publication.

#### Scenario: Capture is scored
- **WHEN** the player captures a selfie
- **THEN** the Play view shows a ranking state, then the result without a page transition

#### Scenario: Turn ends
- **WHEN** the player selects Enter leaderboard or Throw Me Back
- **THEN** the application returns to intake with a new anonymous player ID and publishes only an entered result

### Requirement: Cropped countdown capture
The Play view SHALL show a centered square webcam crop, count down 3, 2, 1, and compare only that crop resized to at most 240 by 240 pixels.

#### Scenario: Capture or retake
- **WHEN** the player captures or retakes a selfie
- **THEN** capture follows the countdown, or the live camera and crop box resume

### Requirement: Public player entries
The application SHALL ask for a full name and keep an anonymous player ID in the browser. Only named selfies explicitly entered into the leaderboard SHALL appear publicly.

#### Scenario: Player enters a result
- **WHEN** the player enters a scored selfie
- **THEN** its name, image, and result become eligible for public display