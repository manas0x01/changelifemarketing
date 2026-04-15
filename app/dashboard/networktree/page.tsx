"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const AR   = 26; 
const NW   = 130;  
const NH   = 44; 
const BS   = 44; 
const SW   = 72; 
const HG   = 120;
const VS   = 158; 
const MAXD = 1.5;  

type NodeType = "active" | "booster" | "open" | "close";

interface MNode {
  id          : string;
  name        : string;
  userId      : string;
  type        : NodeType;
  position   ?: "left" | "right";
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
  slot  : boolean;
}

interface PopupState {
  node : MNode;
  left : number;
  top  : number;
}

const isSlot = (n: MNode) => n.type === "open" || n.type === "close";

function treeW(node: MNode | null, depth: number): number {
  if (!node || node.type === "close") return SW;

  if (isSlot(node)) {
    return depth < MAXD ? SW + HG + SW : SW;
  }
  if (depth >= MAXD) return NW;

  const ch = node.children ?? [];
  const L  = ch.find(c => c.position === "left")  ?? null;
  const R  = ch.find(c => c.position === "right") ?? null;
  const virtOpen: MNode = { id:"v", name:"open", userId:"", type:"open", position:"left" };
  const lw = L ? treeW(L, depth + 1) : treeW(virtOpen, depth + 1);
  const rw = R ? treeW(R, depth + 1) : treeW(virtOpen, depth + 1);
  return Math.max(NW, lw + HG + rw);
}

/* ═══════════════════════════════════════════════════════
   LAYOUT BUILDER
   Rule:
   • Real member  → empty children are "open"
   • Open slot    → its children are "close"
   • Close slot   → LEAF, no children rendered
═══════════════════════════════════════════════════════ */
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

  if (depth > MAXD) return ln;

  if (node.type === "close") return ln;

  if (isSlot(node) && node.userId) return ln;

  const ch = node.children ?? [];
  const L  = ch.find(c => c.position === "left")  ?? null;
  const R  = ch.find(c => c.position === "right") ?? null;
  const cd = depth + 1;
  const slotT: NodeType = "open"; 

  const lNode: MNode = L ?? {
    id: `vl-${node.id}`, name: slotT, userId: "", type: slotT, position: "left",
  };
  const rNode: MNode = R ?? {
    id: `vr-${node.id}`, name: slotT, userId: "", type: slotT, position: "right",
  };

  const virtSlotNode: MNode = { id:"v", name:slotT, userId:"", type:slotT, position:"left" };
  const lw   = L ? treeW(L, cd) : treeW(virtSlotNode, cd);
  const rw   = R ? treeW(R, cd) : treeW(virtSlotNode, cd);
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
  ln : LayoutNode,
  out: { x1: number; y1: number; x2: number; y2: number }[] = [],
) {
  const py = ln.slot ? ln.y + BS / 2 : ln.y + AR + NH + 4;
  ln.ch.forEach(c => {
    const cy = c.slot ? c.y - BS / 2 : c.y - AR;
    out.push({ x1: ln.x, y1: py, x2: c.x, y2: cy });
    flatEdges(c, out);
  });
  return out;
}

