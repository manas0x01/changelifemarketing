"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

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
  awardRankStatus?: {
    rank: number;
    rankName: string;
    achievementDate?: string;
  };
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
  const py = ln.slot ? ln.y + BS / 2 : ln.y + AR + 105;
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
      <circle cx={x} cy={y} r={r + 8} fill="none" stroke="#ffe97c" strokeWidth="4" filter="url(#goldHalo)" opacity="0.9" />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#ffe97c" strokeWidth="3" />
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
  onExplore,
  onOpenCard,
  onSlotClick,
  maxd,
}: {
  root: MNode | null;
  onExplore: (userId: string) => void;
  onOpenCard: (node: MNode, e: React.MouseEvent) => void;
  onSlotClick: (node: MNode, e: React.MouseEvent) => void;
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
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d033a" />
          <stop offset="100%" stopColor="#110122" />
        </linearGradient>
        <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.45" />
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
              stroke="#ffe97c"
              strokeWidth="2.5"
              fill="none"
              opacity="0.8"
            />
            {/* Glowing intersection dot */}
            <circle cx={e.x1} cy={midY} r="4.5" fill="#ffe97c" filter="url(#goldHalo)" />
          </g>
        );
      })}

      {nodes.map((ln, i) => {
        const { node: n, x, y, slot, depth } = ln;

        if (slot) {
          const isOpen = n.type === "open";
          const col = isOpen ? "#00ff88" : "#ff4444";
          const cardW = 140;
          const cardH = 90;

          return (
            <g
              key={`n-${i}`}
              style={{ cursor: isOpen ? "pointer" : "default" }}
              onClick={e => {
                if (isOpen) { e.stopPropagation(); onSlotClick(n, e); }
              }}
            >
              {/* Dotted Slot Box */}
              <rect
                x={x - cardW / 2} y={y}
                width={cardW} height={cardH} rx="12"
                fill="rgba(0,0,0,0.3)" stroke={col} strokeWidth="2.5" strokeDasharray="6,4" opacity="0.85"
              />
              <circle cx={x} cy={y - 15} r="24" fill="none" stroke={col} strokeWidth="2" strokeDasharray="4,2" opacity="0.85" />
              <path d={`M${x - 8},${y - 22} a8,8 0 1,1 16,0 a8,8 0 1,1 -16,0 M${x - 14},${y - 6} q0,-10 14,-10 q14,0 14,10`} fill="none" stroke={col} strokeWidth="2" opacity="0.85" />

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

        // Dynamic name plate width based on name/id length
        const displayName = n.name || "—";
        const displayId = n.id || "—";
        const textLength = Math.max(displayName.length, displayId.length);
        const estimatedCardWidth = Math.max(160, textLength * 10 + 40);
        const cardH = 80;

        return (
          <g key={`n-${i}`}>
            {/* Person Icon - Explore Downline */}
            <g
              onClick={e => { e.stopPropagation(); onExplore(n.userId); }}
              style={{ cursor: "pointer" }}
            >
              {/* Outer Aura */}
              <circle cx={x} cy={y} r={AR + 18} fill={booster ? "rgba(255, 215, 0, 0.15)" : "rgba(168, 85, 247, 0.15)"} />
              {booster ? <AvatarBooster x={x} y={y} r={AR} /> : <AvatarActive x={x} y={y} r={AR} />}
            </g>

            {/* Name Plate (Card) - Open Info Card */}
            <g
              onClick={e => { e.stopPropagation(); onOpenCard(n, e); }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x - estimatedCardWidth / 2} y={cardTop}
                width={estimatedCardWidth} height={cardH} rx="12"
                fill="url(#cardBg)"
                stroke={booster ? "#ffe97c" : "rgba(255, 215, 0, 0.35)"}
                strokeWidth="2.5"
                filter="url(#nodeShadow)"
              />

              {/* Username (ID) - Gold and Bold */}
              <text
                x={x} y={cardTop + 30}
                textAnchor="middle" fontSize="20" fontWeight="900"
                fill="#ffe97c"
                fontFamily="Poppins,sans-serif"
                style={{ textShadow: "0 0 6px rgba(255, 215, 0, 0.4)" }}
              >
                {displayId}
              </text>

              <line
                x1={x - estimatedCardWidth / 2 + 20} y1={cardTop + cardH * 0.55}
                x2={x + estimatedCardWidth / 2 - 20} y2={cardTop + cardH * 0.55}
                stroke="rgba(255, 215, 0, 0.18)" strokeWidth="1.5"
              />

              {/* Name */}
              <text
                x={x} y={cardTop + 65}
                textAnchor="middle" fontSize="14" fontWeight="900"
                fill="#ffffff"
                fontFamily="Poppins,sans-serif"
              >
                {displayName.length > 25 ? displayName.slice(0, 25) + "…" : displayName}
              </text>
            </g>

            {/* Floating Status Badge */}
            <g transform={`translate(${x - 55}, ${cardTop - 18})`}>
              <rect width="110" height="26" rx="13" fill={booster ? "#ffe97c" : "rgba(255, 215, 0, 0.22)"} stroke="#ffe97c" strokeWidth="1" />
              <text x="55" y="17" textAnchor="middle" fontSize="10" fill={booster ? "#120228" : "#ffe97c"} fontWeight="900" letterSpacing="1">
                {booster ? "BOOSTER" : "ACTIVE"}
              </text>
            </g>

            {/* More Downline Indicator */}
            {depth === maxd && n.children && n.children.length > 0 && (
              <g transform={`translate(${x}, ${cardTop + cardH + 40})`}>
                <rect x="-80" y="-15" width="160" height="30" rx="15" fill="rgba(255, 215, 0, 0.15)" stroke="#ffe97c" strokeWidth="1.5" />
                <text textAnchor="middle" y="6" fontSize="12" fill="#ffe97c" fontWeight="900" fontFamily="Poppins,sans-serif" letterSpacing="0.8">
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
      border: "1.5px solid rgba(255, 215, 0, 0.25)",
      margin: "0 auto 30px auto",
      width: "fit-content",
      flexWrap: "wrap"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width="24" height="24" viewBox="0 0 40 40">
          <AvatarActive x={20} y={20} r={16} />
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#ffe97c", letterSpacing: "0.5px" }}>ACTIVE</div>
          <div style={{ fontSize: "9px", color: "rgba(255,233,124,0.7)", fontWeight: "500" }}>Active Member</div>
        </div>
      </div>


      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #00ff88", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88" }} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#00ff88", letterSpacing: "0.5px" }}>OPEN POSITION</div>
          <div style={{ fontSize: "9px", color: "rgba(255,233,124,0.7)", fontWeight: "500" }}>Available Slot</div>
        </div>
      </div>


      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width="24" height="24" viewBox="0 0 40 40">
          <AvatarBooster x={20} y={20} r={16} />
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#ffe97c", letterSpacing: "0.5px" }}>BOOSTER</div>
          <div style={{ fontSize: "9px", color: "rgba(255,233,124,0.7)", fontWeight: "500" }}>Upline / Sponsor</div>
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

    // Helper to format date (12-hour IST format for full timestamps, date-only for plain dates)
    const formatDate = (dateVal: any) => {
      if (!dateVal) return "—";

      // If it's a plain date string like "2026-06-20" (no time component), display as-is
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [y, m, d] = dateVal.split('-');
        return `${d}/${m}/${y}`;
      }

      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return String(dateVal);

      // Convert full timestamps to IST (UTC+5:30) and display in 12-hour format
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      const d = String(istDate.getUTCDate()).padStart(2, '0');
      const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const y = istDate.getUTCFullYear();
      const rawH = istDate.getUTCHours();
      const min = String(istDate.getUTCMinutes()).padStart(2, '0');
      const s = String(istDate.getUTCSeconds()).padStart(2, '0');
      const ampm = rawH >= 12 ? 'PM' : 'AM';
      const h12 = rawH % 12 === 0 ? 12 : rawH % 12;
      const h = String(h12).padStart(2, '0');

      return `${d}/${m}/${y} ${h}:${min}:${s} ${ampm}`;
    };

    const infoRows = [
      { label: "Rank Status", val: n.awardRankStatus?.rankName || "Member" },
      { label: "Sponsor ID", val: n.sponsorId || "—" },
      { label: "Joining Date", val: formatDate(n.joiningDate) },
      { label: "Package", val: n.package || "—" },
      { label: "Left ID", val: n.leftId || "—" },
      { label: "Right ID", val: n.rightId || "—" },
    ];

    const countBadges = [
      { label: "LEFT", val: n.totalDirect?.left ?? 0 },
      { label: "RIGHT", val: n.totalDirect?.right ?? 0 },
      { label: "TOTAL", val: (n.totalDirect?.left ?? 0) + (n.totalDirect?.right ?? 0) },
    ];

    const detailBadges = [
      { label: "ACT. DIR", val: (typeof n.totalActiveDirect === 'object' ? (n.totalActiveDirect.left + n.totalActiveDirect.right) : (n.totalActiveDirect ?? 0)) },
      { label: "L. BASIC", val: n.totalLeftBasicUser ?? 0 },
      { label: "R. BASIC", val: n.totalRightBasicUser ?? 0 },
      { label: "L. BOOST", val: n.totalLeftBoosterUser ?? 0 },
      { label: "R. BOOST", val: n.totalRightBoosterUser ?? 0 },
    ];

    return (
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: "fixed", left, top,
          zIndex: 2200, width: 308,
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15)",
          border: `2.5px solid ${booster ? "#ffe97c" : "rgba(255,233,124,0.4)"}`,
          fontFamily: "Poppins,sans-serif",
          animation: "ntPopIn .2s cubic-bezier(.16,1,.3,1)",
          maxWidth: "calc(100vw - 20px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          background: booster
            ? "linear-gradient(135deg, #ffe97c, #e65100)"
            : "linear-gradient(135deg, #1d033a, #110122)",
          padding: "11px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1.5px solid rgba(255,233,124,0.22)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>
              {booster ? "👑" : "👤"}
            </div>
            <div>
              <p style={{ color: booster ? "#120228" : "#ffe97c", fontWeight: 700, fontSize: 13, margin: 0 }}>{n.id}</p>
              <p style={{ color: booster ? "#120228" : "rgba(255,233,124,0.85)", fontSize: 10.5, margin: 0 }}>{n.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 7,
              color: booster ? "#120228" : "#ffe97c", cursor: "pointer", padding: "4px 9px", fontSize: 13, fontWeight: 700
            }}>
            ✕
          </button>
        </div>

        <div style={{ background: "linear-gradient(135deg, #1d033a, #110122)", padding: "12px 14px 14px" }}>
          {infoRows.map(row => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5.5px 0", borderBottom: "1px solid rgba(255,233,124,0.12)"
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,233,124,0.6)", fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 11.5, color: "#ffe97c", fontWeight: 600 }}>{row.val}</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
            {countBadges.map(b => (
              <div key={b.label} style={{
                flex: 1, textAlign: "center", padding: "8px 4px",
                borderRadius: 9, background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,233,124,0.22)"
              }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ffe97c", lineHeight: 1 }}>{b.val}</p>
                <p style={{ margin: "3px 0 0", fontSize: 8, fontWeight: 700, color: "#ffe97c", letterSpacing: 0.6 }}>{b.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
            {detailBadges.map(b => (
              <div key={b.label} style={{
                textAlign: "center", padding: "6px 2px",
                borderRadius: 8, background: "rgba(0,0,0,0.25)", border: "1.2px solid rgba(255,233,124,0.22)"
              }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ffe97c", lineHeight: 1 }}>{b.val}</p>
                <p style={{ margin: "2px 0 0", fontSize: 7, fontWeight: 700, color: "#ffe97c", letterSpacing: 0.4 }}>{b.label}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 15, display: "flex", gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); if (onExplore) onExplore(n.userId); }}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #ffe97c 0%, #f0a500 100%)",
                color: "#120228",
                border: "none",
                borderRadius: 8,
                padding: "10px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,233,124,0.2)",
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
    const [lastLeftId, setLastLeftId] = useState("");
    const [lastRightId, setLastRightId] = useState("");
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

    const treeCache = useRef<Record<string, { tree: MNode; lastLeftId: string; lastRightId: string; currentSession: any }>>({});

    const getCurrentSession = (): "morning" | "evening" => {
      const now = new Date();
      const istHour = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
      return istHour >= 0 && istHour < 12 ? "morning" : "evening";
    };

    const checkSessionChangeAndRefresh = () => {
      if (memberId && treeRoot) {
        fetchTree(memberId, undefined, undefined, true);
      }
    };

    const fetchTree = async (
      uid: string,
      selectedPosition?: "left" | "right",
      forceSessionType?: "morning" | "evening",
      isBackground: boolean = false
    ) => {
      const trimmed = uid.trim();
      if (!trimmed) { setError("Please enter a Username"); return; }
      
      setError(""); setPopup(null); setFlushMsg("");

      // Serve from cache immediately for instant open/navigation
      const cached = treeCache.current[trimmed];
      if (cached) {
        setTreeRoot(cached.tree);
        setLastLeftId(cached.lastLeftId);
        setLastRightId(cached.lastRightId);
        if (cached.currentSession) setCurrentSession(cached.currentSession);
        setLoading(false);
      } else if (!isBackground && !treeRoot) {
        setLoading(true);
      }

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
          setTreeRoot(data.tree);
          setLastLeftId(data.lastLeftId || "");
          setLastRightId(data.lastRightId || "");
          const sess = data.currentSessionType || getCurrentSession();
          setCurrentSession(sess);
          lastSessionRef.current = sess;

          // Save to memory cache for instant future loads
          treeCache.current[trimmed] = {
            tree: data.tree,
            lastLeftId: data.lastLeftId || "",
            lastRightId: data.lastRightId || "",
            currentSession: sess,
          };

          if (data.flushMessage) {
            setFlushMsg(data.flushMessage);
            setTimeout(() => setFlushMsg(""), 5000);
          }
        } else {
          if (!cached) {
            setError(data.error || "Failed to load placement tree");
            setTreeRoot(null);
            setLastLeftId("");
            setLastRightId("");
          }
        }
      } catch (e) {
        if (!cached) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setTreeRoot(null);
          setLastLeftId("");
          setLastRightId("");
        }
      } finally {
        setLoading(false);
      }
    };

    // Restore last viewed member and refresh on mount
    useEffect(() => {
      const lastViewed = sessionStorage.getItem('networkTreeLastViewed');
      if (lastViewed) {
        setMemberId(lastViewed);
        fetchTree(lastViewed);
        sessionStorage.removeItem('networkTreeLastViewed');
      } else if (session?.user?.username && !autoLoaded) {
        setAutoLoaded(true);
        setMemberId(session.user.username);
        fetchTree(session.user.username);
      }

      lastSessionRef.current = getCurrentSession();

      sessionCheckRef.current = setInterval(() => {
        checkSessionChangeAndRefresh();
      }, 60000);

      return () => {
        if (sessionCheckRef.current) {
          clearInterval(sessionCheckRef.current);
          sessionCheckRef.current = null;
        }
      };
    }, [session?.user?.username]);

    // Refresh tree silently when page becomes visible (after registration)
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && memberId && treeRoot) {
          fetchTree(memberId, undefined, undefined, true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [memberId, treeRoot]);

    const handleSlotClick = (n: MNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (n.type === "open") {
        const parentId = n.id.replace(/^v[lr]-/, "");
        const pos = n.position === "left" ? "Left" : "Right";
        sessionStorage.setItem('networkTreeLastViewed', memberId);
        router.push(`/dashboard/registration?sponsorId=${session?.user?.username || ""}&uplineId=${parentId}&position=${pos}`);
      }
    };

    /* ── Card opening logic (triggered by click) ── */
    const fetchIdRef = useRef<string | null>(null);

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

      // Render instant popup immediately with node basic data
      setPopup({
        node: n,
        left: lft,
        top,
        isPersistent: true
      });

      const fetchMemberCard = async () => {
        try {
          const res = await fetch("/api/user/member-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: n.userId }),
          });
          const data = await res.json();

          if (fetchIdRef.current === currentFetchId && data.success && data.card) {
            const card = data.card;
            setPopup(prev => prev ? {
              ...prev,
              node: {
                ...prev.node,
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
              }
            } : null);
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
      handleOpenCard(n, e);
    };

    const handleExploreDownline = (userId: string) => {
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

        .nt-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          min-height: 100vh;
        }

        .nt-bc { padding:10px 16px; font-size:12px; color:#ffe97c; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .nt-bc a { color:#ffe97c; text-decoration:none; opacity:0.85; }
        .nt-bc a:hover { text-decoration:underline; opacity:1; }

        .nt-body { padding:14px 10px 44px; }
        @media(min-width:600px)  { .nt-body { padding:18px 16px 44px; } }
        @media(min-width:1024px) { .nt-body { padding:20px 20px 44px; } }

        .nt-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        .nt-hdr {
          background: linear-gradient(90deg, rgba(255,233,124,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,233,124,0.25);
          padding:12px 16px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .nt-hdr-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffe97c;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,233,124,0.45);
        }

        .nt-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 12px 16px 10px;
          flex-wrap: wrap;
          border-bottom: 1px solid rgba(255,233,124,0.12);
          background: rgba(0,0,0,0.2);
        }
        .nt-leg-item { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .nt-leg-lbl  { font-size:11px; color:#ffe97c; font-weight:500; }

        .nt-filter { padding:12px 14px 14px; border-bottom: 1.5px solid rgba(255,233,124,0.22); }
        .nt-f-row  { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
        .nt-f-grp  { display:flex; flex-direction:column; gap:4px; flex:1; min-width:190px; }
        .nt-f-lbl  { font-size:12px; font-weight:600; color:#ffe97c; }
        .nt-f-in   {
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #ffe97c;
          background: rgba(0,0,0,0.25);
          outline: none; height: 38px; width: 100%;
          transition: border-color .18s, box-shadow .18s;
        }
        .nt-f-in::placeholder { color: rgba(255,233,124,0.4); }
        .nt-f-in:focus {
          border-color: #ffe97c;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,233,124,0.15);
        }
        .nt-f-btn  {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color: #120228;
          border: none;
          border-radius: 6px;
          padding: 0 26px;
          height: 38px;
          font-size: 13px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background .18s, box-shadow .18s, transform .12s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(255,233,124,0.25);
        }
        .nt-f-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,233,124,0.35); }
        .nt-f-btn:disabled {
          background: rgba(255,233,124,0.2) !important;
          color: rgba(255,233,124,0.4) !important;
          border: 1px solid rgba(255,233,124,0.15) !important;
          box-shadow: none !important;
          cursor: not-allowed;
          transform: none;
        }
        .nt-err {
          color: #ffe97c;
          font-size: 12px;
          margin-top: 8px;
          padding: 7px 12px;
          background: rgba(255, 23, 23, 0.15);
          border-radius: 5px;
          border-left: 3px solid #ff4444;
        }

        .nt-tree-wrap { display:flex; flex-direction:column; border-top:1px solid rgba(255,233,124,0.22); }
        @media(min-width:768px) { .nt-tree-wrap { flex-direction:row; } }

        .nt-sidebar {
          width: 100%;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,233,124,0.22);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0,0,0,0.15);
        }
        @media(min-width:768px) {
          .nt-sidebar {
            width: 170px;
            flex-direction: column;
            align-items: center;
            padding: 18px 12px;
            border-right: 1px solid rgba(255,233,124,0.22);
            border-bottom: none;
            flex-shrink: 0;
          }
        }
        @media(min-width:1024px) { .nt-sidebar { width: 198px; padding: 22px 14px; } }

        .nt-sb-av {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(255,233,124,0.1);
          border: 2.5px solid rgba(255,233,124,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        @media(min-width:768px) { .nt-sb-av { width: 68px; height: 68px; margin-bottom: 10px; } }

        .nt-sb-lbl { font-size: 11px; font-weight: 700; color: #ffe97c; line-height: 1.5; text-shadow: 0 0 4px rgba(255,233,124,0.25); }
        .nt-sb-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .nt-sb-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff5722; flex-shrink: 0; }
        .nt-sb-id  { font-size: 12px; font-weight: 600; color: #ffe97c; word-break: break-all; }

        .nt-canvas {
          flex:1;
          overflow: auto; /* Enable scrolling for the large tree */
          background: radial-gradient(circle at 50% 50%, #1a0533 0%, #080112 100%);
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
                   border:4px solid rgba(255,233,124,.25); border-top-color:#ffe97c;
                   border-radius:50%; animation:ntSpin .85s linear infinite; }

        .nt-overlay { position:fixed; inset:0; z-index:2100; background:transparent; }
      `}</style>

        <div className="nt-root" onClick={handleRootClick}>
          <Navbar dropdownOpen={ddOpen} setDropdownOpen={setDdOpen} setActivePage={() => { }} />

          <div className="nt-bc">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffe97c">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <a href="/dashboard">Home</a>
            <span style={{ color: "rgba(255, 215, 0, 0.4)" }}>/</span>
            <span>My Network</span>
            <span style={{ color: "rgba(255, 215, 0, 0.4)" }}>/</span>
            <span style={{ color: "#ffe97c", fontWeight: 700 }}>Network Tree</span>
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
                {treeRoot && (lastLeftId || lastRightId) && (
                  <div style={{
                    marginTop: "20px",
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(29, 3, 58, 0.5) 0%, rgba(17, 1, 34, 0.5) 100%)",
                    backdropFilter: "blur(16px)",
                    borderRadius: "14px",
                    border: "1.5px solid rgba(255, 233, 124, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#ffe97c",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textShadow: "0 0 8px rgba(255, 233, 124, 0.3)"
                    }}>
                      <span style={{ fontSize: "16px" }}>⛓️</span> Downline Endpoints Reference
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "16px"
                    }}>
                      {/* Left Downline Reference */}
                      <div style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1.2px solid rgba(255, 233, 124, 0.12)",
                        borderRadius: "10px",
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease-in-out"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "10px", color: "rgba(255, 233, 124, 0.6)", fontWeight: "700", letterSpacing: "0.8px" }}>
                            LEFT EXTREME DOWNLINE
                          </span>
                          <span style={{ fontSize: "15px", color: "#ffffff", fontWeight: "800", fontFamily: "monospace" }}>
                            {lastLeftId || "—"}
                          </span>
                        </div>
                        {lastLeftId && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lastLeftId);
                              toast.success(`Copied Left Downline ID: ${lastLeftId}`);
                            }}
                            title="Copy ID"
                            style={{
                              background: "rgba(255, 233, 124, 0.08)",
                              color: "#ffe97c",
                              border: "1.2px solid rgba(255, 233, 124, 0.25)",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                              fontFamily: "Poppins, sans-serif"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "rgba(255, 233, 124, 0.18)";
                              e.currentTarget.style.borderColor = "rgba(255, 233, 124, 0.5)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "rgba(255, 233, 124, 0.08)";
                              e.currentTarget.style.borderColor = "rgba(255, 233, 124, 0.25)";
                            }}
                          >
                            📋 Copy ID
                          </button>
                        )}
                      </div>

                      {/* Right Downline Reference */}
                      <div style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1.2px solid rgba(255, 233, 124, 0.12)",
                        borderRadius: "10px",
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease-in-out"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "10px", color: "rgba(255, 233, 124, 0.6)", fontWeight: "700", letterSpacing: "0.8px" }}>
                            RIGHT EXTREME DOWNLINE
                          </span>
                          <span style={{ fontSize: "15px", color: "#ffffff", fontWeight: "800", fontFamily: "monospace" }}>
                            {lastRightId || "—"}
                          </span>
                        </div>
                        {lastRightId && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lastRightId);
                              toast.success(`Copied Right Downline ID: ${lastRightId}`);
                            }}
                            title="Copy ID"
                            style={{
                              background: "rgba(255, 233, 124, 0.08)",
                              color: "#ffe97c",
                              border: "1.2px solid rgba(255, 233, 124, 0.25)",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                              fontFamily: "Poppins, sans-serif"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "rgba(255, 233, 124, 0.18)";
                              e.currentTarget.style.borderColor = "rgba(255, 233, 124, 0.5)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "rgba(255, 233, 124, 0.08)";
                              e.currentTarget.style.borderColor = "rgba(255, 233, 124, 0.25)";
                            }}
                          >
                            📋 Copy ID
                          </button>
                        )}
                      </div>
                    </div>
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
                          color: "#ffe97c",
                          borderBottom: "1px solid rgba(255, 215, 0, 0.22)",
                          paddingBottom: "4px",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          Stats Summary
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          <div style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,233,124,0.22)", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                            <div style={{ fontSize: "9px", color: "rgba(255, 215, 0, 0.6)", fontWeight: "600" }}>LEFT USER</div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffe97c" }}>{treeRoot.leftCount || 0}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,233,124,0.22)", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                            <div style={{ fontSize: "9px", color: "rgba(255, 215, 0, 0.6)", fontWeight: "600" }}>RIGHT USER</div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffe97c" }}>{treeRoot.rightCount || 0}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,233,124,0.22)", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                            <div style={{ fontSize: "9px", color: "#ffe97c", fontWeight: "700" }}>L BOOSTER</div>
                            <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffe97c" }}>{treeRoot.totalLeftBoosterUser || 0}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,233,124,0.22)", padding: "6px", borderRadius: "6px", textAlign: "center" }}>
                            <div style={{ fontSize: "9px", color: "#ffe97c", fontWeight: "700" }}>R BOOSTER</div>
                            <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffe97c" }}>{treeRoot.totalRightBoosterUser || 0}</div>
                          </div>
                        </div>

                        <div style={{
                          marginTop: "10px",
                          padding: "6px 8px",
                          background: "rgba(255, 215, 0, 0.15)",
                          border: "1.5px solid rgba(255, 215, 0, 0.3)",
                          borderRadius: "4px",
                          textAlign: "center",
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "#ffe97c"
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
                        background: "rgba(29, 3, 58, 0.85)",
                        backdropFilter: "blur(8px)",
                        color: "#ffe97c",
                        border: "1.5px solid rgba(255,233,124,0.3)",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "10.5px",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: "Poppins,sans-serif",
                        transition: "all 0.18s"
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
                        onExplore={handleExploreDownline}
                        onOpenCard={handleOpenCard}
                        onSlotClick={handleSlotClick}
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