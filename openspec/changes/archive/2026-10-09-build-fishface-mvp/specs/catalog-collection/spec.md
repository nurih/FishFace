# Catalog Collection Specification

## ADDED Requirements

### Requirement: Local fish-image dataset collection

The project SHALL provide a Python script that downloads the curated image URLs in `scripts/getFish.py` into a local staging directory.

#### Scenario: Collection succeeds

- **WHEN** the downloader can retrieve a listed image
- **THEN** it writes that image under `.tmp/fish-images`

### Requirement: Curated source review

The project SHALL require a review of each downloaded image and its source license before it is added to `data/fish/images`.

#### Scenario: Image is recorded

- **WHEN** a downloaded image is selected for the catalog
- **THEN** it has been reviewed before preprocessing or publishing
