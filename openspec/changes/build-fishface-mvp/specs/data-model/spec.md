# Data Model Specification

## Requirement: Direct MongoDB persistence

The application SHALL use the MongoDB Node.js driver directly and SHALL NOT use an ORM.

#### Scenario: Selfie storage

- **WHEN** a selfie is accepted for scoring
- **THEN** the application stores its image bytes in the `selfies` GridFS bucket and references the file from its submission document

## Requirement: Atlas Vector Search index

The fish catalog SHALL have an Atlas Vector Search index over its image embedding field and SHALL use the Atlas multimodal model's matching vector dimensionality.

#### Scenario: Ranking query

- **WHEN** the server ranks a selfie
- **THEN** it performs exact Vector Search across the active fish catalog
