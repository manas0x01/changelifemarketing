"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

interface TreeNode {
  id: string;
  name: string;
  type: "gold" | "active";
  children?: TreeNode[];
}

const defaultTree: TreeNode = {
  id: "Sm674643", name: "ajay kumar", type: "active",
  children: [
    {
      id: "SM138501", name: "HARISH CHANDRA KUMAR", type: "active",
      children: [
        { id: "SM491066", name: "KALEEM AKHTAR",       type: "active", children: [] },
        { id: "SM873277", name: "HARISH CHANDRA KUMAR",type: "gold",   children: [] },
      ]
    },
    {
      id: "SM649260", name: "MUNNA KUMAR", type: "active",
      children: [
        { id: "SM408648", name: "SURAJ KUMAR",  type: "active", children: [] },
        { id: "SM943014", name: "VIKASH KUMAR", type: "active", children: [] },
      ]
    },
  ]
};

const ActiveAvatar = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#fff"/>
    {/* Head */}
    <ellipse cx="40" cy="28" rx="13" ry="14" fill="#f5cba7"/>
    {/* Hair */}
    <ellipse cx="40" cy="17" rx="13" ry="7" fill="#3d2b1f"/>
    <ellipse cx="28" cy="22" rx="5" ry="7" fill="#3d2b1f"/>
    <ellipse cx="52" cy="22" rx="5" ry="7" fill="#3d2b1f"/>
    {/* Hat brim */}
    <rect x="24" y="14" width="32" height="5" rx="2" fill="#222"/>
    <rect x="28" y="10" width="24" height="8" rx="3" fill="#333"/>
    {/* Body - blue shirt */}
    <path d="M20 65 Q22 50 40 48 Q58 50 60 65 Z" fill="#2196f3"/>
    {/* Laptop */}
    <rect x="26" y="52" width="28" height="18" rx="3" fill="#cfd8dc"/>
    <rect x="28" y="54" width="24" height="13" rx="2" fill="#90caf9"/>
    <rect x="22" y="70" width="36" height="4" rx="2" fill="#b0bec5"/>
    {/* Arms */}
    <path d="M20 58 Q14 62 18 70" stroke="#2196f3" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <path d="M60 58 Q66 62 62 70" stroke="#2196f3" strokeWidth="7" strokeLinecap="round" fill="none"/>
    {/* Hands */}
    <ellipse cx="19" cy="71" rx="5" ry="4" fill="#f5cba7"/>
    <ellipse cx="61" cy="71" rx="5" ry="4" fill="#f5cba7"/>
  </svg>
);

const GoldAvatar = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#fff"/>
    <ellipse cx="40" cy="28" rx="13" ry="14" fill="#f5cba7"/>
    <ellipse cx="40" cy="17" rx="13" ry="7" fill="#3d2b1f"/>
    <ellipse cx="28" cy="22" rx="5" ry="7" fill="#3d2b1f"/>
    <ellipse cx="52" cy="22" rx="5" ry="7" fill="#3d2b1f"/>
    <rect x="24" y="14" width="32" height="5" rx="2" fill="#222"/>
    <rect x="28" y="10" width="24" height="8" rx="3" fill="#333"/>
    {/* Body - yellow/gold shirt */}
    <path d="M20 65 Q22 50 40 48 Q58 50 60 65 Z" fill="#ffc107"/>
    <rect x="26" y="52" width="28" height="18" rx="3" fill="#cfd8dc"/>
    <rect x="28" y="54" width="24" height="13" rx="2" fill="#90caf9"/>
    <rect x="22" y="70" width="36" height="4" rx="2" fill="#b0bec5"/>
    <path d="M20 58 Q14 62 18 70" stroke="#ffc107" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <path d="M60 58 Q66 62 62 70" stroke="#ffc107" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <ellipse cx="19" cy="71" rx="5" ry="4" fill="#f5cba7"/>
    <ellipse cx="61" cy="71" rx="5" ry="4" fill="#f5cba7"/>
  </svg>
);

const NODE_W   = 140;
const NODE_H   = 44;
const H_GAP    = 40;
const V_GAP    = 100;
const AVATAR_R = 34;

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function measureWidth(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return NODE_W;
  const childWidths = node.children.map(measureWidth);
  const totalChildren = childWidths.reduce((a, b) => a + b, 0) + H_GAP * (node.children.length - 1);
  return Math.max(NODE_W, totalChildren);
}

function layoutTree(node: TreeNode, x: number, y: number): LayoutNode {
  const width = measureWidth(node);
  const layout: LayoutNode = { node, x, y, children: [] };
  if (node.children && node.children.length > 0) {
    const childWidths = node.children.map(measureWidth);
    const total = childWidths.reduce((a, b) => a + b, 0) + H_GAP * (node.children.length - 1);
    let cx = x - total / 2;
    for (let i = 0; i < node.children.length; i++) {
      const cw = childWidths[i];
      layout.children.push(layoutTree(node.children[i], cx + cw / 2, y + V_GAP + AVATAR_R * 2 + 20));
      cx += cw + H_GAP;
    }
  }
  return layout;
}

