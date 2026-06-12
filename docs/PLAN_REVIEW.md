# Plan Review

## Verdict

The plan is directionally strong. The best product promise is not "make a pretty room image." It is "scan or measure your real room, then get shoppable designs using furniture that actually fits."

The main adjustment is sequencing. A native AR-first build is technically attractive, but it is not the fastest way to learn whether the business works. The repo is set up around a web-first validation MVP with manual dimensions, a curated catalog, deterministic layout rules, and a clean path to add RoomPlan later.

## What The Plan Gets Right

- It separates quick photo inspiration from accurate measurement.
- It treats product dimensions as a first-class requirement.
- It recognizes product catalog quality as the hardest commercial problem.
- It calls out the need for rules and geometry instead of pure AI generation.
- It correctly identifies the 2D sandbox as the first interactive editor to build.

## What Needed Tightening

### 1. Do Not Promise Exact Scale From One Photo

A single photo can support style analysis, object detection, and rough layout guesses. It cannot reliably produce exact room dimensions unless the app also has AR tracking, depth data, multiple views, or a known reference measurement.

Product copy should say:

> Quick ideas from one photo. Accurate layouts from guided scan or confirmed dimensions.

### 2. Do Not Start With Full Native AR

RoomPlan is strategically important, but a native iOS scan flow does not validate the core commercial question by itself. The first validation target should be:

- bedrooms or home offices only
- manual dimensions or imported dimensions
- 3 design cards
- real catalog products with dimensions
- fit warnings and budget totals
- simple 2D layout editing

If users do not care about the generated cards and shopping list, AR scanning will not save the product.

### 3. The Catalog Is The Moat And The Risk

The MVP should not scrape broad retailer pages. It should begin with a curated catalog or official feeds, then reject products with low-confidence dimensions. "Visual only" products can exist later, but they should not be used in fit-scored recommendations.

### 4. AI Should Be Constrained By Schemas

AI can help with:

- room/photo analysis
- style classification
- product tagging
- design explanations
- visual previews
- conversational design changes

Deterministic code should own:

- dimensions
- collision detection
- clearance rules
- price totals
- catalog selection
- availability freshness
- product-link integrity

## Recommended MVP

The best MVP is:

> A web/mobile prototype where a user enters bedroom dimensions, chooses budget and style, receives three shoppable design cards, and edits a validated 2D layout.

The native iOS RoomPlan app should become Phase 2 after this loop shows demand.

## Non-Goals For The First Build

- full-room 3D editor
- universal product catalog
- Android scanning
- automatic checkout
- AI-generated product links
- exact dimensions from a single photo
- support for every room type

## Primary Risks

| Risk | Why It Matters | Mitigation |
| --- | --- | --- |
| Bad measurements | Bad dimensions make the product feel fake. | Require confirmed dimensions in MVP; add RoomPlan later. |
| Products do not fit | Fit is the differentiator. | Reject missing or low-confidence dimensions. |
| Fake shopping data | User trust collapses quickly. | Catalog-first retrieval, never AI-invented links. |
| Scope creep into 3D | 3D can consume the whole schedule. | 2D sandbox first, 3D preview later. |
| Weak taste quality | Technically valid designs may feel bland. | Use curated style packs and interior-design rules. |
| Privacy concerns | Room photos are sensitive. | Minimize raw photo retention; add deletion/export controls. |

## Official-Doc Check

- Apple RoomPlan supports parametric room scans and USD/USDZ export with dimensions for recognized room components: https://developer.apple.com/augmented-reality/roomplan/
- Google ARCore Depth provides depth maps that help understand size and shape in a scene: https://developers.google.com/ar/develop/depth
- OpenAI image and vision APIs can analyze images and generate/edit images, which fits room analysis and concept preview workflows: https://developers.openai.com/api/docs/guides/images-vision
- Shopify Storefront API supports product, cart, and checkout-style commerce flows for partner retailers: https://shopify.dev/docs/api/storefront/latest
- Amazon PA-API docs now warn that PA-API is deprecated and points developers toward Creators API, so Amazon integration needs fresh legal/API review before implementation: https://webservices.amazon.com/paapi5/documentation/register-for-pa-api.html
- Rakuten Advertising exposes affiliate APIs including product search/feed workflows: https://developers.rakutenadvertising.com/documentation/en-US/affiliate_apis

