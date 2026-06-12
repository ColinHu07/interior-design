# MVP Roadmap

## Phase 0: Runnable Architecture

Goal: prove the shape of the system in code.

Included in this repo:

- shared schemas for rooms, products, placements, and design cards
- geometry validation for furniture fit
- seed product catalog
- deterministic design-card generator
- API endpoints
- web prototype for the core loop

## Phase 1: Validation Prototype

Goal: learn whether users want shoppable design cards.

Scope:

- bedrooms or home offices only
- manual room dimensions
- 3 to 5 style packs
- curated catalog of 100 to 300 products
- 3 generated design cards per room
- product alternatives
- 2D floor plan preview
- save/share design links

Success metrics:

- user completes room setup
- user opens at least one product link
- user swaps or saves at least one item
- user trusts fit warnings
- user asks for another room/design

## Phase 2: Native Measurement

Goal: reduce measurement friction without weakening trust.

Scope:

- iOS RoomPlan capture
- RoomPlan-to-`Room` normalization
- dimension confirmation screen
- confidence display
- support for manual correction

## Phase 3: Catalog Engine

Goal: make shopping data reliable enough for real users.

Scope:

- retailer/affiliate feed ingestion
- unit normalization
- dimension confidence scoring
- price and availability refresh
- duplicate detection
- style-tag enrichment
- product alternatives

## Phase 4: 2D Sandbox

Goal: make design cards editable.

Scope:

- drag, rotate, delete, duplicate
- snap to walls
- collision and clearance warnings
- live budget total
- item swap drawer
- locked existing furniture

## Phase 5: Visual Previews

Goal: make concepts emotionally compelling.

Scope:

- room-photo analysis
- image mockups
- basic 3D preview
- wall color and rug previews
- GLB/USDZ asset strategy

## Phase 6: Platform Expansion

Goal: scale after the core loop works.

Scope:

- Android ARCore capture
- collaborative sharing
- designer review upsells
- retailer partnerships
- checkout/cart integrations

