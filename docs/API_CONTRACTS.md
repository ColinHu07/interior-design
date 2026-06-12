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

