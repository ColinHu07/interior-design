import {
  boundsForPlacement,
  containsBounds,
  doorSwingBounds,
  formatInches,
  intersects
} from "./geometry.js";
import type { CatalogProduct, LayoutItem, LayoutWarning, ProductCategory, Room } from "./schemas.js";

export interface LayoutValidationInput {
  room: Room;
  items: LayoutItem[];
  products: CatalogProduct[];
}

export interface LayoutValidationResult {
  fitScore: number;
  warnings: LayoutWarning[];
}

const nonBlockingCategories = new Set<ProductCategory>(["rug", "wall_art", "curtains", "lamp"]);

function isBlocking(product: CatalogProduct): boolean {
  return !nonBlockingCategories.has(product.category);
}

function warningWeight(severity: LayoutWarning["severity"]): number {
  if (severity === "error") {
    return 0.25;
  }

  if (severity === "warning") {
    return 0.1;
  }

  return 0.03;
}

export function validateLayout(input: LayoutValidationInput): LayoutValidationResult {
  const productById = new Map(input.products.map((product) => [product.id, product]));
  const warnings: LayoutWarning[] = [];
  const placed = [];

  for (const item of input.items) {
    const product = productById.get(item.productId);

    if (!product) {
      warnings.push({
        code: "missing_product",
        severity: "error",
        message: `Layout item ${item.id} references a product that is not in the catalog.`,
        itemIds: [item.id]
      });
      continue;
    }

    const bounds = boundsForPlacement(product, item.placement);
    placed.push({ item, product, bounds });

    if (!containsBounds(input.room, bounds)) {
      warnings.push({
        code: "outside_room",
        severity: "error",
        message: `${product.name} does not fit inside the room boundaries.`,
        itemIds: [item.id]
      });
    }

    if (product.dimensionConfidence < 0.8) {
      warnings.push({
        code: "low_dimension_confidence",
        severity: "warning",
        message: `${product.name} has low dimension confidence and should be reviewed before purchase.`,
        itemIds: [item.id]
      });
    }
  }

  for (const placedItem of placed) {
    if (!isBlocking(placedItem.product)) {
      continue;
    }

    for (const door of input.room.doors) {
      const doorBounds = doorSwingBounds(input.room, door);

      if (intersects(placedItem.bounds, doorBounds)) {
        warnings.push({
          code: "door_clearance_blocked",
          severity: "error",
          message: `${placedItem.product.name} blocks the ${formatInches(door.widthIn)} ${door.wall} door clearance.`,
          itemIds: [placedItem.item.id]
        });
      }
    }
  }

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i];
      const b = placed[j];

      if (!isBlocking(a.product) || !isBlocking(b.product)) {
        continue;
      }

      if (intersects(a.bounds, b.bounds, 2)) {
        warnings.push({
          code: "item_collision",
          severity: "error",
          message: `${a.product.name} overlaps ${b.product.name}.`,
          itemIds: [a.item.id, b.item.id]
        });
      }
    }
  }

  const penalty = warnings.reduce((total, warning) => total + warningWeight(warning.severity), 0);

  return {
    fitScore: Math.max(0, Number((1 - penalty).toFixed(2))),
    warnings
  };
}

export function scoreBudget(totalPriceCents: number, budgetCents: number): number {
  if (totalPriceCents <= budgetCents) {
    return 1;
  }

  const overageRatio = (totalPriceCents - budgetCents) / budgetCents;
  return Math.max(0, Number((1 - overageRatio).toFixed(2)));
}
