# API Contracts

Base URL in local development: `http://localhost:4317`

## `GET /api/health`

Returns service health and version.

```json
{
  "ok": true,
  "service": "interior-design-api",
  "version": "0.1.0"
}
```

## `GET /api/catalog`

Returns the active catalog. The MVP uses seed data.

```json
{
  "products": []
}
```

## `POST /api/design-cards`

Generates design cards from a room and preferences.

Request:

```json
{
  "room": {
    "id": "room_demo_bedroom",
    "type": "bedroom",
    "dimensions": {
      "widthIn": 132,
      "depthIn": 156,
      "ceilingHeightIn": 96
    },
    "doors": [],
    "windows": [],
    "existingItems": []
  },
  "preferences": {
    "budgetCents": 150000,
    "styleIds": ["cozy-neutral", "japandi-calm"],
    "retailerIds": []
  }
}
```

Response:

```json
{
  "room": {},
  "cards": [],
  "products": [],
  "generatedAt": "2026-06-12T00:00:00.000Z"
}
```

Validation errors return `400` with a schema error payload.

Each returned card includes `productAlternatives`, a map from layout item ID to product IDs that can be swapped into the same placement category.

## `POST /api/validate-layout`

Validates an edited layout against the same deterministic geometry rules used during generation.

Request:

```json
{
  "room": {},
  "items": [],
  "productIds": ["bed_walnut_platform", "rug_wool_neutral_8x10"]
}
```

Response:

```json
{
  "fitScore": 0.92,
  "warnings": []
}
```

The web sandbox calls this after edits so drag, rotate, duplicate, delete, and swap actions still produce trustworthy fit warnings.
