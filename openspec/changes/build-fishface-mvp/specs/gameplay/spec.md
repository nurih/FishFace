# Gameplay Specification

## Requirement: Stable fish assignment

The system SHALL assign each player one random active fish for each global UTC four-hour round.

#### Scenario: Player retries during a round

- **WHEN** a player requests the game after already receiving an assignment in the active round
- **THEN** the system returns the original fish assignment

#### Scenario: Player requests another fish

- **WHEN** a player rerolls during an active round
- **THEN** the system replaces their assignment with a different active fish

#### Scenario: New round begins

- **WHEN** the current UTC four-hour window changes
- **THEN** the player can receive a new random fish assignment

## Requirement: Webcam submission remains in place

The Play view SHALL submit a captured selfie through asynchronous fetch and SHALL not navigate away while scoring is in progress.

#### Scenario: Score request is pending

- **WHEN** the player submits a selfie
- **THEN** the Play view shows a ranking state until it receives a response

#### Scenario: Score request succeeds

- **WHEN** scoring completes
- **THEN** the Play view renders the result without a page transition

## Requirement: Cropped countdown capture

The Play view SHALL draw a centered square crop box over the live webcam view. It SHALL count down from three before capture and submit only the cropped image, resized to at most 240 by 240 pixels.

#### Scenario: Player captures a selfie

- **WHEN** the player selects Capture FishFace
- **THEN** the view displays a 3, 2, 1 countdown and captures the crop after three seconds

#### Scenario: Player retakes a selfie

- **WHEN** the player selects Retake
- **THEN** the live camera stream resumes with the crop box visible

## Requirement: Public player entries

The system SHALL prompt for a full name and retain a browser-local anonymous player ID. Submitted selfies and names SHALL be eligible for public active-round display.
