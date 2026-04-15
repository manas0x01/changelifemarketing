"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

/* ═══════════════════════════════════════════════════════════════
   LAYOUT CONSTANTS
═══════════════════════════════════════════════════════════════ */
const AR    = 26;   // avatar circle radius (px)
const NW    = 130;  // member name-card width
const NH    = 44;   // member name-card height
const SW    = 72;   // open/close slot box width
const SH    = 34;   // open/close slot box height
const HG    = 30;   // horizontal gap between sibling subtrees
const VS    = 124;  // vertical step: avatar-center to next avatar-center
const MAXD  = 2;    // 0-indexed max depth shown (3 visible levels: 0,1,2)
// Member node total height from avatar-center: AR + 4 + NH = 74 px
// Gap between parent-card-bottom and child-avatar-top = VS - 2·AR - NH - 4 ≈ 18px

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type NodeType = "active" | "gold" | "open" | "close";

interface MNode {
  id          : string;           // SM-ID displayed in card
  name        : string;           // full name
  userId      : string;           // username for API calls
  type        : NodeType;
  position   ?: "left" | "right";
  // Popup detail fields (populated by API)
  sponsorId  ?: string;
  joiningDate?: string;
  package    ?: string;
  leftId     ?: string;
  rightId    ?: string;
  leftCount  ?: number;
  rightCount ?: number;
  totalCount ?: number;
  children   ?: MNode[];
}

interface LayoutNode {
  node  : MNode;
  x     : number;
  y     : number;
  depth : number;
  ch    : LayoutNode[];
  slot  : boolean;   // true = virtual open/close placeholder
}

interface PopupState {
  node : MNode;
  left : number;
  top  : number;
}

const isSlot = (n: MNode) => n.type === "open" || n.type === "close";

function subtreeW(node: MNode | null, d: number): number {
  if (!node || isSlot(node)) return SW;
  const ch = node.children ?? [];
  const L  = ch.find(c => c.position === "left")  ?? null;
  const R  = ch.find(c => c.position === "right") ?? null;
  if (d >= MAXD || (!L && !R)) return NW;
  const lw = L ? subtreeW(L, d + 1) : SW;
  const rw = R ? subtreeW(R, d + 1) : SW;
  return Math.max(NW, lw + HG + rw);
}

function buildLayout(
  node    : MNode,
  cx      : number,
  cy      : number,
  depth   : number,
  virtSlot: boolean = false,
): LayoutNode {
  const ln: LayoutNode = {
    node, x: cx, y: cy, depth, ch: [], slot: virtSlot || isSlot(node),
  };

  // Slots and depth-limit nodes are leaves
  if (ln.slot || depth >= MAXD) return ln;

  const ch = node.children ?? [];
  const L  = ch.find(c => c.position === "left")  ?? null;
  const R  = ch.find(c => c.position === "right") ?? null;

  // Create virtual placeholder nodes when a side is empty
  const lNode: MNode = L ?? {
    id: `vl-${node.id}`, name: "Open", userId: "", type: "open", position: "left",
  };
  const rNode: MNode = R ?? {
    id: `vr-${node.id}`, name: "Open", userId: "", type: "open", position: "right",
  };

  const lw   = L ? subtreeW(L, depth + 1) : SW;
  const rw   = R ? subtreeW(R, depth + 1) : SW;
  const half = (lw + HG + rw) / 2;

  ln.ch.push(buildLayout(lNode, cx - half + lw / 2, cy + VS, depth + 1, !L));
  ln.ch.push(buildLayout(rNode, cx + half - rw / 2, cy + VS, depth + 1, !R));
  return ln;
}

function flatNodes(ln: LayoutNode, out: LayoutNode[] = []): LayoutNode[] {
  out.push(ln);
  ln.ch.forEach(c => flatNodes(c, out));
  return out;
}

