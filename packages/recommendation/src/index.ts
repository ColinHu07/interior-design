import { findProducts, seedProducts } from "@interior/catalog";
import {
  designCardSchema,
  preferencesSchema,
  roomSchema,
  sampleBedroom,
  samplePreferences,
  scoreBudget,
  validateLayout
} from "@interior/domain";
import type {
  CatalogProduct,
  DesignCard,
  LayoutItem,
  LayoutWarning,
  Preferences,
  ProductCategory,
  Room
} from "@interior/domain";
import { z } from "zod";

interface DesignConcept {
  styleId: string;
  title: string;
  summary: string;
  palette: string[];
  styleScore: number;
}

export const generateDesignCardsInputSchema = z.object({
  room: roomSchema.default(sampleBedroom),
  preferences: preferencesSchema.default(samplePreferences)
});

export type GenerateDesignCardsInput = z.infer<typeof generateDesignCardsInputSchema>;

export interface GeneratedDesignCardsResponse {
  room: Room;
  cards: DesignCard[];
  products: CatalogProduct[];
  generatedAt: string;
}

const concepts: DesignConcept[] = [
  {
    styleId: "cozy-neutral",
    title: "Cozy Neutral Bedroom",
    summary: "Warm woods, soft textiles, and layered lighting without crowding the room.",
    palette: ["#7C6A55", "#E7DDCF", "#F7F3EA", "#8FA88E"],
    styleScore: 0.9
  },
  {
    styleId: "japandi-calm",
    title: "Japandi Calm",
    summary: "Low visual noise, natural materials, and functional storage with relaxed spacing.",
    palette: ["#A97C50", "#EEE6D8", "#2F3A33", "#D7C7A3"],
    styleScore: 0.88
  },
  {
    styleId: "modern-contrast",
    title: "Modern Contrast",
    summary: "Crisp black-and-white pieces balanced with softer textiles and clean silhouettes.",
    palette: ["#111111", "#F7F7F2", "#C8CED3", "#B85C4A"],
    styleScore: 0.84
  },
  {
    styleId: "budget-refresh",
    title: "Budget Refresh",
    summary: "Affordable swaps that make the room feel intentional without replacing everything.",
    palette: ["#2D4059", "#F6F3EC", "#EA5455", "#FFD460"],
    styleScore: 0.8
  }
];

export function generateDesignCards(rawInput: Partial<GenerateDesignCardsInput> = {}): GeneratedDesignCardsResponse {
  const { room, preferences } = generateDesignCardsInputSchema.parse(rawInput);
  const selectedConcepts = selectConcepts(preferences);
  const cards = selectedConcepts
    .map((concept) => buildCard(room, preferences, concept))
    .filter((card): card is DesignCard => Boolean(card))
    .map((card) => designCardSchema.parse(card));

  const productIds = new Set(cards.flatMap((card) => card.items.map((item) => item.productId)));

  return {
    room,
    cards,
    products: seedProducts.filter((product) => productIds.has(product.id)),
    generatedAt: new Date().toISOString()
  };
}

function selectConcepts(preferences: Preferences): DesignConcept[] {
  const requested = concepts.filter((concept) => preferences.styleIds.includes(concept.styleId));

  if (requested.length >= 3) {
    return requested.slice(0, 3);
  }

  const remaining = concepts.filter((concept) => !requested.includes(concept));
  return [...requested, ...remaining].slice(0, 3);
}

function buildCard(room: Room, preferences: Preferences, concept: DesignConcept): DesignCard | undefined {
  const selectedProducts = selectProducts(room, preferences, concept);
  const missingWarnings = selectedProducts.warnings;

  if (!selectedProducts.bed || !selectedProducts.rug || !selectedProducts.nightstand) {
    return undefined;
  }

  const items = createBedroomLayout(room, selectedProducts);
  const totalPriceCents = totalForItems(items, selectedProducts.products);
  const validation = validateLayout({ room, items, products: selectedProducts.products });
  const warnings: LayoutWarning[] = [...missingWarnings, ...validation.warnings];
  const budgetScore = scoreBudget(totalPriceCents, preferences.budgetCents);

  if (budgetScore < 1) {
    warnings.push({
      code: "over_budget",
      severity: "warning",
      message: `${concept.title} is over the current budget. Try swapping optional items first.`,
      itemIds: []
    });
  }

  return {
    id: `card_${concept.styleId}`,
    roomId: room.id,
    title: concept.title,
    styleId: concept.styleId,
    summary: concept.summary,
    palette: concept.palette,
    items,
    totalPriceCents,
    fitScore: validation.fitScore,
    budgetScore,
    styleScore: concept.styleScore,
    warnings
  };
}

interface SelectedProducts {
  bed?: CatalogProduct;
  nightstand?: CatalogProduct;
  rug?: CatalogProduct;
  dresser?: CatalogProduct;
  lamp?: CatalogProduct;
  curtains?: CatalogProduct;
  wallArt?: CatalogProduct;
  plant?: CatalogProduct;
  products: CatalogProduct[];
  warnings: LayoutWarning[];
}

