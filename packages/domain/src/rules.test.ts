import { describe, expect, it } from "vitest";
import { validateLayout } from "./rules.js";
import type { CatalogProduct, LayoutItem, Room } from "./schemas.js";

const room: Room = {
  id: "test_room",
  type: "bedroom",
  dimensions: {
    widthIn: 120,
    depthIn: 120,
    ceilingHeightIn: 96
  },
  doors: [
    {
      id: "entry",
      wall: "south",
      offsetIn: 12,
      widthIn: 32,
      swingDepthIn: 36
    }
  ],
  windows: [],
  existingItems: []
};

const products: CatalogProduct[] = [
  {
    id: "bed",
    name: "Queen Bed",
    category: "bed_frame",
    retailerId: "demo",
    retailerName: "Demo Home",
    source: "demo",
    priceCents: 50000,
    currency: "USD",
    purchaseUrl: "https://example.com/bed",
    dimensions: {
      widthIn: 64,
      depthIn: 84,
      heightIn: 42
    },
    materials: ["wood"],
    colors: ["walnut"],
    styleTags: ["warm"],
    roomTags: ["bedroom"],
    availability: "in_stock",
    dimensionConfidence: 0.95
  },
  {
    id: "rug",
    name: "Area Rug",
    category: "rug",
    retailerId: "demo",
    retailerName: "Demo Home",
    source: "demo",
    priceCents: 18000,
    currency: "USD",
    purchaseUrl: "https://example.com/rug",
    dimensions: {
      widthIn: 96,
      depthIn: 120,
      heightIn: 1
    },
    materials: ["wool"],
    colors: ["cream"],
    styleTags: ["warm"],
    roomTags: ["bedroom"],
    availability: "in_stock",
    dimensionConfidence: 0.99
  }
];

describe("validateLayout", () => {
  it("allows rugs to overlap blocking furniture", () => {
    const items: LayoutItem[] = [
      { id: "bed_item", productId: "bed", placement: { xIn: 60, yIn: 58, rotationDeg: 0 }, locked: false },
      { id: "rug_item", productId: "rug", placement: { xIn: 60, yIn: 70, rotationDeg: 0 }, locked: false }
    ];

    const result = validateLayout({ room, items, products });

    expect(result.warnings.some((warning) => warning.code === "item_collision")).toBe(false);
  });

  it("flags furniture outside the room", () => {
    const items: LayoutItem[] = [
      { id: "bed_item", productId: "bed", placement: { xIn: 12, yIn: 12, rotationDeg: 0 }, locked: false }
    ];

    const result = validateLayout({ room, items, products });

    expect(result.warnings.some((warning) => warning.code === "outside_room")).toBe(true);
    expect(result.fitScore).toBeLessThan(1);
  });

  it("flags door swing blockage", () => {
    const items: LayoutItem[] = [
      { id: "bed_item", productId: "bed", placement: { xIn: 30, yIn: 102, rotationDeg: 90 }, locked: false }
    ];

    const result = validateLayout({ room, items, products });

    expect(result.warnings.some((warning) => warning.code === "door_clearance_blocked")).toBe(true);
  });
});

