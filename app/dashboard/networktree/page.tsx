"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

// Premium Visual constants
let AR = 38;   // Larger Avatar Radius
let NW = 160;  // Wider Node Card
let NH = 72;   // Taller Node Card
let BS = 56;   // Box Size (for slots)
let SW = 140;  // Slot spacing
let HG = 180;  // Gap between branches
let VS = 240;  // Generous vertical spacing to prevent any overlap
let MAXD = 2;

type NodeType = "active" | "booster" | "open" | "close";

interface MNode {
  id: string;
  name: string;
  userId: string;
  type: NodeType;
  position?: "left" | "right";
  sponsorId?: string;
  joiningDate?: string;
  package?: string;
  leftId?: string;
  rightId?: string;
  leftCount?: number;
  rightCount?: number;
  totalCount?: number;
  totalDirect?: { left: number; right: number };
  totalActiveDirect?: { left: number; right: number };
  totalLeftBasicUser?: number;
  totalRightBasicUser?: number;
  totalLeftBoosterUser?: number;
  totalRightBoosterUser?: number;
  children?: MNode[];
}

interface LayoutNode {
  node: MNode;
  x: number;
  y: number;
  depth: number;
  ch: LayoutNode[];
  slot: boolean;
}

interface PopupState {
  node: MNode;
  left: number;
  top: number;
  isPersistent?: boolean;
}

const isSlot = (n: MNode) => n.type === "open" || n.type === "close";

function treeW(node: MNode | null, depth: number): number {
  if (!node || node.type === "close") return SW;
  if (isSlot(node)) {
    return depth < MAXD ? SW + HG + SW : SW;
  }
  if (depth >= MAXD) return NW;
  const ch = node.children ?? [];
  const L = ch.find(c => c.position === "left") ?? null;
  const R = ch.find(c => c.position === "right") ?? null;
  const virtOpen: MNode = { id: "v", name: "open", userId: "", type: "open", position: "left" };
  const lw = L ? treeW(L, depth + 1) : treeW(virtOpen, depth + 1);
  const rw = R ? treeW(R, depth + 1) : treeW(virtOpen, depth + 1);
  return Math.max(NW, lw + HG + rw);
}

function buildLayout(
  node: MNode,
  cx: number,
  cy: number,
  depth: number,
  virtSlot: boolean = false,
): LayoutNode {
  const ln: LayoutNode = {
    node, x: cx, y: cy, depth, ch: [], slot: virtSlot || isSlot(node),
  };
  if (depth > MAXD) return ln;
  if (node.type === "close") return ln;
  if (isSlot(node) && node.userId) return ln;

  const ch = node.children ?? [];
  const L = ch.find(c => c.position === "left") ?? null;
  const R = ch.find(c => c.position === "right") ?? null;
  const cd = depth + 1;

  // For active/booster nodes, show open slots; for others (including close slots), don't create children
  const parentIsActive = node.type === "active" || node.type === "booster";
  const slotT: NodeType = parentIsActive ? "open" : "close";

  const lNode: MNode = L ?? {
    id: `vl-${node.id}`, name: isSlot(node) ? "close" : (parentIsActive ? "open" : "close"), userId: "", type: isSlot(node) ? "close" : slotT, position: "left",
  };
  const rNode: MNode = R ?? {
    id: `vr-${node.id}`, name: isSlot(node) ? "close" : (parentIsActive ? "open" : "close"), userId: "", type: isSlot(node) ? "close" : slotT, position: "right",
  };

  const virtSlotNode: MNode = { id: "v", name: "open", userId: "", type: "open", position: "left" };
  const lw = L ? treeW(L, cd) : treeW(virtSlotNode, cd);
  const rw = R ? treeW(R, cd) : treeW(virtSlotNode, cd);
  const half = (lw + HG + rw) / 2;

  ln.ch.push(buildLayout(lNode, cx - half + lw / 2, cy + VS, cd, !L));
  ln.ch.push(buildLayout(rNode, cx + half - rw / 2, cy + VS, cd, !R));
  return ln;
}

function flatNodes(ln: LayoutNode, out: LayoutNode[] = []): LayoutNode[] {
  out.push(ln);
  ln.ch.forEach(c => flatNodes(c, out));
  return out;
}

function flatEdges(
  ln: LayoutNode,
  out: { x1: number; y1: number; x2: number; y2: number }[] = [],
) {
  const py = ln.slot ? ln.y + BS / 2 : ln.y + AR + NH + 4;
  ln.ch.forEach(c => {
    const cy = c.slot ? c.y - BS / 2 : c.y - AR;
    // Adjust line endpoints to not cut through slot boxes
    if (c.slot) {
      // For slots, stop line at the edge of the slot box
      const slotTop = c.y - BS / 2;
      out.push({ x1: ln.x, y1: py, x2: c.x, y2: slotTop });
    } else {
      // For regular nodes, connect to the avatar top
      out.push({ x1: ln.x, y1: py, x2: c.x, y2: cy });
    }
    flatEdges(c, out);
  });
  return out;
}

