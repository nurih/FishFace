# Catalog collection

## Purpose
Define local image collection and review before catalog ingestion.

## Requirements

### Requirement: Local fish-image dataset collection
The project SHALL provide `scripts/getFish.py` to download curated image URLs into `.tmp/fish-images`.

#### Scenario: Download succeeds
- **WHEN** a listed image is available
- **THEN** the script saves it in the staging directory

### Requirement: Curated source review
Each downloaded image and its source license SHALL be reviewed before the image is added to `data/fish/images`.

#### Scenario: Image is selected
- **WHEN** an image is selected for catalog ingestion
- **THEN** its content and source license have been reviewed