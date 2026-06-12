import { AlertTriangle, CheckCircle2, Ruler, ShoppingBag, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Severity = "info" | "warning" | "error";

interface Room {
  id: string;
  type: "bedroom" | "home_office" | "living_room" | "dorm_room";
  dimensions: {
    widthIn: number;
    depthIn: number;
    ceilingHeightIn: number;
  };
  doors: Array<{
    id: string;
    wall: "north" | "east" | "south" | "west";
    offsetIn: number;
    widthIn: number;
    swingDepthIn: number;
  }>;
  windows: Array<{
    id: string;
    wall: "north" | "east" | "south" | "west";
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
}

interface LayoutItem {
  id: string;
  productId: string;
  placement: {
    xIn: number;
    yIn: number;
    rotationDeg: number;
  };
}

interface Warning {
  code: string;
  severity: Severity;
  message: string;
  itemIds: string[];
}

interface DesignCard {
  id: string;
  title: string;
  summary: string;
  palette: string[];
  items: LayoutItem[];
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

const styleOptions = [
  { id: "cozy-neutral", label: "Cozy" },
  { id: "japandi-calm", label: "Japandi" },
  { id: "modern-contrast", label: "Modern" },
  { id: "budget-refresh", label: "Budget" }
];

export function App() {
  const [widthFt, setWidthFt] = useState(11);
  const [depthFt, setDepthFt] = useState(13);
  const [budget, setBudget] = useState(1500);
  const [styles, setStyles] = useState(["cozy-neutral", "japandi-calm", "modern-contrast"]);
  const [response, setResponse] = useState<DesignResponse | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = useMemo(() => {
    return response?.cards.find((card) => card.id === selectedCardId) ?? response?.cards[0];
  }, [response, selectedCardId]);

  async function generateCards(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const room: Room = {
      id: "room_demo_bedroom",
      type: "bedroom",
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

    try {
      const result = await fetch("/api/design-cards", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          room,
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
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate designs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void generateCards();
  }, []);

  function toggleStyle(styleId: string) {
    setStyles((current) => {
      if (current.includes(styleId)) {
        const next = current.filter((id) => id !== styleId);
        return next.length ? next : current;
      }

      return [...current, styleId];
    });
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

            <div className="segmented" role="group" aria-label="Style filters">
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

          {error ? <p className="error-text">{error}</p> : null}
        </aside>

        <section className="main-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Bedroom MVP</p>
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
              {response && selectedCard ? (
                <FloorPlan room={response.room} card={selectedCard} products={response.products} />
              ) : (
                <div className="empty-state">Generate a room to preview the plan.</div>
              )}
            </section>

            <section className="shopping-panel" aria-label="Shopping list">
              {selectedCard ? (
                <>
                  <div className="panel-subhead">
                    <h3>Shopping list</h3>
                    <span>{selectedCard.items.length} placements</span>
                  </div>
                  <ProductList card={selectedCard} products={response?.products ?? []} />
                  <Warnings warnings={selectedCard.warnings} />
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

function FloorPlan({ room, card, products }: { room: Room; card: DesignCard; products: Product[] }) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const scale = 420 / Math.max(room.dimensions.widthIn, room.dimensions.depthIn);
  const width = room.dimensions.widthIn * scale;
  const depth = room.dimensions.depthIn * scale;

  return (
    <svg className="floor-plan" viewBox={`0 0 ${width + 24} ${depth + 24}`} role="img" aria-label="Top down room layout">
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
          <g key={item.id}>
            <rect
              x={x}
              y={y}
              width={productWidth}
              height={productDepth}
              rx="5"
              className={`item item-${product.category}`}
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

function ProductList({ card, products }: { card: DesignCard; products: Product[] }) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const placementCounts = new Map<string, number>();

  for (const item of card.items) {
    placementCounts.set(item.productId, (placementCounts.get(item.productId) ?? 0) + 1);
  }

  return (
    <div className="product-list">
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

