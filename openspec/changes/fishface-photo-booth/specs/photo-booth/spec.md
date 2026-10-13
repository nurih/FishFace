# Photo Booth Specification

## ADDED Requirements

### Requirement: Independent booth turn
The application SHALL serve FishFace Photo Booth at `/booth` without navigation to or from the existing game page. A visitor SHALL enter a name, start a turn, switch the assigned fish with a reload control beside the target, capture a selfie, review or retake it, and choose "Rate my FishFace" before the selfie is stored or scored. The target label SHALL be prominent, with the fish name secondary and a short instruction beside it.

#### Scenario: Visitor captures a selfie
- **WHEN** a visitor starts a turn and captures a selfie
- **THEN** the booth shows the captured selfie in the camera area without storing or scoring it

#### Scenario: Visitor retakes a selfie
- **WHEN** a visitor selects Retake from the preview
- **THEN** the booth returns to the camera without storing the discarded selfie

#### Scenario: Visitor rates a selfie
- **WHEN** a visitor selects "Rate my FishFace" from the preview
- **THEN** the booth stores and scores that selfie and shows the printable result

### Requirement: Saved booth result
The application SHALL save the visitor's name, booth result, and selfie for a public permalink. The name SHALL title the photostrip. The result SHALL stay off the shared leaderboard until the visitor ends the turn.

#### Scenario: Result is reopened
- **WHEN** a visitor opens the result permalink
- **THEN** the application shows the saved target fish, selfie, best-match fish, and score

### Requirement: Result actions
The booth SHALL show a QR code for the result permalink, offer printing, and let the visitor end the turn. End Turn SHALL add the result once to the shared leaderboard and return to the booth start screen. The booth SHALL NOT display a leaderboard listing.

#### Scenario: Visitor ends a turn
- **WHEN** a visitor selects End turn
- **THEN** the booth adds the result to the shared leaderboard, clears the previous turn, and returns to intake
