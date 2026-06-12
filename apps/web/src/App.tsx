import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Move,
  RotateCw,
  Ruler,
  Save,
  ShoppingBag,
  Sparkles,
  Trash2
} from "lucide-react";
import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type RoomType = "bedroom" | "home_office" | "living_room" | "dorm_room";
type Wall = "north" | "east" | "south" | "west";
type Severity = "info" | "warning" | "error";

interface Room {
  id: string;
  type: RoomType;
  dimensions: {
    widthIn: number;
    depthIn: number;
    ceilingHeightIn: number;
  };
  doors: Array<{
    id: string;
    wall: Wall;
    offsetIn: number;
    widthIn: number;
    swingDepthIn: number;
  }>;
  windows: Array<{
    id: string;
    wall: Wall;
    offsetIn: number;
    widthIn: number;
    heightIn: number;
    sillHeightIn: number;
  }>;
  existingItems: unknown[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  retailerName: string;
  purchaseUrl: string;
  dimensions: {
    widthIn: number;
    depthIn: number;
    heightIn: number;
  };
  colors: string[];
  styleTags: string[];
}

interface LayoutItem {
  id: string;
  productId: string;
  placement: {
    xIn: number;
    yIn: number;
    rotationDeg: number;
  };
  locked: boolean;
}

interface Warning {
  code: string;
  severity: Severity;
  message: string;
  itemIds: string[];
}

interface DesignCard {
  id: string;
  roomId: string;
  title: string;
  styleId: string;
  summary: string;
  palette: string[];
  items: LayoutItem[];
  productAlternatives: Record<string, string[]>;
  totalPriceCents: number;
  fitScore: number;
  budgetScore: number;
  styleScore: number;
  warnings: Warning[];
}

interface DesignResponse {
  room: Room;
  cards: DesignCard[];
  products: Product[];
  generatedAt: string;
}

interface LayoutValidationResponse {
  fitScore: number;
  warnings: Warning[];
}

const styleOptions = [
  { id: "cozy-neutral", label: "Cozy" },
  { id: "japandi-calm", label: "Japandi" },
  { id: "modern-contrast", label: "Modern" },
  { id: "budget-refresh", label: "Budget" }
];

const roomOptions: Array<{ id: RoomType; label: string; width: number; depth: number }> = [
  { id: "bedroom", label: "Bedroom", width: 11, depth: 13 },
  { id: "home_office", label: "Office", width: 10, depth: 12 }
];

export function App() {
  const [roomType, setRoomType] = useState<RoomType>("bedroom");
  const [widthFt, setWidthFt] = useState(11);
  const [depthFt, setDepthFt] = useState(13);
  const [budget, setBudget] = useState(1500);
  const [styles, setStyles] = useState(["cozy-neutral", "japandi-calm", "modern-contrast"]);
  const [response, setResponse] = useState<DesignResponse | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editableCard, setEditableCard] = useState<DesignCard | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [manualWarnings, setManualWarnings] = useState<Warning[]>([]);
  const [manualFitScore, setManualFitScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState<string | null>(null);

  const productById = useMemo(() => new Map((response?.products ?? []).map((product) => [product.id, product])), [response]);
  const selectedProduct = editableCard?.items.find((item) => item.id === selectedItemId);
  const selectedCard = useMemo(() => {
    return response?.cards.find((card) => card.id === selectedCardId) ?? response?.cards[0] ?? null;
  }, [response, selectedCardId]);
  const workingRoom = response?.room ?? createRoom(roomType, widthFt, depthFt);
  const currentTotal = editableCard ? totalForItems(editableCard.items, productById) : 0;
  const currentBudgetScore = budget > 0 ? Math.min(1, currentTotal / (budget * 100) <= 1 ? 1 : (budget * 100) / currentTotal) : 0;
  const currentWarnings = manualWarnings.length ? manualWarnings : editableCard?.warnings ?? [];
  const currentFitScore = manualFitScore ?? editableCard?.fitScore ?? 0;

  async function generateCards(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/design-cards", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          room: createRoom(roomType, widthFt, depthFt),
          preferences: {
            budgetCents: budget * 100,
            styleIds: styles,
            retailerIds: []
          }
        })
      });

      if (!result.ok) {
        throw new Error(`API returned ${result.status}`);
      }

      const nextResponse = (await result.json()) as DesignResponse;
      setResponse(nextResponse);
      setSelectedCardId(nextResponse.cards[0]?.id ?? null);
      setEditableCard(nextResponse.cards[0] ? cloneCard(nextResponse.cards[0]) : null);
      setSelectedItemId(nextResponse.cards[0]?.items[0]?.id ?? null);
      setManualWarnings([]);
      setManualFitScore(null);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate designs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (window.location.hash.startsWith("#design=")) {
      loadSharedDesign();
      return;
    }

    void generateCards();
  }, []);

  useEffect(() => {
    if (!selectedCard) {
      return;
    }

    setEditableCard(cloneCard(selectedCard));
    setSelectedItemId(selectedCard.items[0]?.id ?? null);
    setManualWarnings([]);
    setManualFitScore(null);
  }, [selectedCard]);

  useEffect(() => {
    if (!editableCard || !response) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void validateEditedLayout(editableCard, response.room);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [editableCard?.items, response?.room]);

  function toggleStyle(styleId: string) {
    setStyles((current) => {
      if (current.includes(styleId)) {
        const next = current.filter((id) => id !== styleId);
        return next.length ? next : current;
      }

      return [...current, styleId];
    });
  }

  function changeRoomType(nextRoomType: RoomType) {
    const preset = roomOptions.find((option) => option.id === nextRoomType);
    setRoomType(nextRoomType);

    if (preset) {
      setWidthFt(preset.width);
      setDepthFt(preset.depth);
    }
  }

  async function validateEditedLayout(card: DesignCard, room: Room) {
    const result = await fetch("/api/validate-layout", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        room,
        items: card.items,
        productIds: card.items.map((item) => item.productId)
      })
    });

    if (!result.ok) {
      return;
    }

    const validation = (await result.json()) as LayoutValidationResponse;
    setManualFitScore(validation.fitScore);
    setManualWarnings(validation.warnings);
  }

  function patchSelectedItem(update: (item: LayoutItem) => LayoutItem) {
    if (!selectedItemId) {
      return;
    }

    setEditableCard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((item) => (item.id === selectedItemId ? update(item) : item))
      };
    });
  }

  function rotateSelected() {
    patchSelectedItem((item) => ({
      ...item,
      placement: {
        ...item.placement,
        rotationDeg: (item.placement.rotationDeg + 90) % 360
      }
    }));
  }

  function nudgeSelected(dx: number, dy: number) {
    patchSelectedItem((item) => ({
      ...item,
      placement: clampPlacement(
        {
          ...item.placement,
          xIn: item.placement.xIn + dx,
          yIn: item.placement.yIn + dy
        },
        workingRoom,
        productById.get(item.productId)
      )
    }));
  }

  function deleteSelected() {
    if (!selectedItemId) {
      return;
    }

    setEditableCard((current) => {
      if (!current) {
        return current;
      }

      const items = current.items.filter((item) => item.id !== selectedItemId);
      setSelectedItemId(items[0]?.id ?? null);
      return { ...current, items };
    });
  }

  function duplicateSelected() {
    if (!selectedItemId) {
      return;
    }

    setEditableCard((current) => {
      const item = current?.items.find((candidate) => candidate.id === selectedItemId);

      if (!current || !item) {
        return current;
      }

      const copy: LayoutItem = {
        ...item,
        id: `${item.id}_copy_${Date.now().toString(36)}`,
        placement: clampPlacement(
          {
            ...item.placement,
            xIn: item.placement.xIn + 10,
            yIn: item.placement.yIn + 10
          },
          workingRoom,
          productById.get(item.productId)
        )
      };

      setSelectedItemId(copy.id);
      return { ...current, items: [...current.items, copy] };
    });
  }

  function swapSelected(productId: string) {
    patchSelectedItem((item) => ({ ...item, productId }));
  }

  async function saveDesign() {
    if (!editableCard || !response) {
      return;
    }

    const payload = {
      room: response.room,
      card: editableCard,
      products: response.products,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem("interior-design:last-design", JSON.stringify(payload));
    setSaving("Saved");
    window.setTimeout(() => setSaving(""), 1600);
  }

  async function shareDesign() {
    if (!editableCard || !response) {
      return;
    }

    const payload = {
      room: response.room,
      card: editableCard,
      products: response.products
    };
    const encoded = encodeSharePayload(payload);
    const url = `${window.location.origin}${window.location.pathname}#design=${encoded}`;
    await navigator.clipboard?.writeText(url);
    setSaving("Link copied");
    window.setTimeout(() => setSaving(""), 1600);
  }

  function loadSharedDesign() {
    const hash = window.location.hash.startsWith("#design=") ? window.location.hash.replace("#design=", "") : "";

    if (!hash) {
      return;
    }

    try {
      const payload = decodeSharePayload(hash) as { room: Room; card: DesignCard; products: Product[] };
      setRoomType(payload.room.type);
      setWidthFt(payload.room.dimensions.widthIn / 12);
      setDepthFt(payload.room.dimensions.depthIn / 12);
      setResponse({
        room: payload.room,
        cards: [payload.card],
        products: payload.products,
        generatedAt: new Date().toISOString()
      });
      setSelectedCardId(payload.card.id);
      setEditableCard(cloneCard(payload.card));
      setSelectedItemId(payload.card.items[0]?.id ?? null);
    } catch {
      setError("Unable to open shared design.");
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="control-panel" aria-label="Room controls">
          <div className="brand-row">
            <div className="brand-mark">
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">Interior MVP</p>
              <h1>Room cards that fit</h1>
            </div>
          </div>

          <form onSubmit={generateCards} className="form-stack">
            <div className="segmented" role="group" aria-label="Room type">
              {roomOptions.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={roomType === room.id ? "active" : ""}
                  onClick={() => changeRoomType(room.id)}
                >
                  {room.label}
                </button>
              ))}
            </div>

            <label>
              <span>
                <Ruler size={16} aria-hidden="true" />
                Width
              </span>
              <input
                type="number"
                min="8"
                max="20"
                value={widthFt}
                onChange={(event) => setWidthFt(Number(event.target.value))}
              />
            </label>

            <label>
              <span>
                <Ruler size={16} aria-hidden="true" />
                Depth
              </span>
              <input
                type="number"
                min="8"
                max="24"
                value={depthFt}
                onChange={(event) => setDepthFt(Number(event.target.value))}
              />
            </label>

            <label>
              <span>
                <ShoppingBag size={16} aria-hidden="true" />
                Budget
              </span>
              <input
                type="number"
                min="300"
                step="50"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </label>

            <div className="segmented style-grid" role="group" aria-label="Style filters">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={styles.includes(style.id) ? "active" : ""}
                  onClick={() => toggleStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>

            <button className="primary-action" type="submit" disabled={loading}>
              <Sparkles size={18} aria-hidden="true" />
              {loading ? "Generating" : "Generate cards"}
            </button>
          </form>

          <div className="save-actions">
            <button type="button" onClick={saveDesign} disabled={!editableCard}>
              <Save size={16} aria-hidden="true" />
              Save
            </button>
            <button type="button" onClick={shareDesign} disabled={!editableCard}>
              <Copy size={16} aria-hidden="true" />
              Share
            </button>
          </div>

          {saving ? <p className="save-status">{saving}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </aside>

        <section className="main-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{roomType === "home_office" ? "Office MVP" : "Bedroom MVP"}</p>
              <h2>Generated design cards</h2>
            </div>
            <p className="timestamp">{response ? `Updated ${new Date(response.generatedAt).toLocaleTimeString()}` : ""}</p>
          </div>

          <div className="card-grid">
            {response?.cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`design-card ${selectedCard?.id === card.id ? "selected" : ""}`}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="card-topline">
                  <h3>{card.title}</h3>
                  <span>{formatMoney(card.totalPriceCents)}</span>
                </div>
                <p>{card.summary}</p>
                <div className="palette" aria-label={`${card.title} palette`}>
                  {card.palette.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </div>
                <ScoreRow label="Fit" value={card.fitScore} />
                <ScoreRow label="Budget" value={card.budgetScore} />
              </button>
            ))}
          </div>

          <div className="detail-layout">
            <section className="floor-plan-panel" aria-label="Floor plan preview">
              {response && editableCard ? (
                <FloorPlan
                  room={response.room}
                  card={editableCard}
                  products={response.products}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onMoveItem={(itemId, placement) => {
                    setEditableCard((current) => current ? {
                      ...current,
                      items: current.items.map((item) => item.id === itemId ? { ...item, placement } : item)
                    } : current);
                  }}
                />
              ) : (
                <div className="empty-state">Generate a room to preview the plan.</div>
              )}
            </section>

            <section className="shopping-panel" aria-label="Shopping list">
              {editableCard ? (
                <>
                  <div className="panel-subhead">
                    <h3>Editable layout</h3>
                    <span>{editableCard.items.length} placements</span>
                  </div>
                  <SandboxTools
                    selectedItem={selectedProduct}
                    card={editableCard}
                    products={response?.products ?? []}
                    onRotate={rotateSelected}
                    onDelete={deleteSelected}
                    onDuplicate={duplicateSelected}
                    onNudge={nudgeSelected}
                    onSwap={swapSelected}
                  />
                  <ProductList card={editableCard} products={response?.products ?? []} total={currentTotal} />
                  <div className="score-summary">
                    <ScoreRow label="Fit" value={currentFitScore} />
                    <ScoreRow label="Budget" value={currentBudgetScore} />
                  </div>
                  <Warnings warnings={currentWarnings} />
                </>
              ) : null}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <meter min="0" max="1" value={value} />
      <strong>{Math.round(value * 100)}</strong>
    </div>
  );
}

