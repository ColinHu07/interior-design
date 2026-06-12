# Interior Design

AI room styling architecture for shoppable, editable designs that fit a real room.

This repo intentionally starts with the narrow MVP loop:

1. Enter or import reliable room dimensions.
2. Choose room type, budget, and style.
3. Generate three shoppable design cards from a verified product catalog.
4. Validate layout with geometry rules before showing a card.
5. Edit the card in a 2D sandbox before investing in full 3D or AR.

The product vision is bigger than this, but the first build should prove that users want "real products that actually fit" before spending months on native scanning, full 3D, or broad catalog integrations.

## What Is Set Up

- `apps/api`: Fastify API that returns catalog products and generated design cards.
- `apps/web`: Vite/React prototype for the MVP room-design flow.
- `packages/domain`: shared schemas, geometry helpers, and layout validation rules.
- `packages/catalog`: normalized seed product catalog and product search.
- `packages/recommendation`: deterministic design-card pipeline that AI can augment later.
- `docs`: plan review, architecture, API contracts, and MVP roadmap.
- `infra`: local service placeholders for the future database/cache/object store.
- Editable 2D MVP controls: drag, nudge, rotate, duplicate, delete, swap, save, and share.

## Quick Start

```bash
npm install
npm run check
npm run dev
```

Then open:

- Web app: http://localhost:5173
- API health: http://localhost:4317/api/health

## Architecture Position

The plan makes sense, with one important correction: exact dimensions from a single photo should not be promised. The MVP should use manual dimensions or guided scan data, then treat AI as a design assistant. Geometry code, catalog data, and layout validation must decide whether a recommendation is allowed to ship.

Current verified assumptions from official docs:

- Apple RoomPlan can create parametric room scans and export USD/USDZ with dimensions for recognized components.
- ARCore Depth gives Android devices depth maps that help understand object size and shape, but device motion, distance, and sensor quality affect usefulness.
- OpenAI image/vision workflows are a good fit for room analysis and rendered concepts, but product links must come from the catalog.
- Shopify Storefront, Amazon affiliate APIs, and affiliate-network feeds are plausible catalog sources, but their licensing and freshness constraints make them a business risk, not a coding detail.

See [Plan Review](docs/PLAN_REVIEW.md), [Architecture](docs/ARCHITECTURE.md), and [MVP Roadmap](docs/MVP_ROADMAP.md).

## Key Rule

AI may suggest intent, explain taste, and generate visual previews. It should not invent product links, product dimensions, prices, or availability.
