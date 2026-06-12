# 0001: Start With Web-First Shoppable Design Cards

## Status

Accepted

## Context

The product vision includes guided room scanning, AI design generation, real shopping links, and a 2D/3D sandbox. Building all of that first would hide the biggest product risk: whether users trust and want shoppable AI design cards enough to keep using the app.

## Decision

The first architecture targets a web-first MVP:

- manual or imported dimensions
- seed catalog with verified dimensions
- deterministic fit and clearance rules
- generated design cards
- 2D floor plan preview

Native RoomPlan scanning is treated as a Phase 2 capture adapter that normalizes into the same `Room` JSON.

## Consequences

- Faster validation loop.
- Less dependency on iOS-specific development on day one.
- Cleaner separation between AI suggestions and deterministic fit validation.
- Some magic is delayed until after the core value proposition is proven.

