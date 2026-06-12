import type { CatalogProduct, Door, Placement, Room } from "./schemas.js";

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  depth: number;
}

export interface Footprint {
  widthIn: number;
  depthIn: number;
}

export function normalizeRotation(rotationDeg: number): number {
  return ((rotationDeg % 360) + 360) % 360;
}

export function footprintFor(product: CatalogProduct, rotationDeg: number): Footprint {
  const rotation = normalizeRotation(rotationDeg);
  const rotatedSideways = (rotation >= 45 && rotation < 135) || (rotation >= 225 && rotation < 315);

  if (rotatedSideways) {
    return {
      widthIn: product.dimensions.depthIn,
      depthIn: product.dimensions.widthIn
    };
  }

  return {
    widthIn: product.dimensions.widthIn,
    depthIn: product.dimensions.depthIn
  };
}

export function boundsForPlacement(product: CatalogProduct, placement: Placement): Bounds {
  const footprint = footprintFor(product, placement.rotationDeg);

  return {
    left: placement.xIn - footprint.widthIn / 2,
    top: placement.yIn - footprint.depthIn / 2,
    right: placement.xIn + footprint.widthIn / 2,
    bottom: placement.yIn + footprint.depthIn / 2,
    width: footprint.widthIn,
    depth: footprint.depthIn
  };
}

export function containsBounds(room: Room, bounds: Bounds, marginIn = 0): boolean {
  return (
    bounds.left >= marginIn &&
    bounds.top >= marginIn &&
    bounds.right <= room.dimensions.widthIn - marginIn &&
    bounds.bottom <= room.dimensions.depthIn - marginIn
  );
}

export function intersects(a: Bounds, b: Bounds, paddingIn = 0): boolean {
  return !(
    a.right + paddingIn <= b.left ||
    a.left - paddingIn >= b.right ||
    a.bottom + paddingIn <= b.top ||
    a.top - paddingIn >= b.bottom
  );
}

export function doorSwingBounds(room: Room, door: Door): Bounds {
  switch (door.wall) {
    case "north":
      return {
        left: door.offsetIn,
        top: 0,
        right: door.offsetIn + door.widthIn,
        bottom: door.swingDepthIn,
        width: door.widthIn,
        depth: door.swingDepthIn
      };
    case "south":
      return {
        left: door.offsetIn,
        top: room.dimensions.depthIn - door.swingDepthIn,
        right: door.offsetIn + door.widthIn,
        bottom: room.dimensions.depthIn,
        width: door.widthIn,
        depth: door.swingDepthIn
      };
    case "west":
      return {
        left: 0,
        top: door.offsetIn,
        right: door.swingDepthIn,
        bottom: door.offsetIn + door.widthIn,
        width: door.swingDepthIn,
        depth: door.widthIn
      };
    case "east":
      return {
        left: room.dimensions.widthIn - door.swingDepthIn,
        top: door.offsetIn,
        right: room.dimensions.widthIn,
        bottom: door.offsetIn + door.widthIn,
        width: door.swingDepthIn,
        depth: door.widthIn
      };
  }
}

export function formatInches(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = Math.round(inches % 12);

  if (feet === 0) {
    return `${remaining} in`;
  }

  if (remaining === 0) {
    return `${feet} ft`;
  }

  return `${feet} ft ${remaining} in`;
}

