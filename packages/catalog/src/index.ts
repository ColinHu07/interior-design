import type { CatalogProduct, ProductCategory, RoomType } from "@interior/domain";
import { seedProducts } from "./seedProducts.js";

export interface ProductSearchFilters {
  category?: ProductCategory;
  roomType?: RoomType;
  styleIds?: string[];
  retailerIds?: string[];
  maxWidthIn?: number;
  maxDepthIn?: number;
  maxPriceCents?: number;
  requireVerifiedDimensions?: boolean;
}

export { seedProducts };

export function findProducts(
  filters: ProductSearchFilters,
  products: CatalogProduct[] = seedProducts
): CatalogProduct[] {
  return products
    .filter((product) => matchesFilters(product, filters))
    .map((product) => ({
      product,
      score: scoreProduct(product, filters)
    }))
    .sort((a, b) => b.score - a.score || a.product.priceCents - b.product.priceCents)
    .map((entry) => entry.product);
}

export function pickBestProduct(
  filters: ProductSearchFilters,
  products: CatalogProduct[] = seedProducts
): CatalogProduct | undefined {
  return findProducts(filters, products)[0];
}

function matchesFilters(product: CatalogProduct, filters: ProductSearchFilters): boolean {
  if (filters.category && product.category !== filters.category) {
    return false;
  }

  if (filters.roomType && !product.roomTags.includes(filters.roomType)) {
    return false;
  }

  if (filters.retailerIds?.length && !filters.retailerIds.includes(product.retailerId)) {
    return false;
  }

  if (filters.maxWidthIn && product.dimensions.widthIn > filters.maxWidthIn) {
    return false;
  }

  if (filters.maxDepthIn && product.dimensions.depthIn > filters.maxDepthIn) {
    return false;
  }

  if (filters.maxPriceCents && product.priceCents > filters.maxPriceCents) {
    return false;
  }

  if (filters.requireVerifiedDimensions && product.dimensionConfidence < 0.85) {
    return false;
  }

  return product.availability !== "backorder";
}

function scoreProduct(product: CatalogProduct, filters: ProductSearchFilters): number {
  let score = product.dimensionConfidence * 10;

  if (filters.styleIds?.length) {
    const styleMatches = filters.styleIds.filter((styleId) => product.styleTags.includes(styleId)).length;
    score += styleMatches * 8;
  }

  if (filters.roomType && product.roomTags.includes(filters.roomType)) {
    score += 5;
  }

  if (product.availability === "in_stock") {
    score += 4;
  }

  if (product.source === "manual_curated" || product.source === "demo") {
    score += 2;
  }

  return score;
}

