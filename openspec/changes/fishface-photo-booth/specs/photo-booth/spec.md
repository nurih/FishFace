# Photo Booth Specification

## ADDED Requirements

### Requirement: Independent booth turn
The application SHALL serve FishFace Photo Booth at `/booth` without navigation to or from the existing game page. A visitor SHALL enter a name, start a turn, switch the assigned fish with a reload control beside the target, capture a selfie, and see the target fish, selfie, best-match fish, and score after automatic evaluation. The target label SHALL be prominent, with the fish name secondary and a short instruction beside it.

#### Scenario: Visitor captures a selfie
- **WHEN** a visitor starts a turn and captures a selfie
- **THEN** the booth evaluates it with the existing fish scoring backend and shows the result on the booth page

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
