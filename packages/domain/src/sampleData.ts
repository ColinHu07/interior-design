import type { Preferences, Room } from "./schemas.js";

export const sampleBedroom: Room = {
  id: "room_demo_bedroom",
  type: "bedroom",
  dimensions: {
    widthIn: 132,
    depthIn: 156,
    ceilingHeightIn: 96
  },
  doors: [
    {
      id: "door_entry",
      wall: "east",
      offsetIn: 106,
      widthIn: 32,
      swingDepthIn: 36
    }
  ],
  windows: [
    {
      id: "window_north",
      wall: "north",
      offsetIn: 36,
      widthIn: 60,
      heightIn: 48,
      sillHeightIn: 32
    }
  ],
  existingItems: []
};

export const samplePreferences: Preferences = {
  budgetCents: 150000,
  styleIds: ["cozy-neutral", "japandi-calm", "modern-contrast"],
  retailerIds: [],
  keepExistingItemIds: []
};