function AvatarActive({ x, y }: { x: number; y: number }) {
  const r = AR, f = (v: number) => r * v;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#1565c0" strokeWidth="2.5"/>
      <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7"/>
      <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f"/>
      <rect x={x-f(0.56)} y={y-f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a"/>
      <rect x={x-f(0.38)} y={y-f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a"/>
      <path d={`M${x-f(0.76)},${y+r} Q${x-f(0.6)},${y+f(0.5)} ${x},${y+f(0.46)} Q${x+f(0.6)},${y+f(0.5)} ${x+f(0.76)},${y+r}`}
            fill="#1976d2"/>
    </g>
  );
}

function AvatarBooster({ x, y }: { x: number; y: number }) {
  const r = AR, f = (v: number) => r * v;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#f57c00" strokeWidth="2.5"/>
      <ellipse cx={x} cy={y - f(0.1)} rx={f(0.37)} ry={f(0.43)} fill="#f5cba7"/>
      <ellipse cx={x} cy={y - f(0.46)} rx={f(0.4)} ry={f(0.2)} fill="#3d2b1f"/>
      <rect x={x-f(0.56)} y={y-f(0.54)} width={f(1.12)} height={f(0.19)} rx="2" fill="#1a1a1a"/>
      <rect x={x-f(0.38)} y={y-f(0.75)} width={f(0.76)} height={f(0.28)} rx="2" fill="#2a2a2a"/>
      <path d={`M${x-f(0.76)},${y+r} Q${x-f(0.6)},${y+f(0.5)} ${x},${y+f(0.46)} Q${x+f(0.6)},${y+f(0.5)} ${x+f(0.76)},${y+r}`}
            fill="#f9a825"/>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════
   TREE SVG RENDERER
═══════════════════════════════════════════════════════ */
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

  const rootW  = treeW(root, 0);
  const cx     = Math.max(rootW / 2 + 100, 440);
  const svgW   = cx * 2;
  const svgH   = (MAXD + 1) * VS + AR + NH + 110;
  const rootLN = buildLayout(root, cx, AR + 40, 0);
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
          />
        );
      })}

      {/* ── Nodes ── */}
      {nodes.map((ln, i) => {
        const { node: n, x, y, slot, depth } = ln;

        /* ── Open / Close slot ── */
        if (slot) {
          const isOpen  = n.type === "open";
          const col     = isOpen ? "#27ae60" : "#e53935";
          const bg      = isOpen ? "#e8f5e9" : "#ffebee";
          const half    = BS / 2;
          const label   = isOpen ? "Open" : "Close";

          return (
            <g
              key={`n-${i}`}
              style={{ cursor: isOpen ? "pointer" : "default" }}
              onClick={e => {
                if (isOpen) { e.stopPropagation(); onNodeClick(n, e); }
              }}
            >
              {/* ── Square box — NO text inside ── */}
              <rect
                x={x - half}
                y={y - half}
                width={BS}
                height={BS}
                rx="10"
                fill={bg}
                stroke={col}
                strokeWidth="3.5"
              />

              {/* ── Label BELOW the box ── */}
              <text
                x={x}
                y={y + half + 16}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={col}
                fontFamily="Poppins,sans-serif"
              >
                {label}
              </text>
            </g>
          );
        }

        /* ── Member node ── */
        const booster    = n.type === "booster";
        const cardTop = y + AR + 4;

        return (
          <g
            key={`n-${i}`}
            onClick={e => onNodeClick(n, e)}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`View details for ${n.id}`}
          >
            <circle cx={x} cy={y} r={AR + 8} fill="transparent"/>

            {/* Glow ring on root */}
            {depth === 0 && (
              <circle
                cx={x} cy={y} r={AR + 5}
                fill="none"
                stroke={booster ? "#f9a825" : "#26a69a"}
                strokeWidth="2"
                opacity="0.5"
              />
            )}

            {booster ? <AvatarBooster x={x} y={y}/> : <AvatarActive x={x} y={y}/>}

            {/* Name card */}
            <rect
              x={x - NW / 2} y={cardTop}
              width={NW} height={NH} rx="8"
              fill={booster ? "#fff8e1" : "#ffffff"}
              stroke={booster ? "#f9a825" : "#90caf9"}
              strokeWidth="1.5"
            />
            <text
              x={x} y={cardTop + 16}
              textAnchor="middle" fontSize="10.5" fontWeight="700"
              fill={booster ? "#e65100" : "#1565c0"}
              fontFamily="Poppins,sans-serif"
            >
              {n.id}
            </text>
            <text
              x={x} y={cardTop + 31}
              textAnchor="middle" fontSize="9.5" fill="#555"
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

/* ── Skeleton loaders ── */
function SkeletonNode() {
  return (
    <g>
      <circle cx="0" cy="0" r={AR} fill="#e0e0e0" opacity="0.6"/>
      <rect x="-65" y="32" width="130" height="44" rx="8" fill="#e0e0e0" opacity="0.6"/>
    </g>
  );
}

function TreeSkeletonSVG() {
  const skNodes = [
    { x: 200, y: 50 },
    { x: 80,  y: 180 }, { x: 320, y: 180 },
    { x: 40,  y: 310 }, { x: 120, y: 310 },
    { x: 280, y: 310 }, { x: 360, y: 310 },
  ];
  return (
    <svg width="520" height="400" style={{ minWidth: 520, display: "block" }} xmlns="http://www.w3.org/2000/svg">
      {[
        { x1:200,y1:90,  x2:80,  y2:130 },
        { x1:200,y1:90,  x2:320, y2:130 },
        { x1:80, y1:220, x2:40,  y2:250 },
        { x1:80, y1:220, x2:120, y2:250 },
        { x1:320,y1:220, x2:280, y2:250 },
        { x1:320,y1:220, x2:360, y2:250 },
      ].map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#e0e0e0" strokeWidth="1.5"/>
      ))}
      {skNodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x},${n.y})`}><SkeletonNode/></g>
      ))}
    </svg>
  );
}

function FilterSkeleton() {
  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:"10px", flexWrap:"wrap" }}>
        <div style={{ flex:"1", minWidth:"190px" }}>
          <div style={{ height:"16px", background:"#e0e0e0", borderRadius:"4px", marginBottom:"6px", width:"60%" }}/>
          <div style={{ height:"38px", background:"#e0e0e0", borderRadius:"6px" }}/>
        </div>
        <div style={{ height:"38px", background:"#e0e0e0", borderRadius:"6px", width:"90px" }}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MEMBER POPUP
═══════════════════════════════════════════════════════ */
function MemberPopup({ state, onClose }: { state: PopupState; onClose: () => void }) {
  const { node: n, left, top } = state;
  const booster = n.type === "booster";

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
        position:"fixed", left, top,
        zIndex:2200, width:308,
        borderRadius:14, overflow:"hidden",
        boxShadow:"0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)",
        border:`2.5px solid ${booster ? "#f9a825" : "#26a69a"}`,
        fontFamily:"Poppins,sans-serif",
        animation:"ntPopIn .2s cubic-bezier(.16,1,.3,1)",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: booster
          ? "linear-gradient(135deg,#e65100,#f9a825)"
          : "linear-gradient(135deg,#26a69a,#1de9b6)",
        padding:"11px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.22)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
            {booster ? "👑" : "👤"}
          </div>
          <div>
            <p style={{ color:"#fff", fontWeight:700, fontSize:13, margin:0 }}>{n.id}</p>
            <p style={{ color:"rgba(255,255,255,0.82)", fontSize:10.5, margin:0 }}>{n.name}</p>
          </div>
        </div>
        <button onClick={onClose}
          style={{ background:"rgba(255,255,255,0.18)", border:"none", borderRadius:7,
                   color:"#fff", cursor:"pointer", padding:"4px 9px", fontSize:13, fontWeight:700 }}>
          ✕
        </button>
      </div>

      <div style={{ background:"#fff", padding:"12px 14px 14px" }}>
        {infoRows.map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                        padding:"5.5px 0", borderBottom:"1px solid #f2f2f2" }}>
            <span style={{ fontSize:11, color:"#888", fontWeight:500 }}>{row.label}</span>
            <span style={{ fontSize:11.5, color:"#222", fontWeight:600 }}>{row.val}</span>
          </div>
        ))}

        <div style={{ display:"flex", gap:8, marginTop:13 }}>
          {countBadges.map(b => (
            <div key={b.label} style={{ flex:1, textAlign:"center", padding:"8px 4px",
                                         borderRadius:9, background:`${b.col}11`, border:`1.5px solid ${b.col}30` }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:b.col, lineHeight:1 }}>{b.val}</p>
              <p style={{ margin:"3px 0 0", fontSize:9, fontWeight:700, color:b.col, letterSpacing:0.6 }}>{b.label}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, textAlign:"center" }}>
          <span style={{
            display:"inline-block", padding:"3px 12px", borderRadius:20, fontSize:10, fontWeight:700,
            background: booster ? "#fff8e1" : "#e3f2fd",
            color: booster ? "#f57c00" : "#1565c0",
            border:`1px solid ${booster ? "#f9a825" : "#90caf9"}`,
            letterSpacing:0.5,
          }}>
            {booster ? "⭐ BOOSTER MEMBER" : "✅ ACTIVE MEMBER"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function NetworkTreePage() {
  const { data: session }           = useSession();
  const router                      = useRouter();
  const [ddOpen,    setDdOpen]      = useState(false);
  const [memberId,  setMemberId]    = useState("");
  const [treeRoot,  setTreeRoot]    = useState<MNode | null>(null);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState("");
  const [autoLoaded,setAutoLoaded]  = useState(false);
  const [popup,     setPopup]       = useState<PopupState | null>(null);
  const scrollRef                   = useRef<HTMLDivElement>(null);

  /* ── Fetch tree ── */
  const fetchTree = async (uid: string) => {
    const trimmed = uid.trim();
    if (!trimmed) { setError("Please enter a Username"); return; }
    setLoading(true); setError(""); setPopup(null);
    try {
      const res  = await fetch("/api/user/placement-tree", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ userId: trimmed }),
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
  useEffect(() => {
    if (session?.user?.username && !autoLoaded) {
      setAutoLoaded(true);
      setMemberId(session.user.username);
      fetchTree(session.user.username);
    }
  }, [session?.user?.username, autoLoaded]);

  const handleNodeClick = (n: MNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSlot(n)) {
      if (n.type === "open") {
        const parentId = n.id.replace(/^v[lr]-/, "");
        router.push(`/dashboard/registration?placementId=${parentId}`);
      }
      return;
    }
    const vw = window.innerWidth, vh = window.innerHeight;
    const pw = 308, ph = 330;
    const box = (e.currentTarget as Element)?.getBoundingClientRect();
    
    if (!box) {
      console.error("Could not get element bounds");
      return;
    }
    let lft = box.left + box.width / 2 - pw / 2;
    let top = box.bottom + 10;
    if (lft + pw > vw - 10) lft = vw - pw - 10;
    if (lft < 10)           lft = 10;
    if (top + ph > vh - 10) top = box.top - ph - 10;
    if (top < 10)           top = 10;
    
    const fetchMemberCard = async () => {
      try {
        const res = await fetch("/api/user/member-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: n.userId }),
        });
        const data = await res.json();
        
        if (data.success && data.card) {
          const card = data.card;
          const updatedNode: MNode = {
            ...n,
            sponsorId: card.sponsorId,
            joiningDate: card.joiningDate,
            package: card.package,
            leftId: card.leftId,
            rightId: card.rightId,
            leftCount: card.leftCount,
            rightCount: card.rightCount,
            totalCount: card.totalCount,
          };
          
          setPopup({ node: updatedNode, left: lft, top });
        }
      } catch (err) {
        console.error("Failed to fetch member card:", err);
      }
    };
    
    fetchMemberCard();
  };

  const handleRootClick = () => {
    if (ddOpen) setDdOpen(false);
    if (popup)  setPopup(null);
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

        .nt-legend { display:flex; align-items:center; justify-content:center; gap:24px;
                     padding:14px 16px 10px; flex-wrap:wrap; border-bottom:1px solid #f0f0f0; }
        .nt-leg-item { display:flex; flex-direction:column; align-items:center; gap:6px; }
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
                                                padding:18px 12px; border-right:1px solid #e8e8e8; border-bottom:none; flex-shrink:0; } }
        @media(min-width:1024px) { .nt-sidebar { width:188px; padding:22px 14px; } }

        .nt-sb-av { width:58px; height:58px; border-radius:50%; background:#e3f2fd; border:2.5px solid #90caf9;
                    display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        @media(min-width:768px) { .nt-sb-av { width:68px; height:68px; margin-bottom:10px; } }

        .nt-sb-lbl { font-size:11px; font-weight:700; color:#1565c0; line-height:1.5; }
        .nt-sb-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
        .nt-sb-dot { width:10px; height:10px; border-radius:50%; background:#ff5722; flex-shrink:0; }
        .nt-sb-id  { font-size:12px; font-weight:600; color:#222; word-break:break-all; }

        .nt-canvas { flex:1; overflow:auto; background:linear-gradient(160deg,#1565c0 0%,#0d47a1 100%);
                     min-height:380px; position:relative;
                     scrollbar-width:thin; scrollbar-color:#ffa000 #0d47a1; }
        @media(min-width:768px)  { .nt-canvas { min-height:440px; } }
        @media(min-width:1024px) { .nt-canvas { min-height:520px; } }
        .nt-canvas::-webkit-scrollbar       { width:7px; height:7px; }
        .nt-canvas::-webkit-scrollbar-track { background:#0d47a1; }
        .nt-canvas::-webkit-scrollbar-thumb { background:#ffa000; border-radius:4px; }

        .nt-canvas-inner { padding:26px 36px 38px; display:inline-block; min-width:100%; }
        @media(min-width:1024px) { .nt-canvas-inner { padding:32px 44px 44px; } }

        .nt-spin { display:inline-block; width:34px; height:34px;
                   border:4px solid rgba(255,255,255,.25); border-top-color:#fff;
                   border-radius:50%; animation:ntSpin .85s linear infinite; }

        .nt-overlay { position:fixed; inset:0; z-index:2100; background:transparent; }
      `}</style>

      <div className="nt-root" onClick={handleRootClick}>
        <Navbar dropdownOpen={ddOpen} setDropdownOpen={setDdOpen} setActivePage={() => {}}/>

        {/* Breadcrumb */}
        <div className="nt-bc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#777">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <a href="/dashboard">Home</a>
          <span style={{ color:"#ccc" }}>/</span>
          <span>My Network</span>
          <span style={{ color:"#ccc" }}>/</span>
          <span style={{ color:"#26a69a", fontWeight:600 }}>Network Tree</span>
        </div>

        <div className="nt-body">
          <div className="nt-card">

            {/* Header */}
            <div className="nt-hdr">
              <span className="nt-hdr-title">Network Tree (Placement Tree)</span>
            </div>

            {/* Legend */}
            <div className="nt-legend">
              <div className="nt-leg-item">
                <svg width="42" height="42" viewBox="-4 -4 60 60" xmlns="http://www.w3.org/2000/svg">
                  <AvatarActive x={26} y={26}/>
                </svg>
                <span className="nt-leg-lbl">Active ID</span>
              </div>
              <div className="nt-leg-item">
                <svg width="42" height="42" viewBox="-4 -4 60 60" xmlns="http://www.w3.org/2000/svg">
                  <AvatarBooster x={26} y={26}/>
                </svg>
                <span className="nt-leg-lbl">Booster Id</span>
              </div>
              {/* Legend slot boxes — same style as tree (empty box, label below) */}
              <div className="nt-leg-item">
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:36, height:36, borderRadius:8, border:"3px solid #e53935",
                                background:"#ffebee" }}/>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#e53935" }}>Close</span>
                </div>
                <span className="nt-leg-lbl">Closed</span>
              </div>
              <div className="nt-leg-item">
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:36, height:36, borderRadius:8, border:"3px solid #27ae60",
                                background:"#e8f5e9" }}/>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#27ae60" }}>Open</span>
                </div>
                <span className="nt-leg-lbl">Open</span>
              </div>
            </div>

            {/* Filter */}
            <div className="nt-filter">
              {loading ? <FilterSkeleton/> : (
                <div className="nt-f-row">
                  <div className="nt-f-grp">
                    <label className="nt-f-lbl">Username :</label>
                    <input
                      className="nt-f-in"
                      type="text"
                      placeholder="Enter Username (e.g., CLM2026001)"
                      value={memberId}
                      onChange={e => setMemberId(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && fetchTree(memberId)}
                    />
                  </div>
                  <button className="nt-f-btn" onClick={() => fetchTree(memberId)} disabled={loading}>
                    {loading ? "Loading…" : "Filter"}
                  </button>
                </div>
              )}
              {error && <div className="nt-err">{error}</div>}
            </div>

            {/* Tree layout */}
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
                  {loading
                    ? <TreeSkeletonSVG/>
                    : <TreeSVG root={treeRoot} onNodeClick={handleNodeClick}/>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup */}
        {popup && (
          <>
            <div className="nt-overlay" onClick={() => setPopup(null)}/>
            <MemberPopup state={popup} onClose={() => setPopup(null)}/>
          </>
        )}
      </div>
    </>
  );
}