function flatEdges(
  ln  : LayoutNode,
  out : { x1: number; y1: number; x2: number; y2: number }[] = [],
) {
  // Parent connection point: bottom of card (member) or bottom of slot box
  const py = ln.slot ? ln.y + SH / 2 : ln.y + AR + NH + 4;
  ln.ch.forEach(c => {
    // Child connection point: top of avatar circle or top of slot box
    const cy = c.slot ? c.y - SH / 2 : c.y - AR;
    out.push({ x1: ln.x, y1: py, x2: c.x, y2: cy });
    flatEdges(c, out);
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   SVG AVATAR PRIMITIVES (pure SVG, no foreignObject)
═══════════════════════════════════════════════════════════════ */
function AvatarActive({ x, y }: { x: number; y: number }) {
  const r = AR;
  const f = (v: number) => r * v;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#1565c0" strokeWidth="2.5"/>
      {/* Face */}
      <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7"/>
      {/* Hair */}
      <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f"/>
      {/* Hat brim */}
      <rect x={x - f(0.56)} y={y - f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a"/>
      {/* Hat top */}
      <rect x={x - f(0.38)} y={y - f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a"/>
      {/* Body */}
      <path
        d={`M${x - f(0.76)},${y + r} Q${x - f(0.6)},${y + f(0.5)} ${x},${y + f(0.46)} Q${x + f(0.6)},${y + f(0.5)} ${x + f(0.76)},${y + r}`}
        fill="#1976d2"
      />
    </g>
  );
}

function AvatarGold({ x, y }: { x: number; y: number }) {
  const r = AR;
  const f = (v: number) => r * v;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#f57c00" strokeWidth="2.5"/>
      <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7"/>
      <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f"/>
      <rect x={x - f(0.56)} y={y - f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a"/>
      <rect x={x - f(0.38)} y={y - f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a"/>
      <path
        d={`M${x - f(0.76)},${y + r} Q${x - f(0.6)},${y + f(0.5)} ${x},${y + f(0.46)} Q${x + f(0.6)},${y + f(0.5)} ${x + f(0.76)},${y + r}`}
        fill="#f9a825"
      />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TREE SVG RENDERER
═══════════════════════════════════════════════════════════════ */
function TreeSVG({
  root,
  onNodeClick,
}: {
  root        : MNode | null;
  onNodeClick : (node: MNode, e: React.MouseEvent) => void;
}) {
  if (!root) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#7ec8e3", fontSize: 13 }}>
        Enter a Username and click Filter to view the tree
      </div>
    );
  }

  const rootW  = subtreeW(root, 0);
  const cx     = Math.max(rootW / 2 + 80, 440);
  const svgW   = cx * 2;
  const svgH   = (MAXD + 1) * VS + AR + NH + 60;
  const rootLN = buildLayout(root, cx, AR + 36, 0);
  const nodes  = flatNodes(rootLN);
  const edges  = flatEdges(rootLN);

  return (
    <svg
      width={svgW}
      height={svgH}
      style={{ minWidth: svgW, display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Connector lines ── */}
      {edges.map((e, i) => {
        const mid = (e.y1 + e.y2) / 2;
        return (
          <path
            key={`e-${i}`}
            d={`M${e.x1},${e.y1} L${e.x1},${mid} L${e.x2},${mid} L${e.x2},${e.y2}`}
            stroke="#64b5f6"
            strokeWidth="1.8"
            fill="none"
            strokeDasharray="none"
          />
        );
      })}

      {/* ── Nodes ── */}
      {nodes.map((ln, i) => {
        const { node: n, x, y, slot } = ln;

        /* ── Open / Close slot ── */
        if (slot) {
          const isOpen = n.type !== "close";
          const col    = isOpen ? "#27ae60" : "#e53935";
          const bg     = isOpen ? "#e8f5e9" : "#ffebee";
          return (
            <g key={`n-${i}`}>
              <rect
                x={x - SW / 2}
                y={y - SH / 2}
                width={SW}
                height={SH}
                rx="9"
                fill={bg}
                stroke={col}
                strokeWidth="2.5"
              />
              <text
                x={x}
                y={y + 4.5}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill={col}
                fontFamily="Poppins,sans-serif"
              >
                {isOpen ? "Open" : "Close"}
              </text>
            </g>
          );
        }

        /* ── Member node ── */
        const gold    = n.type === "gold";
        const cardTop = y + AR + 4;

        return (
          <g
            key={`n-${i}`}
            onClick={e => onNodeClick(n, e)}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`View details for ${n.id}`}
          >
            {/* Invisible larger hit zone */}
            <circle cx={x} cy={y} r={AR + 8} fill="transparent"/>

            {/* Glow ring on root node */}
            {ln.depth === 0 && (
              <circle
                cx={x}
                cy={y}
                r={AR + 5}
                fill="none"
                stroke={gold ? "#f9a825" : "#26a69a"}
                strokeWidth="2"
                opacity="0.5"
              />
            )}

            {/* Avatar */}
            {gold ? <AvatarGold x={x} y={y}/> : <AvatarActive x={x} y={y}/>}

            {/* Name card */}
            <rect
              x={x - NW / 2}
              y={cardTop}
              width={NW}
              height={NH}
              rx="8"
              fill={gold ? "#fff8e1" : "#ffffff"}
              stroke={gold ? "#f9a825" : "#90caf9"}
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={cardTop + 16}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill={gold ? "#e65100" : "#1565c0"}
              fontFamily="Poppins,sans-serif"
            >
              {n.id}
            </text>
            <text
              x={x}
              y={cardTop + 31}
              textAnchor="middle"
              fontSize="9.5"
              fill="#555"
              fontFamily="Poppins,sans-serif"
            >
              {n.name.length > 17 ? n.name.slice(0, 17) + "…" : n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER DETAIL POPUP
═══════════════════════════════════════════════════════════════ */
function MemberPopup({
  state,
  onClose,
}: {
  state  : PopupState;
  onClose: () => void;
}) {
  const { node: n, left, top } = state;
  const gold = n.type === "gold";

  const infoRows = [
    { label: "Sponsor ID",   val: n.sponsorId   || "—" },
    { label: "Joining Date", val: n.joiningDate  || "—" },
    { label: "Package",      val: n.package      || "—" },
    { label: "Left ID",      val: n.leftId       || "—" },
    { label: "Right ID",     val: n.rightId      || "—" },
  ];

  const countBadges = [
    { label: "LEFT",  val: n.leftCount  ?? 0, col: "#1565c0" },
    { label: "RIGHT", val: n.rightCount ?? 0, col: "#2e7d32" },
    { label: "TOTAL", val: n.totalCount ?? 0, col: "#6a1b9a" },
  ];

  return (
    <div
      style={{
        position    : "fixed",
        left        : left,
        top         : top,
        zIndex      : 2200,
        width       : 308,
        borderRadius: 14,
        overflow    : "hidden",
        boxShadow   : "0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)",
        border      : `2.5px solid ${gold ? "#f9a825" : "#26a69a"}`,
        fontFamily  : "Poppins,sans-serif",
        animation   : "ntPopIn .2s cubic-bezier(.16,1,.3,1)",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          background    : gold
            ? "linear-gradient(135deg,#e65100,#f9a825)"
            : "linear-gradient(135deg,#26a69a,#1de9b6)",
          padding       : "11px 14px",
          display       : "flex",
          alignItems    : "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width      : 36,
              height     : 36,
              borderRadius: "50%",
              background : "rgba(255,255,255,0.22)",
              display    : "flex",
              alignItems : "center",
              justifyContent: "center",
              fontSize   : 18,
            }}
          >
            {gold ? "👑" : "👤"}
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>{n.id}</p>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 10.5, margin: 0 }}>{n.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background  : "rgba(255,255,255,0.18)",
            border      : "none",
            borderRadius: 7,
            color       : "#fff",
            cursor      : "pointer",
            padding     : "4px 9px",
            fontSize    : 13,
            lineHeight  : 1,
            fontWeight  : 700,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ background: "#fff", padding: "12px 14px 14px" }}>
        {/* Info rows */}
        {infoRows.map(row => (
          <div
            key={row.label}
            style={{
              display       : "flex",
              justifyContent: "space-between",
              alignItems    : "center",
              padding       : "5.5px 0",
              borderBottom  : "1px solid #f2f2f2",
            }}
          >
            <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: 11.5, color: "#222", fontWeight: 600 }}>{row.val}</span>
          </div>
        ))}

        {/* Network count badges */}
        <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
          {countBadges.map(b => (
            <div
              key={b.label}
              style={{
                flex          : 1,
                textAlign     : "center",
                padding       : "8px 4px",
                borderRadius  : 9,
                background    : `${b.col}11`,
                border        : `1.5px solid ${b.col}30`,
              }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: b.col, lineHeight: 1 }}>{b.val}</p>
              <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 700, color: b.col, letterSpacing: 0.6 }}>
                {b.label}
              </p>
            </div>
          ))}
        </div>

        {/* Type badge */}
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <span
            style={{
              display    : "inline-block",
              padding    : "3px 12px",
              borderRadius: 20,
              fontSize   : 10,
              fontWeight : 700,
              background : gold ? "#fff8e1" : "#e3f2fd",
              color      : gold ? "#f57c00" : "#1565c0",
              border     : `1px solid ${gold ? "#f9a825" : "#90caf9"}`,
              letterSpacing: 0.5,
            }}
          >
            {gold ? "⭐ GOLD MEMBER" : "✅ ACTIVE MEMBER"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function NetworkTreePage() {
  const { data: session }             = useSession();
  const [ddOpen,   setDdOpen]         = useState(false);
  const [memberId, setMemberId]       = useState("");
  const [treeRoot, setTreeRoot]       = useState<MNode | null>(null);
  const [loading,  setLoading]        = useState(false);
  const [error,    setError]          = useState("");
  const [autoLoaded, setAutoLoaded]   = useState(false);
  const [popup,    setPopup]          = useState<PopupState | null>(null);
  const scrollRef                     = useRef<HTMLDivElement>(null);

  /* ── Fetch tree data ── */
  const fetchTree = async (uid: string) => {
    const trimmed = uid.trim();
    if (!trimmed) { setError("Please enter a Username"); return; }
    setLoading(true); setError(""); setPopup(null);
    try {
      const res  = await fetch("/api/user/placement-tree", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ userId: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setTreeRoot(data.tree);
      } else {
        setError(data.error || "Failed to load placement tree");
        setTreeRoot(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setTreeRoot(null);
    } finally {
      setLoading(false);
    }
  };

  /* ── Auto-load on session ── */
  useEffect(() => {
    if (session?.user?.username && !autoLoaded) {
      setAutoLoaded(true);
      setMemberId(session.user.username);
      fetchTree(session.user.username);
    }
  }, [session?.user?.username, autoLoaded]);

  /* ── Node click → show popup ── */
  const handleNodeClick = (n: MNode, e: React.MouseEvent) => {
    if (isSlot(n)) return;
    e.stopPropagation();
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const pw  = 308;
    const ph  = 330;
    const box = (e.currentTarget as Element).getBoundingClientRect();
    // Position popup below the clicked node; clamp to viewport
    let lft = box.left + box.width / 2 - pw / 2;
    let top = box.bottom + 10;
    if (lft + pw > vw - 10) lft = vw - pw - 10;
    if (lft < 10)           lft = 10;
    if (top + ph > vh - 10) top = box.top - ph - 10;
    if (top < 10)           top = 10;
    setPopup({ node: n, left: lft, top });
  };

  /* ── Dismiss popup & dropdown on root click ── */
  const handleRootClick = () => {
    if (ddOpen)  setDdOpen(false);
    if (popup)   setPopup(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        @keyframes ntPopIn {
          from { opacity:0; transform:scale(.88) translateY(-8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ntSpin {
          to { transform:rotate(360deg); }
        }

        .nt-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* ── Breadcrumb ── */
        .nt-bc {
          padding: 10px 16px;
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .nt-bc a { color:#666; text-decoration:none; }
        .nt-bc a:hover { text-decoration:underline; }

        /* ── Page body ── */
        .nt-body { padding: 14px 10px 44px; }
        @media(min-width:600px)  { .nt-body { padding: 18px 16px 44px; } }
        @media(min-width:1024px) { .nt-body { padding: 20px 20px 44px; } }

        /* ── Main card ── */
        .nt-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
        }

        /* ── Section header ── */
        .nt-hdr {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nt-hdr-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        /* ── Legend ── */
        .nt-legend {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 22px;
          padding: 14px 16px 10px;
          flex-wrap: wrap;
          border-bottom: 1px solid #f0f0f0;
        }
        .nt-leg-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .nt-leg-lbl {
          font-size: 11px;
          color: #555;
          font-weight: 500;
        }

        /* ── Filter ── */
        .nt-filter { padding: 12px 14px 14px; }
        .nt-f-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .nt-f-grp {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 190px;
        }
        .nt-f-lbl { font-size: 12px; font-weight: 600; color: #333; }
        .nt-f-in {
          border: 1.5px solid #d4d4d4;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #fff;
          outline: none;
          height: 38px;
          width: 100%;
          transition: border-color .18s, box-shadow .18s;
        }
        .nt-f-in::placeholder { color: #bbb; }
        .nt-f-in:focus {
          border-color: #26a69a;
          box-shadow: 0 0 0 3px rgba(38,166,154,.12);
        }
        .nt-f-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0 26px;
          height: 38px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background .18s, box-shadow .18s, transform .12s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nt-f-btn:hover:not(:disabled) {
          background: #1565c0;
          box-shadow: 0 4px 14px rgba(25,118,210,.28);
          transform: translateY(-1px);
        }
        .nt-f-btn:disabled { background: #b0bec5; cursor: not-allowed; transform: none; }
        .nt-err {
          color: #c62828;
          font-size: 12px;
          margin-top: 8px;
          padding: 7px 12px;
          background: #ffebee;
          border-radius: 5px;
          border-left: 3px solid #c62828;
        }

        /* ── Tree layout wrapper ── */
        .nt-tree-wrap {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #e8e8e8;
        }
        @media(min-width:768px) { .nt-tree-wrap { flex-direction: row; } }

        /* ── Sidebar ── */
        .nt-sidebar {
          width: 100%;
          padding: 12px 14px;
          border-bottom: 1px solid #e8e8e8;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        @media(min-width:768px) {
          .nt-sidebar {
            width: 160px;
            flex-direction: column;
            align-items: center;
            padding: 18px 12px;
            border-right: 1px solid #e8e8e8;
            border-bottom: none;
            flex-shrink: 0;
          }
        }
        @media(min-width:1024px) { .nt-sidebar { width: 188px; padding: 22px 14px; } }

        .nt-sb-av {
          width: 58px; height: 58px;
          border-radius: 50%;
          background: #e3f2fd;
          border: 2.5px solid #90caf9;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        @media(min-width:768px) { .nt-sb-av { width: 68px; height: 68px; margin-bottom: 10px; } }

        .nt-sb-lbl { font-size: 11px; font-weight: 700; color: #1565c0; line-height: 1.5; }
        .nt-sb-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .nt-sb-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff5722; flex-shrink: 0; }
        .nt-sb-id  { font-size: 12px; font-weight: 600; color: #222; word-break: break-all; }

        /* ── Canvas ── */
        .nt-canvas {
          flex: 1;
          overflow: auto;
          background: linear-gradient(160deg, #1565c0 0%, #0d47a1 100%);
          min-height: 380px;
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: #ffa000 #0d47a1;
        }
        @media(min-width:768px)  { .nt-canvas { min-height: 440px; } }
        @media(min-width:1024px) { .nt-canvas { min-height: 520px; } }

        .nt-canvas::-webkit-scrollbar { width: 7px; height: 7px; }
        .nt-canvas::-webkit-scrollbar-track { background: #0d47a1; }
        .nt-canvas::-webkit-scrollbar-thumb { background: #ffa000; border-radius: 4px; }

        .nt-canvas-inner {
          padding: 26px 36px 38px;
          display: inline-block;
          min-width: 100%;
        }
        @media(min-width:1024px) { .nt-canvas-inner { padding: 32px 44px 44px; } }

        /* ── Loading spinner ── */
        .nt-spin {
          display: inline-block;
          width: 34px; height: 34px;
          border: 4px solid rgba(255,255,255,.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ntSpin .85s linear infinite;
        }

        /* ── Popup overlay (transparent dismiss layer) ── */
        .nt-overlay {
          position: fixed;
          inset: 0;
          z-index: 2100;
          background: transparent;
        }
      `}</style>

      <div className="nt-root" onClick={handleRootClick}>
        {/* Top nav */}
        <Navbar dropdownOpen={ddOpen} setDropdownOpen={setDdOpen} setActivePage={() => {}} />

        {/* Breadcrumb */}
        <div className="nt-bc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#777">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <a href="/dashboard">Home</a>
          <span style={{ color: "#ccc" }}>/</span>
          <span>My Network</span>
          <span style={{ color: "#ccc" }}>/</span>
          <span style={{ color: "#26a69a", fontWeight: 600 }}>Network Tree</span>
        </div>

        <div className="nt-body">
          <div className="nt-card">

            {/* ── Header ── */}
            <div className="nt-hdr">
              <span className="nt-hdr-title">Network Tree (Placement Tree)</span>
            </div>

            {/* ── Legend ── */}
            <div className="nt-legend">
              {/* Active ID */}
              <div className="nt-leg-item">
                <svg width="42" height="42" viewBox="-4 -4 60 60" xmlns="http://www.w3.org/2000/svg">
                  <AvatarActive x={26} y={26}/>
                </svg>
                <span className="nt-leg-lbl">Active ID</span>
              </div>

              {/* Gold ID */}
              <div className="nt-leg-item">
                <svg width="42" height="42" viewBox="-4 -4 60 60" xmlns="http://www.w3.org/2000/svg">
                  <AvatarGold x={26} y={26}/>
                </svg>
                <span className="nt-leg-lbl">Gold ID</span>
              </div>

              {/* Close for joining */}
              <div className="nt-leg-item">
                <div style={{
                  width: 50, height: 28, borderRadius: 8,
                  border: "2.5px solid #e53935",
                  background: "#ffebee",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#e53935" }}>Close</span>
                </div>
                <span className="nt-leg-lbl">Closed</span>
              </div>

              {/* Open for joining */}
              <div className="nt-leg-item">
                <div style={{
                  width: 50, height: 28, borderRadius: 8,
                  border: "2.5px solid #27ae60",
                  background: "#e8f5e9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#27ae60" }}>Open</span>
                </div>
                <span className="nt-leg-lbl">Open</span>
              </div>
            </div>

            {/* ── Filter ── */}
            <div className="nt-filter">
              <div className="nt-f-row">
                <div className="nt-f-grp">
                  <label className="nt-f-lbl">Username :</label>
                  <input
                    className="nt-f-in"
                    type="text"
                    placeholder="Enter Username (e.g., SM674643)"
                    value={memberId}
                    onChange={e => setMemberId(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchTree(memberId)}
                  />
                </div>
                <button
                  className="nt-f-btn"
                  onClick={() => fetchTree(memberId)}
                  disabled={loading}
                >
                  {loading
                    ? <span className="nt-spin" style={{ width: 16, height: 16, borderWidth: 3 }}/>
                    : null
                  }
                  {loading ? "Loading…" : "Filter"}
                </button>
              </div>
              {error && <div className="nt-err">{error}</div>}
            </div>

            {/* ── Tree layout ── */}
            <div className="nt-tree-wrap">

              {/* Sidebar */}
              <div className="nt-sidebar">
                <div className="nt-sb-av">
                  <svg width="54" height="54" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="#e3f2fd"/>
                    <ellipse cx="40" cy="28" rx="12" ry="13" fill="#f5cba7"/>
                    <ellipse cx="40" cy="17" rx="14" ry="8" fill="#3d2b1f"/>
                    <path d="M18 70 Q20 52 40 50 Q60 52 62 70 Z" fill="#c62828"/>
                    <rect x="37" y="50" width="6" height="22" fill="#fff"/>
                    <ellipse cx="40" cy="72" rx="22" ry="8" fill="#c62828"/>
                  </svg>
                </div>
                <div>
                  <p className="nt-sb-lbl">Searched<br/>Username</p>
                  <div className="nt-sb-row">
                    <div className="nt-sb-dot"/>
                    <span className="nt-sb-id">{memberId || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div className="nt-canvas" ref={scrollRef}>
                <div className="nt-canvas-inner">
                  {loading ? (
                    <div style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 14, padding: 70,
                    }}>
                      <div className="nt-spin"/>
                      <p style={{ color: "#90caf9", fontSize: 12, margin: 0 }}>
                        Loading placement tree…
                      </p>
                    </div>
                  ) : (
                    <TreeSVG root={treeRoot} onNodeClick={handleNodeClick}/>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Popup ── */}
        {popup && (
          <>
            {/* Transparent overlay to dismiss */}
            <div className="nt-overlay" onClick={() => setPopup(null)}/>
            <MemberPopup state={popup} onClose={() => setPopup(null)}/>
          </>
        )}
      </div>
    </>
  );
}