function getMaxDepth(node: TreeNode, depth = 0): number {
  if (!node.children || node.children.length === 0) return depth;
  return Math.max(...node.children.map(c => getMaxDepth(c, depth + 1)));
}

function collectNodes(layout: LayoutNode, out: LayoutNode[] = []) {
  out.push(layout);
  layout.children.forEach(c => collectNodes(c, out));
  return out;
}

function collectEdges(layout: LayoutNode, out: { x1: number; y1: number; x2: number; y2: number }[] = []) {
  layout.children.forEach(c => {
    out.push({ x1: layout.x, y1: layout.y + AVATAR_R + NODE_H / 2 + 4, x2: c.x, y2: c.y - AVATAR_R });
    collectEdges(c, out);
  });
  return out;
}

function TreeSVG({ root }: { root: TreeNode }) {
  const treeWidth  = measureWidth(root);
  const depth      = getMaxDepth(root);
  const cx         = Math.max(treeWidth / 2 + 60, 500);
  const svgW       = cx * 2;
  const svgH       = depth * (V_GAP + AVATAR_R * 2 + 30) + 220;
  const layout     = layoutTree(root, cx, 80);
  const allNodes   = collectNodes(layout);
  const allEdges   = collectEdges(layout);

  return (
    <svg width={svgW} height={svgH} xmlns="http://www.w3.org/2000/svg" style={{ minWidth: svgW }}>
      {/* Edges */}
      {allEdges.map((e, i) => {
        const midY = (e.y1 + e.y2) / 2;
        return (
          <path
            key={i}
            d={`M ${e.x1} ${e.y1} L ${e.x1} ${midY} L ${e.x2} ${midY} L ${e.x2} ${e.y2}`}
            stroke="#bbb" strokeWidth="2" fill="none"
          />
        );
      })}

      {/* Nodes */}
      {allNodes.map((ln) => {
        const { node, x, y } = ln;
        const isGold = node.type === "gold";
        return (
          <g key={node.id}>
            {/* Avatar circle */}
            <circle cx={x} cy={y} r={AVATAR_R} fill="#fff" stroke={isGold ? "#ffc107" : "#2196f3"} strokeWidth="2.5"/>
            <foreignObject x={x - AVATAR_R} y={y - AVATAR_R} width={AVATAR_R * 2} height={AVATAR_R * 2}>
              <div style={{ width: AVATAR_R * 2, height: AVATAR_R * 2, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isGold
                  ? <GoldAvatar   size={AVATAR_R * 2} />
                  : <ActiveAvatar size={AVATAR_R * 2} />
                }
              </div>
            </foreignObject>

            {/* Label box */}
            <rect
              x={x - NODE_W / 2} y={y + AVATAR_R + 4}
              width={NODE_W} height={NODE_H}
              rx="6" fill="#fff" stroke="#d0d0d0" strokeWidth="1.2"
            />
            <text x={x} y={y + AVATAR_R + 20} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1976d2" fontFamily="Poppins,sans-serif">
              {node.id}
            </text>
            <text x={x} y={y + AVATAR_R + 36} textAnchor="middle" fontSize="10.5" fill="#333" fontFamily="Poppins,sans-serif">
              {node.name.length > 18 ? node.name.substring(0, 18) + "…" : node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MotherTreePage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [memberId,     setMemberId]     = useState("");
  const [treeRoot,     setTreeRoot]     = useState<TreeNode>(defaultTree);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFilter = () => {
    // In real app: fetch tree by memberId. Here we just reset to default.
    setTreeRoot({ ...defaultTree });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .mt-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        /* BREADCRUMB */
        .breadcrumb { 
          padding:12px 16px; 
          font-size:13px; 
          color:#555; 
          display:flex; 
          align-items:center; 
          gap:6px;
          overflow-x:auto;
          white-space:nowrap;
        }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        /* PAGE BODY */
        .page-body { 
          padding:16px 12px 40px;
        }
        @media (min-width: 640px) {
          .page-body { padding:20px 16px 40px; }
        }
        @media (min-width: 1024px) {
          .page-body { padding:20px 20px 40px; }
        }

        /* MAIN CARD */
        .main-card { 
          background:#fff; 
          border-radius:8px; 
          overflow:hidden; 
          box-shadow:0 2px 10px rgba(0,0,0,0.07); 
        }
        @media (min-width: 640px) {
          .main-card { border-radius:10px; }
        }

        /* HEADER */
        .section-header {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          padding:12px 14px;
          display:flex; 
          align-items:center; 
          justify-content:space-between;
        }
        @media (min-width: 640px) {
          .section-header { padding:12px 16px; }
        }

        .section-title { 
          font-size:12px; 
          font-weight:700; 
          color:#fff; 
          letter-spacing:0.8px; 
          text-transform:uppercase; 
        }
        @media (min-width: 640px) {
          .section-title { font-size:13px; }
        }

        /* LEGEND */
        .legend-row {
          display:grid;
          grid-template-columns: repeat(2, 1fr);
          gap:12px;
          padding:14px 12px;
          justify-items:center;
        }
        @media (min-width: 640px) {
          .legend-row {
            display:flex;
            grid-template-columns: unset;
            align-items:flex-end;
            justify-content:center;
            gap:30px;
            padding:18px 20px 10px;
            flex-wrap:wrap;
          }
        }

        .legend-item { 
          display:flex; 
          flex-direction:column; 
          align-items:center; 
          gap:4px; 
        }
        .legend-label { 
          font-size:11px; 
          color:#333; 
          font-weight:500;
          text-align:center;
        }
        @media (min-width: 640px) {
          .legend-label { font-size:12.5px; }
        }

        /* FILTER AREA */
        .filter-area { 
          padding:12px 12px 14px;
        }
        @media (min-width: 640px) {
          .filter-area { padding:10px 20px 18px; }
        }

        .filter-inner { 
          display:flex; 
          align-items:flex-end; 
          gap:8px; 
          flex-wrap:wrap; 
        }
        @media (min-width: 640px) {
          .filter-inner { gap:12px; }
        }

        .filter-group { 
          display:flex; 
          flex-direction:column; 
          gap:4px;
          flex:1;
          min-width:200px;
        }
        @media (min-width: 640px) {
          .filter-group { 
            gap:5px;
            flex:0 1 auto;
            min-width:220px;
          }
        }

        .filter-label { 
          font-size:11px; 
          font-weight:600; 
          color:#444;
        }
        @media (min-width: 640px) {
          .filter-label { font-size:12.5px; font-weight:500; }
        }

        .filter-input {
          border:1px solid #d0d0d0; 
          border-radius:4px;
          padding:8px 10px; 
          font-size:12px;
          font-family:'Poppins',sans-serif; 
          color:#333;
          background:#fff; 
          outline:none; 
          height:36px;
          width:100%;
          transition:border-color .18s;
        }
        @media (min-width: 640px) {
          .filter-input {
            border-radius:5px;
            padding:9px 13px;
            font-size:13px;
            height:40px;
            width:auto;
          }
        }

        .filter-input::placeholder { color:#aaa; }
        .filter-input:focus { 
          border-color:#26a69a; 
          box-shadow:0 0 0 2px rgba(38,166,154,0.1); 
        }

        .filter-btn {
          background:#1976d2; 
          color:#fff; 
          border:none; 
          border-radius:4px;
          padding:0 16px; 
          height:36px; 
          font-size:12px; 
          font-weight:600;
          font-family:'Poppins',sans-serif; 
          cursor:pointer;
          white-space:nowrap;
          transition:background .18s, transform .15s;
        }
        @media (min-width: 640px) {
          .filter-btn {
            border-radius:6px;
            padding:0 28px;
            height:40px;
            font-size:14px;
          }
        }

        .filter-btn:hover { 
          background:#1565c0; 
          transform:translateY(-1px); 
        }

        /* LEFT PANEL + TREE PANEL */
        .tree-layout {
          display:flex; 
          flex-direction:column;
          gap:0;
          border-top:1px solid #e0e0e0;
        }
        @media (min-width: 768px) {
          .tree-layout {
            flex-direction:row;
          }
        }

        /* Left sidebar */
        .tree-sidebar {
          width:100%;
          padding:14px 12px;
          border-right:none;
          border-bottom:1px solid #e0e0e0;
          display:flex;
          align-items:center;
          gap:12px;
        }
        @media (min-width: 768px) {
          .tree-sidebar {
            width:160px;
            flex-direction:column;
            padding:16px 14px;
            border-right:1px solid #e0e0e0;
            border-bottom:none;
            flex-shrink:0;
          }
        }
        @media (min-width: 1024px) {
          .tree-sidebar {
            width:200px;
            padding:20px 16px;
          }
        }

        .sidebar-avatar-wrap {
          width:56px; 
          height:56px; 
          border-radius:50%;
          background:#e0e0e0; 
          overflow:hidden;
          display:flex; 
          align-items:center; 
          justify-content:center;
          flex-shrink:0;
        }
        @media (min-width: 768px) {
          .sidebar-avatar-wrap {
            width:60px;
            height:60px;
            margin-bottom:10px;
          }
        }
        @media (min-width: 1024px) {
          .sidebar-avatar-wrap {
            width:70px;
            height:70px;
            margin-bottom:14px;
          }
        }

        .searched-label { 
          font-size:11px; 
          font-weight:700; 
          color:#1976d2;
          margin-bottom:0;
        }
        @media (min-width: 768px) {
          .searched-label { 
            font-size:12px;
            margin-bottom:4px;
          }
        }

        .team-row { 
          display:flex; 
          align-items:center; 
          gap:6px; 
        }
        @media (min-width: 768px) {
          .team-row { margin-top:6px; }
        }
        @media (min-width: 1024px) {
          .team-row { margin-top:8px; }
        }

        .team-dot { 
          width:10px; 
          height:10px; 
          border-radius:50%; 
          background:#ff5722; 
          flex-shrink:0; 
        }
        @media (min-width: 768px) {
          .team-dot { width:12px; height:12px; }
        }

        .team-id  { 
          font-size:12px; 
          color:#333; 
          font-weight:500; 
        }
        @media (min-width: 768px) {
          .team-id { font-size:13px; }
        }

        /* Tree canvas */
        .tree-canvas-wrap {
          flex:1; 
          overflow:auto; 
          position:relative;
          background:#1a6bb5;
          min-height:320px;
          scrollbar-width:thin;
          scrollbar-color:#e6a817 #1565c0;
        }
        @media (min-width: 768px) {
          .tree-canvas-wrap {
            min-height:420px;
          }
        }
        @media (min-width: 1024px) {
          .tree-canvas-wrap {
            min-height:520px;
          }
        }

        .tree-canvas-wrap::-webkit-scrollbar { 
          width:8px; 
          height:8px; 
        }
        @media (min-width: 768px) {
          .tree-canvas-wrap::-webkit-scrollbar {
            width:10px;
            height:10px;
          }
        }

        .tree-canvas-wrap::-webkit-scrollbar-track { background:#1565c0; }
        .tree-canvas-wrap::-webkit-scrollbar-thumb { 
          background:#e6a817; 
          border-radius:4px; 
        }

        .tree-canvas-inner {
          padding:20px 24px 30px;
          display:inline-block;
          min-width:100%;
        }
        @media (min-width: 640px) {
          .tree-canvas-inner {
            padding:25px 30px 35px;
          }
        }
        @media (min-width: 1024px) {
          .tree-canvas-inner {
            padding:30px 40px 40px;
          }
        }
      `}</style>

      <div className="mt-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">My Network</span>
          <span className="sep">/</span>
          <span>Mother Tree</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Mother Tree</span>
            </div>

            {/* LEGEND ROW */}
            <div className="legend-row">
              <div className="legend-item">
                <ActiveAvatar size={40} />
                <span className="legend-label">Active ID</span>
              </div>
              <div className="legend-item">
                <GoldAvatar size={40} />
                <span className="legend-label">Gold ID</span>
              </div>
              <div className="legend-item">
                <div className="legend-box-red" />
                <span className="legend-label">Close for<br/>Joining</span>
              </div>
              <div className="legend-item">
                <div className="legend-box-green" />
                <span className="legend-label">Open for<br/>Joining</span>
              </div>
            </div>

            {/* FILTER AREA */}
            <div className="filter-area">
              <div className="filter-inner">
                <div className="filter-group">
                  <label className="filter-label">Member ID :</label>
                  <input
                    className="filter-input"
                    type="text"
                    placeholder="Enter Member ID"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  />
                </div>
                <button className="filter-btn" onClick={handleFilter}>Filter</button>
              </div>
            </div>

            {/* TREE LAYOUT: sidebar + canvas */}
            <div className="tree-layout">

              {/* LEFT SIDEBAR */}
              <div className="tree-sidebar">
                <div className="sidebar-avatar-wrap">
                  {/* Business person avatar */}
                  <svg width="56" height="56" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="#e0e0e0"/>
                    <ellipse cx="40" cy="28" rx="13" ry="14" fill="#f5cba7"/>
                    <ellipse cx="40" cy="17" rx="14" ry="8" fill="#555"/>
                    <path d="M20 65 Q22 50 40 48 Q58 50 60 65 Z" fill="#c62828"/>
                    <rect x="37" y="48" width="6" height="20" fill="#fff"/>
                    <ellipse cx="40" cy="72" rx="18" ry="8" fill="#c62828"/>
                  </svg>
                </div>
                <div>
                  <p className="searched-label">Searched<br/>Team</p>
                  <div className="team-row" style={{ marginTop: 4 }}>
                    <div className="team-dot" />
                    <span className="team-id">{memberId || "Sm674643"}</span>
                  </div>
                </div>
              </div>

              {/* TREE CANVAS */}
              <div className="tree-canvas-wrap" ref={scrollRef}>
                <div className="tree-canvas-inner">
                  <TreeSVG root={treeRoot} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}