function FloorPlan({
  room,
  card,
  products,
  selectedItemId,
  onSelectItem,
  onMoveItem
}: {
  room: Room;
  card: DesignCard;
  products: Product[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onMoveItem: (itemId: string, placement: LayoutItem["placement"]) => void;
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const scale = 420 / Math.max(room.dimensions.widthIn, room.dimensions.depthIn);
  const width = room.dimensions.widthIn * scale;
  const depth = room.dimensions.depthIn * scale;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<{ itemId: string; offsetX: number; offsetY: number } | null>(null);

  function pointFromEvent(event: PointerEvent<SVGElement>) {
    const svg = svgRef.current;

    if (!svg) {
      return { xIn: 0, yIn: 0 };
    }

    const rect = svg.getBoundingClientRect();
    return {
      xIn: ((event.clientX - rect.left) / rect.width) * (width + 24) / scale - 12 / scale,
      yIn: ((event.clientY - rect.top) / rect.height) * (depth + 24) / scale - 12 / scale
    };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragging) {
      return;
    }

    const item = card.items.find((candidate) => candidate.id === dragging.itemId);
    const product = item ? productById.get(item.productId) : undefined;

    if (!item || !product) {
      return;
    }

    const point = pointFromEvent(event);
    onMoveItem(
      item.id,
      clampPlacement(
        {
          ...item.placement,
          xIn: point.xIn - dragging.offsetX,
          yIn: point.yIn - dragging.offsetY
        },
        room,
        product
      )
    );
  }

  return (
    <svg
      ref={svgRef}
      className="floor-plan"
      viewBox={`0 0 ${width + 24} ${depth + 24}`}
      role="img"
      aria-label="Top down room layout"
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
    >
      <rect x="12" y="12" width={width} height={depth} rx="4" className="room-outline" />
      {room.windows.map((window) => (
        <rect
          key={window.id}
          x={12 + window.offsetIn * scale}
          y="8"
          width={window.widthIn * scale}
          height="8"
          rx="3"
          className="window-line"
        />
      ))}
      {room.doors.map((door) => (
        <rect
          key={door.id}
          x={12 + (door.wall === "east" ? room.dimensions.widthIn - door.swingDepthIn : door.offsetIn) * scale}
          y={12 + door.offsetIn * scale}
          width={(door.wall === "east" || door.wall === "west" ? door.swingDepthIn : door.widthIn) * scale}
          height={(door.wall === "east" || door.wall === "west" ? door.widthIn : door.swingDepthIn) * scale}
          className="door-swing"
        />
      ))}
      {card.items.map((item) => {
        const product = productById.get(item.productId);

        if (!product) {
          return null;
        }

        const rotated = Math.abs(item.placement.rotationDeg % 180) === 90;
        const productWidth = (rotated ? product.dimensions.depthIn : product.dimensions.widthIn) * scale;
        const productDepth = (rotated ? product.dimensions.widthIn : product.dimensions.depthIn) * scale;
        const x = 12 + item.placement.xIn * scale - productWidth / 2;
        const y = 12 + item.placement.yIn * scale - productDepth / 2;

        return (
          <g
            key={item.id}
            className="draggable-item"
            onPointerDown={(event) => {
              const point = pointFromEvent(event);
              onSelectItem(item.id);
              setDragging({
                itemId: item.id,
                offsetX: point.xIn - item.placement.xIn,
                offsetY: point.yIn - item.placement.yIn
              });
            }}
          >
            <rect
              x={x}
              y={y}
              width={productWidth}
              height={productDepth}
              rx="5"
              className={`item item-${product.category} ${selectedItemId === item.id ? "selected-item" : ""}`}
            />
            <text x={x + productWidth / 2} y={y + productDepth / 2} textAnchor="middle" dominantBaseline="middle">
              {labelFor(product.category)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SandboxTools({
  selectedItem,
  card,
  products,
  onRotate,
  onDelete,
  onDuplicate,
  onNudge,
  onSwap
}: {
  selectedItem?: LayoutItem;
  card: DesignCard;
  products: Product[];
  onRotate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onNudge: (dx: number, dy: number) => void;
  onSwap: (productId: string) => void;
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const selectedProduct = selectedItem ? productById.get(selectedItem.productId) : undefined;
  const alternatives = selectedItem ? card.productAlternatives[selectedItem.id] ?? [] : [];

  return (
    <div className="sandbox-tools">
      <div className="selected-line">
        <Move size={16} aria-hidden="true" />
        <strong>{selectedProduct?.name ?? "Select an item"}</strong>
      </div>
      <div className="tool-row">
        <button type="button" onClick={onRotate} disabled={!selectedItem} title="Rotate">
          <RotateCw size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={onDuplicate} disabled={!selectedItem} title="Duplicate">
          <Download size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={onDelete} disabled={!selectedItem} title="Delete">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="nudge-grid" aria-label="Nudge selected item">
        <button type="button" onClick={() => onNudge(0, -6)} disabled={!selectedItem}>Up</button>
        <button type="button" onClick={() => onNudge(-6, 0)} disabled={!selectedItem}>Left</button>
        <button type="button" onClick={() => onNudge(6, 0)} disabled={!selectedItem}>Right</button>
        <button type="button" onClick={() => onNudge(0, 6)} disabled={!selectedItem}>Down</button>
      </div>
      <label className="swap-select">
        <span>Swap item</span>
        <select
          value={selectedItem?.productId ?? ""}
          onChange={(event) => onSwap(event.target.value)}
          disabled={!selectedItem || alternatives.length === 0}
        >
          {selectedItem && selectedProduct ? <option value={selectedProduct.id}>{selectedProduct.name}</option> : null}
          {alternatives.map((productId) => {
            const product = productById.get(productId);
            return product ? <option key={product.id} value={product.id}>{product.name}</option> : null;
          })}
        </select>
      </label>
    </div>
  );
}

function ProductList({ card, products, total }: { card: DesignCard; products: Product[]; total: number }) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const placementCounts = new Map<string, number>();

  for (const item of card.items) {
    placementCounts.set(item.productId, (placementCounts.get(item.productId) ?? 0) + 1);
  }

  return (
    <div className="product-list">
      <div className="total-row">
        <strong>Total</strong>
        <em>{formatMoney(total)}</em>
      </div>
      {Array.from(placementCounts.entries()).map(([productId, count]) => {
        const product = productById.get(productId);

        if (!product) {
          return null;
        }

        return (
          <a key={productId} className="product-row" href={product.purchaseUrl} target="_blank" rel="noreferrer">
            <span className="product-swatch" />
            <span>
              <strong>{count > 1 ? `${count}x ` : ""}{product.name}</strong>
              <small>
                {product.retailerName} / {product.dimensions.widthIn}x{product.dimensions.depthIn} in
              </small>
            </span>
            <em>{formatMoney(product.priceCents * count)}</em>
          </a>
        );
      })}
    </div>
  );
}

function Warnings({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) {
    return (
      <div className="warning-box clear">
        <CheckCircle2 size={18} aria-hidden="true" />
        No layout blockers in this generated plan.
      </div>
    );
  }

  return (
    <div className="warning-stack">
      {warnings.map((warning, index) => (
        <div key={`${warning.code}-${index}`} className={`warning-box ${warning.severity}`}>
          <AlertTriangle size={18} aria-hidden="true" />
          {warning.message}
        </div>
      ))}
    </div>
  );
}

function createRoom(roomType: RoomType, widthFt: number, depthFt: number): Room {
  return {
    id: `room_demo_${roomType}`,
    type: roomType,
    dimensions: {
      widthIn: widthFt * 12,
      depthIn: depthFt * 12,
      ceilingHeightIn: 96
    },
    doors: [
      {
        id: "door_entry",
        wall: "east",
        offsetIn: Math.max(depthFt * 12 - 50, 24),
        widthIn: 32,
        swingDepthIn: 36
      }
    ],
    windows: [
      {
        id: "window_north",
        wall: "north",
        offsetIn: Math.max(widthFt * 6 - 30, 12),
        widthIn: 60,
        heightIn: 48,
        sillHeightIn: 32
      }
    ],
    existingItems: []
  };
}

function cloneCard(card: DesignCard): DesignCard {
  return JSON.parse(JSON.stringify(card)) as DesignCard;
}

function totalForItems(items: LayoutItem[], productById: Map<string, Product>): number {
  return items.reduce((total, item) => total + (productById.get(item.productId)?.priceCents ?? 0), 0);
}

function clampPlacement(placement: LayoutItem["placement"], room: Room, product?: Product): LayoutItem["placement"] {
  if (!product) {
    return placement;
  }

  const rotated = Math.abs(placement.rotationDeg % 180) === 90;
  const width = rotated ? product.dimensions.depthIn : product.dimensions.widthIn;
  const depth = rotated ? product.dimensions.widthIn : product.dimensions.depthIn;

  return {
    ...placement,
    xIn: Math.min(Math.max(placement.xIn, width / 2), room.dimensions.widthIn - width / 2),
    yIn: Math.min(Math.max(placement.yIn, depth / 2), room.dimensions.depthIn - depth / 2)
  };
}

function encodeSharePayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeSharePayload(value: string): unknown {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function labelFor(category: string): string {
  return category
    .split("_")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
