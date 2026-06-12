import { z } from "zod";

export const roomTypeSchema = z.enum([
  "bedroom",
  "home_office",
  "living_room",
  "dorm_room"
]);

export const productCategorySchema = z.enum([
  "bed_frame",
  "nightstand",
  "dresser",
  "desk",
  "chair",
  "sofa",
  "coffee_table",
  "rug",
  "lamp",
  "curtains",
  "wall_art",
  "mirror",
  "plant",
  "storage"
]);

export const wallSchema = z.enum(["north", "east", "south", "west"]);

export const roomDimensionsSchema = z.object({
  widthIn: z.number().positive(),
  depthIn: z.number().positive(),
  ceilingHeightIn: z.number().positive()
});

export const productDimensionsSchema = z.object({
  widthIn: z.number().positive(),
  depthIn: z.number().positive(),
  heightIn: z.number().positive()
});

export const placementSchema = z.object({
  xIn: z.number(),
  yIn: z.number(),
  rotationDeg: z.number().default(0)
});

export const doorSchema = z.object({
  id: z.string().min(1),
  wall: wallSchema,
  offsetIn: z.number().nonnegative(),
  widthIn: z.number().positive(),
  swingDepthIn: z.number().positive().default(36)
});

export const windowSchema = z.object({
  id: z.string().min(1),
  wall: wallSchema,
  offsetIn: z.number().nonnegative(),
  widthIn: z.number().positive(),
  heightIn: z.number().positive(),
  sillHeightIn: z.number().nonnegative()
});

export const existingItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: productCategorySchema,
  keep: z.boolean().default(true),
  dimensions: productDimensionsSchema,
  placement: placementSchema,
  locked: z.boolean().default(true)
});

export const roomSchema = z.object({
  id: z.string().min(1),
  type: roomTypeSchema,
  dimensions: roomDimensionsSchema,
  doors: z.array(doorSchema).default([]),
  windows: z.array(windowSchema).default([]),
  existingItems: z.array(existingItemSchema).default([])
});

export const catalogProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: productCategorySchema,
  retailerId: z.string().min(1),
  retailerName: z.string().min(1),
  source: z.enum(["demo", "retailer_api", "affiliate_feed", "manual_curated"]),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  purchaseUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  dimensions: productDimensionsSchema,
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  styleTags: z.array(z.string()).default([]),
  roomTags: z.array(roomTypeSchema).default([]),
  availability: z.enum(["in_stock", "low_stock", "backorder", "unknown"]),
  shippingDaysEstimate: z.number().int().positive().optional(),
  model3dUrl: z.string().url().optional(),
  dimensionConfidence: z.number().min(0).max(1),
  updatedAt: z.string().datetime().optional()
});

export const preferencesSchema = z.object({
  budgetCents: z.number().int().positive(),
  styleIds: z.array(z.string()).default([]),
  retailerIds: z.array(z.string()).default([]),
  keepExistingItemIds: z.array(z.string()).default([])
});

export const layoutItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  placement: placementSchema,
  locked: z.boolean().default(false)
});

export const layoutWarningSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string().min(1),
  itemIds: z.array(z.string()).default([])
});

export const designCardSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  title: z.string().min(1),
  styleId: z.string().min(1),
  summary: z.string().min(1),
  palette: z.array(z.string()).min(3),
  items: z.array(layoutItemSchema),
  productAlternatives: z.record(z.array(z.string())).default({}),
  totalPriceCents: z.number().int().nonnegative(),
  fitScore: z.number().min(0).max(1),
  budgetScore: z.number().min(0).max(1),
  styleScore: z.number().min(0).max(1),
  warnings: z.array(layoutWarningSchema).default([])
});

export type RoomType = z.infer<typeof roomTypeSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Wall = z.infer<typeof wallSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Door = z.infer<typeof doorSchema>;
export type WindowFeature = z.infer<typeof windowSchema>;
export type ExistingItem = z.infer<typeof existingItemSchema>;
export type CatalogProduct = z.infer<typeof catalogProductSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type LayoutItem = z.infer<typeof layoutItemSchema>;
export type LayoutWarning = z.infer<typeof layoutWarningSchema>;
export type DesignCard = z.infer<typeof designCardSchema>;