function AvatarActive({ x, y, r }: { x: number; y: number; r: number }) {
  const f = (v: number) => r * v;
  return (
    <g>
      <defs>
        <filter id="blueHalo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#00d2ff" strokeWidth="3" filter="url(#blueHalo)" opacity="0.8" />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#00d2ff" strokeWidth="2" />
      <g opacity="0.9">
        <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7" />
        <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f" />
        <rect x={x - f(0.56)} y={y - f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a" />
        <rect x={x - f(0.38)} y={y - f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a" />
        <path d={`M${x - f(0.76)},${y + r} Q${x - f(0.6)},${y + f(0.5)} ${x},${y + f(0.46)} Q${x + f(0.6)},${y + f(0.5)} ${x + f(0.76)},${y + r}`} fill="#1a237e" />
      </g>
    </g>
  );
}

function AvatarBooster({ x, y, r }: { x: number; y: number; r: number }) {
  const f = (v: number) => r * v;
  return (
    <g>
      <defs>
        <filter id="goldHalo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={x} cy={y} r={r + 8} fill="none" stroke="#FFD700" strokeWidth="4" filter="url(#goldHalo)" opacity="0.9" />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#FFD700" strokeWidth="3" />
      <g opacity="1">
        <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7" />
        <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f" />
        <rect x={x - f(0.56)} y={y - f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a" />
        <rect x={x - f(0.38)} y={y - f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a" />
        <path d={`M${x - f(0.76)},${y + r} Q${x - f(0.6)},${y + f(0.5)} ${x},${y + f(0.46)} Q${x + f(0.6)},${y + f(0.5)} ${x + f(0.76)},${y + r}`} fill="#e65100" />
      </g>
    </g>
  );
}

function TreeSVG({
  root,
  onNodeClick,
  maxd,
}: {
  root: MNode | null;
  onNodeClick: (node: MNode, e: React.MouseEvent) => void;
  maxd: number;
}) {
  if (!root) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#7ec8e3", fontSize: 13 }}>
        Enter a Username and click Filter to view the tree
      </div>
    );
  }

  const rootW = treeW(root, 0);
  const cx = Math.max(rootW / 2 + 100, 440);
  const svgW = cx * 2;
  const svgH = (maxd + 1) * VS + AR + NH + 150;
  const rootLN = buildLayout(root, cx, AR + 40, 0);
  const nodes = flatNodes(rootLN);
  const edges = flatEdges(rootLN);

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      height="auto"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map((e, i) => {
        // Simple straight orthogonal lines for a clean, professional look
        const midY = (e.y1 + e.y2) / 2;
        return (
          <g key={`e-${i}`}>
            <path
              d={`M${e.x1},${e.y1} L${e.x1},${midY} L${e.x2},${midY} L${e.x2},${e.y2}`}
              stroke="#fff"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
            />
            {/* Glowing intersection dot */}
            <circle cx={e.x1} cy={midY} r="4" fill="#fff" filter="url(#blueHalo)" />
          </g>
        );
      })}

      {nodes.map((ln, i) => {
        const { node: n, x, y, slot, depth } = ln;

        if (slot) {
          const isOpen = n.type === "open";
          const col = isOpen ? "#2e7d32" : "#c62828";
          const cardW = 140;
          const cardH = 90;

          return (
            <g
              key={`n-${i}`}
              style={{ cursor: isOpen ? "pointer" : "default" }}
              onClick={e => {
                if (isOpen) { e.stopPropagation(); onNodeClick(n, e); }
              }}
            >
              {/* Dotted Slot Box */}
              <rect
                x={x - cardW / 2} y={y}
                width={cardW} height={cardH} rx="12"
                fill="none" stroke={col} strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8"
              />
              <circle cx={x} cy={y - 15} r="24" fill="none" stroke={col} strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />
              <path d={`M${x - 8},${y - 22} a8,8 0 1,1 16,0 a8,8 0 1,1 -16,0 M${x - 14},${y - 6} q0,-10 14,-10 q14,0 14,10`} fill="none" stroke={col} strokeWidth="2" opacity="0.8" />

              <text
                x={x} y={y + cardH - 25}
                textAnchor="middle" fontSize="11" fontWeight="900"
                fill={col} fontFamily="Poppins,sans-serif" letterSpacing="1"
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </text>
              <text
                x={x} y={y + cardH - 10}
                textAnchor="middle" fontSize="11" fontWeight="900"
                fill={col} fontFamily="Poppins,sans-serif" letterSpacing="1"
              >
                POSITION
              </text>
            </g>
          );
        }

        const booster = n.type === "booster";
        const cardTop = y + AR + 16;

        return (
          <g
            key={`n-${i}`}
            onClick={e => { e.stopPropagation(); onNodeClick(n, e); }}
            style={{ cursor: "pointer" }}
          >
            {/* Outer Aura */}
            <circle cx={x} cy={y} r={AR + 18} fill={booster ? "rgba(255, 215, 0, 0.1)" : "rgba(0, 255, 255, 0.05)"} />

            {booster ? <AvatarBooster x={x} y={y} r={AR} /> : <AvatarActive x={x} y={y} r={AR} />}

            {/* Card with Separator */}
            <rect
              x={x - NW / 2} y={cardTop}
              width={NW} height={NH} rx="14"
              fill="#fff"
              stroke={booster ? "#FFD700" : "#00BCD4"}
              strokeWidth="2.5"
              filter="url(#nodeShadow)"
            />

            <line
              x1={x - NW / 2 + 20} y1={cardTop + NH * 0.55}
              x2={x + NW / 2 - 20} y2={cardTop + NH * 0.55}
              stroke="#f0f0f0" strokeWidth="1.5"
            />

            <text
              x={x} y={cardTop + NH * 0.35}
              textAnchor="middle" fontSize="22" fontWeight="900"
              fill="#1a237e"
              fontFamily="Poppins,sans-serif"
            >
              {n.id}
            </text>

            <text
              x={x} y={cardTop + NH * 0.82}
              textAnchor="middle" fontSize="14" fontWeight="600"
              fill="#78909c"
              fontFamily="Poppins,sans-serif"
            >
              {n.name.length > 20 ? n.name.slice(0, 20) + "…" : n.name}
            </text>

            {/* Floating Status Badge */}
            <g transform={`translate(${x - 55}, ${cardTop - 18})`}>
              <rect width="110" height="30" rx="15" fill={booster ? "#FFD700" : "#00BCD4"} />
              <text x="55" y="20" textAnchor="middle" fontSize="11" fill="white" fontWeight="900" letterSpacing="1">
                {booster ? "BOOSTER" : "ACTIVE"}
              </text>
            </g>

            {/* More Downline Indicator */}
            {depth === maxd && n.children && n.children.length > 0 && (
              <g transform={`translate(${x}, ${cardTop + NH + 30})`}>
                <rect x="-80" y="-15" width="160" height="30" rx="15" fill="rgba(21, 101, 192, 0.15)" stroke="#1565c0" strokeWidth="1.5" />
                <text textAnchor="middle" y="6" fontSize="12" fill="#1565c0" fontWeight="900" fontFamily="Poppins,sans-serif" letterSpacing="0.8">
                  MORE LEVELS BELOW
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function SkeletonNode() {
  return (
    <g>
      <rect x="-80" y="20" width="160" height="100" rx="12" fill="none" stroke="#2e7d32" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
      <circle cx="0" cy="-10" r="28" fill="none" stroke="#2e7d32" strokeWidth="2" strokeDasharray="4,2" opacity="0.6" />
      <text y="65" textAnchor="middle" fontSize="12" fill="#2e7d32" fontWeight="900" opacity="0.6">OPEN POSITION</text>
    </g>
  );
}

function TreeSkeletonSVG() {
  const skNodes = [
    { x: 200, y: 50 },
    { x: 80, y: 180 }, { x: 320, y: 180 },
    { x: 40, y: 310 }, { x: 120, y: 310 },
    { x: 280, y: 310 }, { x: 360, y: 310 },
  ];
  return (
    <svg
      viewBox="0 0 520 400"
      width="100%"
      height="auto"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {[
        { x1: 200, y1: 90, x2: 80, y2: 130 },
        { x1: 200, y1: 90, x2: 320, y2: 130 },
        { x1: 80, y1: 220, x2: 40, y2: 250 },
        { x1: 80, y1: 220, x2: 120, y2: 250 },
        { x1: 320, y1: 220, x2: 280, y2: 250 },
        { x1: 320, y1: 220, x2: 360, y2: 250 },
      ].map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#e0e0e0" strokeWidth="1.5" />
      ))}
      {skNodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x},${n.y})`}><SkeletonNode /></g>
      ))}
    </svg>
  );
}

function FilterSkeleton() {
  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "190px" }}>
          <div style={{ height: "16px", background: "#e0e0e0", borderRadius: "4px", marginBottom: "6px", width: "60%" }} />
          <div style={{ height: "38px", background: "#e0e0e0", borderRadius: "6px" }} />
        </div>
        <div style={{ height: "38px", background: "#e0e0e0", borderRadius: "6px", width: "90px" }} />
      </div>
    </div>
  );
}

function TreeLegend() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      padding: "15px 30px",
      background: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(10px)",
      borderRadius: "50px",
      border: "1px solid rgba(255,255,255,0.1)",
      margin: "0 auto 30px auto",
      width: "fit-content",
      flexWrap: "wrap"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width="24" height="24" viewBox="0 0 40 40">
          <AvatarActive x={20} y={20} r={16} />
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#00d2ff", letterSpacing: "0.5px" }}>ACTIVE</div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Active Member</div>
        </div>
      </div>


      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #2e7d32", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2e7d32" }} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#2e7d32", letterSpacing: "0.5px" }}>OPEN POSITION</div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Available Slot</div>
        </div>
      </div>
  

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width="24" height="24" viewBox="0 0 40 40">
          <AvatarBooster x={20} y={20} r={16} />
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#FFD700", letterSpacing: "0.5px" }}>BOOSTER</div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Upline / Sponsor</div>
        </div>
      </div>
    </div>
  );
}

function MemberPopup({
  state,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onExplore,
}: {
  state: PopupState;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onExplore?: (userId: string) => void;
}) {
  const { node: n, left, top } = state;
  const booster = n.type === "booster";

  // Helper to format date with seconds
  const formatDate = (dateVal: any) => {
    if (!dateVal) return "—";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return dateVal;
    
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
  };

  const infoRows = [
    { label: "Sponsor ID", val: n.sponsorId || "—" },
    { label: "Joining Date", val: formatDate(n.joiningDate) },
    { label: "Package", val: n.package || "—" },
    { label: "Left ID", val: n.leftId || "—" },
    { label: "Right ID", val: n.rightId || "—" },
  ];

  const countBadges = [
    { label: "LEFT", val: n.totalDirect?.left ?? 0, col: "#1565c0" },
    { label: "RIGHT", val: n.totalDirect?.right ?? 0, col: "#2e7d32" },
    { label: "TOTAL", val: (n.totalDirect?.left ?? 0) + (n.totalDirect?.right ?? 0), col: "#6a1b9a" },
  ];

  const detailBadges = [
    { label: "ACT. DIR", val: (typeof n.totalActiveDirect === 'object' ? (n.totalActiveDirect.left + n.totalActiveDirect.right) : (n.totalActiveDirect ?? 0)), col: "#d32f2f" },
    { label: "L. BASIC", val: n.totalLeftBasicUser ?? 0, col: "#e67e22" },
    { label: "R. BASIC", val: n.totalRightBasicUser ?? 0, col: "#e67e22" },
    { label: "L. BOOST", val: n.totalLeftBoosterUser ?? 0, col: "#27ae60" },
    { label: "R. BOOST", val: n.totalRightBoosterUser ?? 0, col: "#27ae60" },
  ];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed", left, top,
        zIndex: 2200, width: 308,
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)",
        border: `2.5px solid ${booster ? "#f9a825" : "#26a69a"}`,
        fontFamily: "Poppins,sans-serif",
        animation: "ntPopIn .2s cubic-bezier(.16,1,.3,1)",
        maxWidth: "calc(100vw - 20px)",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: booster
          ? "linear-gradient(135deg,#e65100,#f9a825)"
          : "linear-gradient(135deg,#26a69a,#1de9b6)",
        padding: "11px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>
            {booster ? "👑" : "👤"}
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>{n.id}</p>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 10.5, margin: 0 }}>{n.name}</p>
          </div>
        </div>
        <button onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 7,
            color: "#fff", cursor: "pointer", padding: "4px 9px", fontSize: 13, fontWeight: 700
          }}>
          ✕
        </button>
      </div>

      <div style={{ background: "#fff", padding: "12px 14px 14px" }}>
        {infoRows.map(row => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "5.5px 0", borderBottom: "1px solid #f2f2f2"
          }}>
            <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: 11.5, color: "#222", fontWeight: 600 }}>{row.val}</span>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
          {countBadges.map(b => (
            <div key={b.label} style={{
              flex: 1, textAlign: "center", padding: "8px 4px",
              borderRadius: 9, background: `${b.col}11`, border: `1.5px solid ${b.col}30`
            }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: b.col, lineHeight: 1 }}>{b.val}</p>
              <p style={{ margin: "3px 0 0", fontSize: 8, fontWeight: 700, color: b.col, letterSpacing: 0.6 }}>{b.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
          {detailBadges.map(b => (
            <div key={b.label} style={{
              textAlign: "center", padding: "6px 2px",
              borderRadius: 8, background: `${b.col}11`, border: `1.2px solid ${b.col}25`
            }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: b.col, lineHeight: 1 }}>{b.val}</p>
              <p style={{ margin: "2px 0 0", fontSize: 7, fontWeight: 700, color: b.col, letterSpacing: 0.4 }}>{b.label}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 15, display: "flex", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (onExplore) onExplore(n.userId); }}
            style={{
              flex: 1,
              background: booster ? "#f57c00" : "#1565c0",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            EXPLORE DOWNLINE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NetworkTreePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ddOpen, setDdOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [treeRoot, setTreeRoot] = useState<MNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [flushMsg, setFlushMsg] = useState<string>("");
  const [currentSession, setCurrentSession] = useState<"morning" | "evening" | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSessionRef = useRef<"morning" | "evening" | null>(null);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  const [dimensions, setDimensions] = useState({
    ar: 24, nw: 100, nh: 40, bs: 44, sw: 100, hg: 180, vs: 165, maxd: 2
  });

  // Dynamically adjust tree levels and sizes for mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setDimensions({
          ar: 78,   // Super massive avatars for mobile
          nw: 160,  // Super wide cards
          nh: 100,
          bs: 100,
          sw: 180,
          hg: 160,
          vs: 500,  // Deepest vertical stretch
          maxd: 2
        });
      } else {
        setDimensions({
          ar: 58,
          nw: 230,
          nh: 110,
          bs: 72,
          sw: 190,
          hg: 420,
          vs: 360,
          maxd: 2
        });
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync constants with state for the helper functions
  AR = dimensions.ar;
  NW = dimensions.nw;
  NH = dimensions.nh;
  BS = dimensions.bs;
  SW = dimensions.sw;
  HG = dimensions.hg;
  VS = dimensions.vs;
  MAXD = dimensions.maxd;

  const getCurrentSession = (): "morning" | "evening" => {
    const currentHour = new Date().getHours();
    return currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
  };

  const checkSessionChangeAndRefresh = () => {
    // Session logic is now server-authoritative and sticky in the database.
    // We only refresh the tree to keep it up to date.
    if (memberId && treeRoot) {
      fetchTree(memberId);
    }
  };

  const fetchTree = async (uid: string, selectedPosition?: "left" | "right", forceSessionType?: "morning" | "evening") => {
    const trimmed = uid.trim();
    if (!trimmed) { setError("Please enter a Username"); return; }
    setLoading(true); setError(""); setPopup(null); setFlushMsg("");
    try {
      const body: any = { userId: trimmed, selectedPosition };
      if (forceSessionType) body.forceSessionType = forceSessionType;
      const res = await fetch("/api/user/placement-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        // The searched user becomes the root of the tree
        setTreeRoot(data.tree);
        // Track current session
        const sess = data.currentSessionType || getCurrentSession();
        setCurrentSession(sess);
        lastSessionRef.current = sess;

        // Show flush message if any
        if (data.flushMessage) {
          setFlushMsg(data.flushMessage);
          // Auto-clear after 5 seconds
          setTimeout(() => setFlushMsg(""), 5000);
        }
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


  // Restore last viewed member and refresh on mount
  useEffect(() => {
    const lastViewed = sessionStorage.getItem('networkTreeLastViewed');
    if (lastViewed) {
      console.log('[NETWORK TREE] Restoring last viewed member:', lastViewed);
      setMemberId(lastViewed);
      fetchTree(lastViewed);
      sessionStorage.removeItem('networkTreeLastViewed');
    } else if (session?.user?.username && !autoLoaded) {
      // Default to current user if no last viewed
      setAutoLoaded(true);
      setMemberId(session.user.username);
      fetchTree(session.user.username);
    }

    // Initialize session tracking
    lastSessionRef.current = getCurrentSession();

    // Set up session change monitoring - check every 30 seconds
    sessionCheckRef.current = setInterval(() => {
      checkSessionChangeAndRefresh();
    }, 30000); // 30 seconds

    // Cleanup timer on unmount
    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
        sessionCheckRef.current = null;
      }
    };
  }, [session?.user?.username]);

  // Refresh tree when page becomes visible (after registration)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && memberId && treeRoot) {
        // Check for session change first
        checkSessionChangeAndRefresh();
        console.log('[NETWORK TREE] Page became visible, refreshing tree for:', memberId);
        fetchTree(memberId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [memberId, treeRoot]);

  // Also refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (memberId && treeRoot) {
        // Check for session change first
        checkSessionChangeAndRefresh();
        console.log('[NETWORK TREE] Window focused, refreshing tree for:', memberId);
        fetchTree(memberId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [memberId, treeRoot]);

  const handleSlotClick = (n: MNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (n.type === "open") {
      const parentId = n.id.replace(/^v[lr]-/, "");
      // Store current memberId so we can refresh when we return
      sessionStorage.setItem('networkTreeLastViewed', memberId);
      router.push(`/dashboard/registration?placementId=${parentId}`);
    }
  };

  /* ── Card opening logic (triggered by click) ── */
  const fetchIdRef = useRef<string | null>(null);  // Track current fetch

  const handleOpenCard = (n: MNode, e: React.MouseEvent) => {
    if (isSlot(n)) return;
    e.stopPropagation();

    const currentFetchId = `${n.userId}-${Date.now()}`;
    fetchIdRef.current = currentFetchId;

    const vw = window.innerWidth, vh = window.innerHeight;
    const pw = 308, ph = 330;
    const box = (e.currentTarget as Element)?.getBoundingClientRect();
    if (!box) return;

    let lft = box.left + box.width / 2 - pw / 2;
    let top = box.bottom + 10;
    if (lft + pw > vw - 10) lft = vw - pw - 10;
    if (lft < 10) lft = 10;
    if (top + ph > vh - 10) top = box.top - ph - 10;
    if (top < 10) top = 10;

    const fetchMemberCard = async () => {
      try {
        const res = await fetch("/api/user/member-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: n.userId }),
        });
        const data = await res.json();

        // Only show if this is still the current fetch
        if (fetchIdRef.current === currentFetchId && data.success && data.card) {
          const card = data.card;
          setPopup({
            node: {
              ...n,
              sponsorId: card.sponsorId,
              joiningDate: card.joiningDate,
              package: card.package,
              leftId: card.leftId,
              rightId: card.rightId,
              leftCount: card.leftCount,
              rightCount: card.rightCount,
              totalCount: card.totalCount,
              totalDirect: card.totalDirect || { left: 0, right: 0 },
              totalActiveDirect: card.totalActiveDirect,
              totalLeftBasicUser: card.totalLeftBasicUser,
              totalRightBasicUser: card.totalRightBasicUser,
              totalLeftBoosterUser: card.totalLeftBoosterUser,
              totalRightBoosterUser: card.totalRightBoosterUser,
            },
            left: lft,
            top,
            isPersistent: true
          });
        }
      } catch (err) {
        console.error("Failed to fetch member card:", err);
      }
    };
    fetchMemberCard();
  };

  const handleNodeClick = (n: MNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSlot(n)) { handleSlotClick(n, e); return; }

    // On click, we show the popup in persistent mode
    handleOpenCard(n, e);
  };

  const handleExploreDownline = (userId: string) => {
    // Save current user to history before moving down
    if (memberId && memberId !== userId) {
      setHistory(prev => [...prev, memberId]);
    }
    setMemberId(userId);
    fetchTree(userId);
    setPopup(null);
  };

  const handleGoBack = () => {
    if (history.length === 0) return;

    const newHistory = [...history];
    const prevId = newHistory.pop();

    if (prevId) {
      setHistory(newHistory);
      setMemberId(prevId);
      fetchTree(prevId);
    }
  };

  const handleRootClick = () => {
    if (ddOpen) setDdOpen(false);
    if (popup) setPopup(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        @keyframes ntPopIn {
          from { opacity:0; transform:scale(.88) translateY(-8px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        @keyframes ntSpin {
          to { transform:rotate(360deg); }
        }

        .nt-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        .nt-bc { padding:10px 16px; font-size:12px; color:#666; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .nt-bc a { color:#666; text-decoration:none; }
        .nt-bc a:hover { text-decoration:underline; }

        .nt-body { padding:14px 10px 44px; }
        @media(min-width:600px)  { .nt-body { padding:18px 16px 44px; } }
        @media(min-width:1024px) { .nt-body { padding:20px 20px 44px; } }

        .nt-card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08); }

        .nt-hdr { background:linear-gradient(90deg,#26a69a,#1de9b6); padding:12px 16px;
                  display:flex; align-items:center; justify-content:space-between; }
        .nt-hdr-title { font-size:13px; font-weight:700; color:#fff; letter-spacing:.8px; text-transform:uppercase; }

        .nt-legend { display:flex; align-items:center; justify-content:center; gap:18px;
                     padding:12px 16px 10px; flex-wrap:wrap; border-bottom:1px solid #f0f0f0; }
        .nt-leg-item { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .nt-leg-lbl  { font-size:11px; color:#555; font-weight:500; }

        .nt-filter { padding:12px 14px 14px; }
        .nt-f-row  { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
        .nt-f-grp  { display:flex; flex-direction:column; gap:4px; flex:1; min-width:190px; }
        .nt-f-lbl  { font-size:12px; font-weight:600; color:#333; }
        .nt-f-in   { border:1.5px solid #d4d4d4; border-radius:6px; padding:8px 12px;
                     font-size:13px; font-family:'Poppins',sans-serif; color:#333; background:#fff;
                     outline:none; height:38px; width:100%; transition:border-color .18s,box-shadow .18s; }
        .nt-f-in::placeholder { color:#bbb; }
        .nt-f-in:focus { border-color:#26a69a; box-shadow:0 0 0 3px rgba(38,166,154,.12); }
        .nt-f-btn  { background:#1976d2; color:#fff; border:none; border-radius:6px;
                     padding:0 26px; height:38px; font-size:13px; font-weight:600;
                     font-family:'Poppins',sans-serif; cursor:pointer; white-space:nowrap;
                     transition:background .18s,box-shadow .18s,transform .12s;
                     display:flex; align-items:center; gap:8px; }
        .nt-f-btn:hover:not(:disabled) { background:#1565c0; box-shadow:0 4px 14px rgba(25,118,210,.28); transform:translateY(-1px); }
        .nt-f-btn:disabled { background:#b0bec5; cursor:not-allowed; transform:none; }
        .nt-err { color:#c62828; font-size:12px; margin-top:8px; padding:7px 12px;
                  background:#ffebee; border-radius:5px; border-left:3px solid #c62828; }

        .nt-tree-wrap { display:flex; flex-direction:column; border-top:1px solid #e8e8e8; }
        @media(min-width:768px) { .nt-tree-wrap { flex-direction:row; } }

        .nt-sidebar { width:100%; padding:12px 14px; border-bottom:1px solid #e8e8e8;
                      display:flex; align-items:center; gap:12px; }
        @media(min-width:768px) { .nt-sidebar { width:160px; flex-direction:column; align-items:center;
                                                padding:18px 12px; border-right:1px solid #e8e8e8;
                                                border-bottom:none; flex-shrink:0; } }
        @media(min-width:1024px) { .nt-sidebar { width:188px; padding:22px 14px; } }

        .nt-sb-av { width:58px; height:58px; border-radius:50%; background:#e3f2fd;
                    border:2.5px solid #90caf9; display:flex; align-items:center;
                    justify-content:center; flex-shrink:0; overflow:hidden; }
        @media(min-width:768px) { .nt-sb-av { width:68px; height:68px; margin-bottom:10px; } }

        .nt-sb-lbl { font-size:11px; font-weight:700; color:#1565c0; line-height:1.5; }
        .nt-sb-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
        .nt-sb-dot { width:10px; height:10px; border-radius:50%; background:#ff5722; flex-shrink:0; }
        .nt-sb-id  { font-size:12px; font-weight:600; color:#222; word-break:break-all; }

        .nt-canvas {
          flex:1;
          overflow: auto; /* Enable scrolling for the large tree */
          background: radial-gradient(circle at 50% 50%, #1a237e 0%, #010409 100%);
          min-height: 650px; /* Increased for the large mobile tree */
          position:relative;
          -webkit-overflow-scrolling: touch; /* Smooth mobile scroll */
        }
        @media(min-width:480px)  { .nt-canvas { min-height:520px; } }
        @media(min-width:768px)  { .nt-canvas { min-height:520px; } }
        @media(min-width:1024px) { .nt-canvas { min-height:600px; } }

        .nt-canvas-inner {
          padding:12px 12px 16px;
          width: fit-content; /* Allow inner container to grow with the tree */
          min-width: 100%;
        }
          
        @media(min-width:480px)  { .nt-canvas-inner { padding:16px 20px 24px; } }
        @media(min-width:600px)  { .nt-canvas-inner { padding:26px 28px 36px; } }
        @media(min-width:1024px) { .nt-canvas-inner { padding:32px 36px 44px; } }

        .nt-spin { display:inline-block; width:34px; height:34px;
                   border:4px solid rgba(255,255,255,.25); border-top-color:#fff;
                   border-radius:50%; animation:ntSpin .85s linear infinite; }

        .nt-overlay { position:fixed; inset:0; z-index:2100; background:transparent; }
      `}</style>

      <div className="nt-root" onClick={handleRootClick}>
        <Navbar dropdownOpen={ddOpen} setDropdownOpen={setDdOpen} setActivePage={() => { }} />

        <div className="nt-bc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#777">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <a href="/dashboard">Home</a>
          <span style={{ color: "#ccc" }}>/</span>
          <span>My Network</span>
          <span style={{ color: "#ccc" }}>/</span>
          <span style={{ color: "#26a69a", fontWeight: 600 }}>Network Tree</span>
        </div>

        <div className="nt-body">
          <div className="nt-card">
            <div className="nt-hdr">
              <span className="nt-hdr-title">Network Tree (Placement Tree)</span>
            </div>


            <div className="nt-filter">
              {loading ? <FilterSkeleton /> : (
                <div className="nt-f-row">
                  <div className="nt-f-grp">
                    <label className="nt-f-lbl">Username :</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="nt-f-in"
                        type="text"
                        placeholder="Enter Username"
                        value={memberId}
                        onChange={e => setMemberId(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchTree(memberId)}
                      />
                    </div>
                  </div>
                  <button className="nt-f-btn" onClick={() => { setHistory([]); fetchTree(memberId); }} disabled={loading}>
                    {loading ? "Loading…" : "Search"}
                  </button>
                </div>
              )}
              {error && <div className="nt-err">{error}</div>}
              {flushMsg && (
                <div style={{
                  marginTop: "8px",
                  padding: "10px 14px",
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "6px",
                  color: "#856404",
                  fontSize: "13px"
                }}>
                  ⚠️ {flushMsg}
                </div>
              )}
            </div>

            <div className="nt-tree-wrap">
              <div className="nt-sidebar">
                <div className="nt-sb-av">
                  {treeRoot ? (
                    <svg width="60" height="60" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                      {treeRoot.type === "booster" ? <AvatarBooster x={40} y={40} r={36} /> : <AvatarActive x={40} y={40} r={36} />}
                    </svg>
                  ) : (
                    <svg width="54" height="54" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="40" cy="40" r="40" fill="#e3f2fd" />
                      <ellipse cx="40" cy="28" rx="12" ry="13" fill="#f5cba7" />
                      <ellipse cx="40" cy="17" rx="14" ry="8" fill="#3d2b1f" />
                      <path d="M18 70 Q20 52 40 50 Q60 52 62 70 Z" fill="#c62828" />
                      <rect x="37" y="50" width="6" height="22" fill="#fff" />
                      <ellipse cx="40" cy="72" rx="22" ry="8" fill="#c62828" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="nt-sb-lbl">Tree Root<br />User</p>
                  <div className="nt-sb-row">
                    <div className="nt-sb-dot" style={{
                      background: treeRoot?.type === "booster" ? "#f9a825" : "#ff5722"
                    }} />
                    <span className="nt-sb-id">
                      {treeRoot ? treeRoot.id : (memberId || "—")}
                    </span>
                  </div>
                  {treeRoot && (
                    <div style={{ marginTop: "12px", width: "100%" }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#333",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "4px",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        Stats Summary
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <div style={{ background: "#f5f5f5", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: "#666", fontWeight: "600" }}>LEFT USER</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#1976d2" }}>{treeRoot.leftCount || 0}</div>
                        </div>
                        <div style={{ background: "#f5f5f5", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: "#666", fontWeight: "600" }}>RIGHT USER</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#d32f2f" }}>{treeRoot.rightCount || 0}</div>
                        </div>
                        <div style={{ background: "#fff8e1", padding: "6px", borderRadius: "6px", textAlign: "center", border: "1px solid #ffe082" }}>
                          <div style={{ fontSize: "9px", color: "#f57c00", fontWeight: "700" }}>L BOOSTER</div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#ff8f00" }}>{treeRoot.totalLeftBoosterUser || 0}</div>
                        </div>
                        <div style={{ background: "#fff8e1", padding: "6px", borderRadius: "6px", textAlign: "center", border: "1px solid #ffe082" }}>
                          <div style={{ fontSize: "9px", color: "#f57c00", fontWeight: "700" }}>R BOOSTER</div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#ff8f00" }}>{treeRoot.totalRightBoosterUser || 0}</div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: "10px",
                        padding: "6px 8px",
                        background: treeRoot.type === "booster" ? "#fff9c4" : "#e1f5fe",
                        borderRadius: "4px",
                        textAlign: "center",
                        fontSize: "10px",
                        fontWeight: "700",
                        color: treeRoot.type === "booster" ? "#f57f17" : "#0277bd"
                      }}>
                        Status: {treeRoot.type === "booster" ? "BOOSTER" : "ACTIVE"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="nt-canvas" ref={scrollRef} style={{ position: "relative" }}>
                {history.length > 0 && (
                  <button
                    onClick={handleGoBack}
                    style={{
                      position: "absolute",
                      top: "15px",
                      left: "15px",
                      zIndex: 100,
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#1565c0",
                      border: "1.5px solid #1565c0",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "10px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: "Poppins,sans-serif"
                    }}
                  >
                    ⬅️ BACK
                  </button>
                )}
                <div className="nt-canvas-inner">
                  {loading
                    ? <TreeSkeletonSVG />
                    : <TreeSVG
                        root={treeRoot}
                        onNodeClick={handleNodeClick}
                        maxd={dimensions.maxd}
                      />
                  }
                  <TreeLegend />
                </div>
              </div>
            </div>
          </div>
        </div>

        {popup && (
          <>
            <div 
              className="nt-overlay" 
              onClick={() => setPopup(null)} 
              style={{ position: 'fixed', inset: 0, zIndex: 2150, background: 'rgba(0,0,0,0.05)' }}
            />
            <MemberPopup
              state={popup}
              onClose={() => setPopup(null)}
              onExplore={handleExploreDownline}
            />
          </>
        )}
      </div>
    </>
  );
}