function selectProducts(room: Room, preferences: Preferences, concept: DesignConcept): SelectedProducts {
  const picked: CatalogProduct[] = [];
  const warnings: LayoutWarning[] = [];

  const pick = (category: ProductCategory, budgetShare: number, maxWidthIn?: number, maxDepthIn?: number) => {
    const product = findProducts(
      {
        category,
        roomType: room.type,
        styleIds: [concept.styleId],
        retailerIds: preferences.retailerIds,
        maxWidthIn,
        maxDepthIn,
        maxPriceCents: Math.round(preferences.budgetCents * budgetShare),
        requireVerifiedDimensions: true
      },
      seedProducts
    )[0];

    if (product) {
      picked.push(product);
      return product;
    }

    warnings.push({
      code: "missing_category",
      severity: "warning",
      message: `No verified ${category.replace("_", " ")} matched ${concept.title} within the category budget.`,
      itemIds: []
    });

    return undefined;
  };

  const selected: SelectedProducts = {
    bed: pick("bed_frame", 0.42, room.dimensions.widthIn - 24, room.dimensions.depthIn - 48),
    nightstand: pick("nightstand", 0.12, 26, 24),
    rug: pick("rug", 0.25, room.dimensions.widthIn - 24, room.dimensions.depthIn - 24),
    lamp: pick("lamp", 0.08, 18, 18),
    curtains: pick("curtains", 0.12, room.dimensions.widthIn, 4),
    wallArt: pick("wall_art", 0.12, room.dimensions.widthIn - 24, 4),
    products: picked,
    warnings
  };

  maybePickOptional(selected, "dresser", room, preferences, concept, 0.35, room.dimensions.widthIn - 24, 24);
  maybePickOptional(selected, "plant", room, preferences, concept, 0.12, 30, 30);

  selected.products = Array.from(new Map(picked.map((product) => [product.id, product])).values());
  return selected;
}

function maybePickOptional(
  selected: SelectedProducts,
  category: ProductCategory,
  room: Room,
  preferences: Preferences,
  concept: DesignConcept,
  budgetShare: number,
  maxWidthIn?: number,
  maxDepthIn?: number
): void {
  const currentTotal = selected.products.reduce((total, product) => total + product.priceCents, 0);

  if (currentTotal > preferences.budgetCents * 0.82) {
    return;
  }

  const product = findProducts(
    {
      category,
      roomType: room.type,
      styleIds: [concept.styleId],
      retailerIds: preferences.retailerIds,
      maxWidthIn,
      maxDepthIn,
      maxPriceCents: Math.round(preferences.budgetCents * budgetShare),
      requireVerifiedDimensions: true
    },
    seedProducts
  )[0];

  if (!product) {
    return;
  }

  selected.products.push(product);

  if (category === "dresser") {
    selected.dresser = product;
  }

  if (category === "plant") {
    selected.plant = product;
  }
}

function createBedroomLayout(room: Room, selected: SelectedProducts): LayoutItem[] {
  const items: LayoutItem[] = [];
  const bed = selected.bed;
  const nightstand = selected.nightstand;
  const rug = selected.rug;

  if (!bed || !nightstand || !rug) {
    return items;
  }

  const bedX = room.dimensions.widthIn / 2;
  const bedY = 18 + bed.dimensions.depthIn / 2;
  const nightstandY = 18 + nightstand.dimensions.depthIn / 2;

  items.push({
    id: "bed",
    productId: bed.id,
    placement: { xIn: bedX, yIn: bedY, rotationDeg: 0 },
    locked: false
  });

  items.push({
    id: "nightstand_left",
    productId: nightstand.id,
    placement: {
      xIn: bedX - bed.dimensions.widthIn / 2 - nightstand.dimensions.widthIn / 2 - 4,
      yIn: nightstandY,
      rotationDeg: 0
    },
    locked: false
  });

  items.push({
    id: "nightstand_right",
    productId: nightstand.id,
    placement: {
      xIn: bedX + bed.dimensions.widthIn / 2 + nightstand.dimensions.widthIn / 2 + 4,
      yIn: nightstandY,
      rotationDeg: 0
    },
    locked: false
  });

  items.push({
    id: "rug",
    productId: rug.id,
    placement: { xIn: bedX, yIn: bedY + 24, rotationDeg: 0 },
    locked: false
  });

  if (selected.lamp) {
    items.push({
      id: "lamp",
      productId: selected.lamp.id,
      placement: { xIn: 18, yIn: bedY, rotationDeg: 0 },
      locked: false
    });
  }

  if (selected.curtains) {
    items.push({
      id: "curtains",
      productId: selected.curtains.id,
      placement: { xIn: room.dimensions.widthIn / 2, yIn: 1, rotationDeg: 0 },
      locked: false
    });
  }

  if (selected.wallArt) {
    items.push({
      id: "wall_art",
      productId: selected.wallArt.id,
      placement: { xIn: room.dimensions.widthIn / 2, yIn: 8, rotationDeg: 0 },
      locked: false
    });
  }

  if (selected.dresser) {
    items.push({
      id: "dresser",
      productId: selected.dresser.id,
      placement: {
        xIn: room.dimensions.widthIn / 2,
        yIn: room.dimensions.depthIn - selected.dresser.dimensions.depthIn / 2 - 18,
        rotationDeg: 0
      },
      locked: false
    });
  }

  if (selected.plant) {
    items.push({
      id: "plant",
      productId: selected.plant.id,
      placement: {
        xIn: 18,
        yIn: room.dimensions.depthIn - selected.plant.dimensions.depthIn / 2 - 12,
        rotationDeg: 0
      },
      locked: false
    });
  }

  return items;
}

function totalForItems(items: LayoutItem[], products: CatalogProduct[]): number {
  const productById = new Map(products.map((product) => [product.id, product]));

  return items.reduce((total, item) => total + (productById.get(item.productId)?.priceCents ?? 0), 0);
}

