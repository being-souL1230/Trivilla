"use client";
import { cx, type TableT } from "@/lib/utils";

/* ================= table geometry on the hall (viewBox 1000x620) ================= */

type Shape =
  | { kind: "square"; x: number; y: number; s: number }
  | { kind: "round"; x: number; y: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number };

const LAYOUT: Record<number, Shape> = {
  // Window side — top row
  1: { kind: "square", x: 300, y: 96, s: 64 },
  2: { kind: "round", x: 470, y: 98, r: 36 },
  10: { kind: "square", x: 636, y: 96, s: 64 },
  // Main hall — centre
  3: { kind: "square", x: 352, y: 268, s: 72 },
  4: { kind: "round", x: 540, y: 272, r: 40 },
  5: { kind: "square", x: 676, y: 268, s: 72 },
  8: { kind: "square", x: 470, y: 430, s: 72 },
  // Terrace — left strip
  6: { kind: "square", x: 116, y: 150, s: 58 },
  7: { kind: "round", x: 116, y: 300, r: 32 },
  9: { kind: "square", x: 116, y: 436, s: 58 },
  // Private booths — right
  11: { kind: "rect", x: 895, y: 200, w: 120, h: 72 },
  12: { kind: "rect", x: 896, y: 372, w: 132, h: 78 },
};

/* Second floor — VIP Lounge layout */
const VIP_LAYOUT: Record<number, Shape> = {
  13: { kind: "square", x: 280, y: 220, s: 76 },
  14: { kind: "round", x: 540, y: 180, r: 44 },
  15: { kind: "square", x: 400, y: 420, s: 76 },
  16: { kind: "rect", x: 750, y: 280, w: 140, h: 84 },
};

const STATUS_FILL: Record<string, { fill: string; stroke: string; text: string; dashed?: boolean }> = {
  free: { fill: "#7fa36b", stroke: "#5f814e", text: "#ffffff" },
  occupied: { fill: "#cf8a3e", stroke: "#a96b28", text: "#ffffff" },
  reserved: { fill: "#a7a29a", stroke: "#87837b", text: "#ffffff" },
  cleaning: { fill: "#ece2cd", stroke: "#b7a684", text: "#8a755a", dashed: true },
};

const VIP_FILL: Record<string, { fill: string; stroke: string; text: string; dashed?: boolean }> = {
  free: { fill: "#c9a03a", stroke: "#a88128", text: "#ffffff" },
  occupied: { fill: "#b8912e", stroke: "#9a7825", text: "#ffffff" },
  reserved: { fill: "#a88128", stroke: "#8a6920", text: "#ffffff" },
  cleaning: { fill: "#d4b44a", stroke: "#b89830", text: "#3d2e12", dashed: true },
};

function Chairs({ shape, seats }: { shape: Shape; seats: number }) {
  const c = "#e6d9bd";
  const cs = "#c9b892";
  const chair = (x: number, y: number, rot = 0, key: string) => (
    <rect
      key={key}
      x={x - 9}
      y={y - 6}
      width={18}
      height={12}
      rx={4}
      fill={c}
      stroke={cs}
      strokeWidth={1.4}
      transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
    />
  );
  const out: React.ReactNode[] = [];
  if (shape.kind === "square") {
    const { x, y, s } = shape;
    const half = s / 2;
    const top = seats <= 2 ? 1 : 2;
    if (top === 1) {
      out.push(chair(x, y - half - 12, 0, "t0"));
      out.push(chair(x, y + half + 12, 0, "b0"));
    } else {
      out.push(chair(x - s * 0.24, y - half - 12, 0, "t0"), chair(x + s * 0.24, y - half - 12, 0, "t1"));
      out.push(chair(x - s * 0.24, y + half + 12, 0, "b0"), chair(x + s * 0.24, y + half + 12, 0, "b1"));
    }
  } else if (shape.kind === "round") {
    const { x, y, r } = shape;
    const n = seats >= 6 ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      out.push(chair(x + Math.cos(a) * (r + 13), y + Math.sin(a) * (r + 13), 0, `r${i}`));
    }
  } else {
    const { x, y, w } = shape;
    const n = Math.round(seats / 2);
    for (let i = 0; i < n; i++) {
      const px = x - w / 2 + (w / (n + 1)) * (i + 1);
      out.push(chair(px, y - 48, 0, `t${i}`), chair(px, y + 48, 0, `b${i}`));
    }
  }
  return <g>{out}</g>;
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.9}>
      <circle r={13} fill="#6f8f57" />
      <circle cx={-7} cy={-4} r={8} fill="#7fa36b" />
      <circle cx={7} cy={-3} r={7} fill="#5f814e" />
      <circle cx={0} cy={6} r={7} fill="#86a873" />
    </g>
  );
}

export default function FloorPlan({
  tables,
  selectedId,
  onSelect,
  floor = "main",
}: {
  tables: TableT[];
  selectedId: number | null;
  onSelect: (t: TableT) => void;
  floor?: "main" | "vip";
}) {
  const layout = floor === "vip" ? VIP_LAYOUT : LAYOUT;
  return (
    <svg viewBox="0 0 1000 620" className="h-auto w-full select-none" role="img" aria-label="Trivilla floor plan">
      <defs>
        <pattern id="wood" width="26" height="620" patternUnits="userSpaceOnUse">
          <rect width="26" height="620" fill="#efe7d4" />
          <line x1="0" y1="0" x2="0" y2="620" stroke="#e4d8be" strokeWidth="1.2" />
        </pattern>
        <pattern id="patio" width="34" height="34" patternUnits="userSpaceOnUse">
          <rect width="34" height="34" fill="#e9e0cb" />
          <path d="M0 34 L34 0" stroke="#ded2b6" strokeWidth="1" />
        </pattern>
        <filter id="tblshadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#2a1b0e" floodOpacity="0.22" />
        </filter>
      </defs>

      {floor === "vip" ? (
        <>
          {/* ═══════════════════════════════════════════════ */}
          {/* VIP LOUNGE — PREMIUM GOLD EDITION             */}
          {/* ═══════════════════════════════════════════════ */}

          {/* Outer grand wall — deep gold frame */}
          <rect x={16} y={12} width={968} height={596} fill="#f7efdb" stroke="#7a6a3a" strokeWidth={12} rx={6} />
          <rect x={28} y={24} width={944} height={572} fill="#f0e7d0" stroke="#b5a065" strokeWidth={4} rx={3} />

          {/* Marble floor — subtle diamond pattern inlay */}
          <rect x={44} y={44} width={912} height={532} fill="#efe3cb" rx={2} />
          {[180, 300, 420, 540, 660, 780].map((x, i) => (
            <line key={`marble-v-${i}`} x1={x} y1={44} x2={x} y2={576} stroke="rgba(212,175,55,0.06)" strokeWidth={1} />
          ))}
          {[130, 240, 350, 470].map((y, i) => (
            <line key={`marble-h-${i}`} x1={44} y1={y} x2={956} y2={y} stroke="rgba(212,175,55,0.06)" strokeWidth={1} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={`marble-dia-${i}`} x={160 + i * 160} y={100} width={80} height={80} rx={2} fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth={1} transform={`rotate(45 ${200 + i * 160} 140)`} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={`marble-dia-b-${i}`} x={160 + i * 160} y={400} width={80} height={80} rx={2} fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth={1} transform={`rotate(45 ${200 + i * 160} 440)`} />
          ))}

          {/* Crown moulding — ornate inner border */}
          <rect x={40} y={40} width={920} height={540} fill="none" stroke="#c9a03a" strokeWidth={1.5} strokeDasharray="8 6" rx={1} opacity={0.25} />
          <rect x={44} y={44} width={912} height={532} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={1} rx={1} />

          {/* 🏛️ ELEGANT DRAPES — Top curtain valance */}
          <path d="M48 40 Q50 70 70 55 Q90 40 120 50 Q150 60 180 45 Q210 30 240 50 Q270 70 300 48 Q330 26 360 50 Q390 74 420 52 Q450 30 480 55 Q510 80 540 58 Q570 36 600 52 Q630 68 660 48 Q690 28 720 50 Q750 72 780 52 Q810 32 840 50 Q870 68 900 48 Q930 28 950 50 L952 40 Z" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.18)" strokeWidth={0.5} />
          {/* Draw strings */}
          <line x1={120} y1={55} x2={120} y2={70} stroke="rgba(212,175,55,0.15)" strokeWidth={0.8} />
          <line x1={880} y1={55} x2={880} y2={70} stroke="rgba(212,175,55,0.15)" strokeWidth={0.8} />

          {/* 🏛️ SIDE DRAPES — left and right */}
          {/* Left drape */}
          <path d="M44 40 Q40 180 42 320 Q44 460 46 570 L60 570 Q56 460 54 320 Q52 180 56 40 Z" fill="rgba(180,155,80,0.07)" stroke="rgba(180,155,80,0.12)" strokeWidth={0.5} />
          {/* Right drape */}
          <path d="M956 40 Q960 180 958 320 Q956 460 954 570 L940 570 Q944 460 946 320 Q948 180 944 40 Z" fill="rgba(180,155,80,0.07)" stroke="rgba(180,155,80,0.12)" strokeWidth={0.5} />

          {/* 🏛️ CORNER IONIC COLUMNS */}
          {[
            { x: 44, y: 44, flip: 1 },
            { x: 956, y: 44, flip: -1 },
            { x: 44, y: 572, flip: 1 },
            { x: 956, y: 572, flip: -1 },
          ].map((col, i) => (
            <g key={`column-${i}`}>
              {/* Pillar base */}
              <rect x={col.x - 6} y={col.y - (col.y > 300 ? 28 : 0)} width={12} height={col.y > 300 ? 28 : 24} fill="#d9cdb2" stroke="#b5a065" strokeWidth={1} rx={2} />
              {/* Pillar shaft */}
              <rect x={col.x - 4} y={col.y - (col.y > 300 ? 28 : 0) + (col.y > 300 ? 0 : 24)} width={8} height={col.y > 300 ? 520 : 500} fill="#e8dfc5" stroke="#c9b892" strokeWidth={0.5} />
              {/* Vertical fluting lines */}
              <line x1={col.x - 2} y1={col.y - (col.y > 300 ? 28 : 0) + (col.y > 300 ? 0 : 24)} x2={col.x - 2} y2={col.y - (col.y > 300 ? 28 : 0) + (col.y > 300 ? 520 : 524)} stroke="#d4c9aa" strokeWidth={0.4} />
              <line x1={col.x + 2} y1={col.y - (col.y > 300 ? 28 : 0) + (col.y > 300 ? 0 : 24)} x2={col.x + 2} y2={col.y - (col.y > 300 ? 28 : 0) + (col.y > 300 ? 520 : 524)} stroke="#d4c9aa" strokeWidth={0.4} />
              {/* Pillar capital */}
              <rect x={col.x - 7} y={col.y - 30} width={14} height={8} fill="#c9b892" stroke="#b5a065" strokeWidth={0.8} rx={1.5} />
              <rect x={col.x - 9} y={col.y - 24} width={18} height={5} fill="#d4c4a0" stroke="#b5a065" strokeWidth={0.6} rx={2} />
            </g>
          ))}

          {/* Entrance archway — bottom centre */}
          <g transform="translate(500, 560)">
            <path d="M-70 0 L-70 -26 Q-70 -48 -50 -54 Q-25 -62 0 -62 Q25 -62 50 -54 Q70 -48 70 -26 L70 0" fill="none" stroke="#b5a065" strokeWidth={2.5} opacity={0.35} />
            <path d="M-74 0 L-74 -28 Q-74 -52 -52 -58 Q-26 -66 0 -66 Q26 -66 52 -58 Q74 -52 74 -28 L74 0" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth={1} />
          </g>

          {/* ═══ VIP LOUNGE HEADING — ORNATE GOLD BADGE ═══ */}
          {/* Decorative top ribbons */}
          <path d="M260 48 Q280 36 310 40 Q340 44 360 48" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth={1.5} />
          <path d="M640 48 Q660 44 690 40 Q720 36 740 48" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth={1.5} />

          {/* Main badge background */}
          <rect x={330} y={46} width={340} height={52} rx={14} fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.2)" strokeWidth={1.2} />
          {/* Inner glow line */}
          <rect x={334} y={50} width={332} height={44} rx={11} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth={0.6} />

          {/* Side ornaments */}
          <text x={350} y={77} textAnchor="middle" fontSize={14} fill="rgba(212,175,55,0.2)">❖</text>
          <text x={650} y={77} textAnchor="middle" fontSize={14} fill="rgba(212,175,55,0.2)">❖</text>

          <text x={500} y={68} textAnchor="middle" className="fill-[#c9a03a]" fontSize={15} fontWeight={900} letterSpacing={6}>
            VIP LOUNGE
          </text>
          <text x={500} y={86} textAnchor="middle" className="fill-[#a08a68]" fontSize={9} fontWeight={800} letterSpacing={4}>
            SECOND FLOOR · PRIVATE MEMBERS ONLY
          </text>

          {/* Decorative divider below heading — with gold medallion */}
          <line x1={150} y1={115} x2={850} y2={115} stroke="rgba(212,175,55,0.12)" strokeWidth={1} />
          <line x1={180} y1={118} x2={820} y2={118} stroke="rgba(212,175,55,0.06)" strokeWidth={0.5} />
          {/* centre medallion */}
          <circle cx={500} cy={116} r={8} fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.18)" strokeWidth={0.8} />
          <circle cx={500} cy={116} r={3} fill="rgba(212,175,55,0.25)" />

          {/* Left decorative rosette */}
          <g transform="translate(100, 300)">
            <circle cx={0} cy={0} r={18} fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.1)" strokeWidth={0.6} />
            <circle cx={0} cy={0} r={8} fill="rgba(212,175,55,0.06)" />
          </g>
          {/* Right decorative rosette */}
          <g transform="translate(900, 300)">
            <circle cx={0} cy={0} r={18} fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.1)" strokeWidth={0.6} />
            <circle cx={0} cy={0} r={8} fill="rgba(212,175,55,0.06)" />
          </g>

          {/* 💎 CRYSTAL CHANDELIER — centre top */}
          <g transform="translate(500, 40)">
            {/* Ceiling chain */}
            <line x1={0} y1={0} x2={0} y2={18} stroke="#b5a065" strokeWidth={1.5} />
            {/* Crown */}
            <path d="M-20 18 L-22 24 L-16 20 L-8 28 L0 22 L8 28 L16 20 L22 24 L20 18 Z" fill="#c9a03a" opacity={0.35} stroke="#b5a065" strokeWidth={0.8} />
            {/* Light tiers */}
            <path d="M-32 26 Q-28 34 -18 32 L18 32 Q28 34 32 26" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth={1.2} />
            {/* Crystals — teardrops */}
            {[-30, -20, -10, 0, 10, 20, 30].map((x, i) => (
              <g key={`cry-${i}`}>
                <line x1={x} y1={28} x2={x} y2={34 + Math.abs(i - 3) * 0.5} stroke="rgba(255,255,255,0.25)" strokeWidth={0.6} />
                <circle cx={x} cy={36 + Math.abs(i - 3) * 0.5} r={1.5} fill="rgba(255,255,255,0.3)" />
              </g>
            ))}
            {/* Glow effect */}
            <ellipse cx={0} cy={30} rx={35} ry={8} fill="rgba(255,215,0,0.04)" />
          </g>

          {/* 🕯️ WALL SCONCES — left & right walls */}
          {[
            { x: 60, y: 170, dir: 1 },
            { x: 60, y: 430, dir: 1 },
            { x: 940, y: 170, dir: -1 },
            { x: 940, y: 430, dir: -1 },
          ].map((sconce, i) => (
            <g key={`sconce-${i}`}>
              {/* Wall bracket */}
              <path d={`M${sconce.x} ${sconce.y} L${sconce.x + sconce.dir * 8} ${sconce.y - 4}`} stroke="#b5a065" strokeWidth={1.2} fill="none" />
              {/* Candle holder */}
              <rect x={sconce.x + sconce.dir * 8 - 3} y={sconce.y - 8} width={6} height={6} fill="#c9b892" rx={1} stroke="#b5a065" strokeWidth={0.5} />
              {/* Candle */}
              <rect x={sconce.x + sconce.dir * 8 - 2} y={sconce.y - 14} width={4} height={6} fill="#f0e6c8" rx={1} />
              {/* Flame */}
              <ellipse cx={sconce.x + sconce.dir * 8} cy={sconce.y - 16} rx={2} ry={3.5} fill="rgba(255,200,50,0.3)" />
              <ellipse cx={sconce.x + sconce.dir * 8} cy={sconce.y - 17} rx={1} ry={2} fill="rgba(255,220,100,0.5)" />
            </g>
          ))}

          {/* 🌟 CENTREPIECE — GRAND MARBLE FOUNTAIN */}
          <g transform="translate(500, 330)">
            {/* Outer ambient glow */}
            <circle cx={0} cy={0} r={48} fill="rgba(212,175,55,0.04)" />
            <circle cx={0} cy={0} r={36} fill="rgba(212,175,55,0.05)" />

            {/* Marble base — octagonal shape */}
            <rect x={-30} y={-10} width={60} height={10} rx={4} fill="#ddd0b0" stroke="#c9a03a" strokeWidth={1.5} />
            <rect x={-26} y={-6} width={52} height={4} rx={2} fill="#e8ddc5" stroke="rgba(212,175,55,0.2)" strokeWidth={0.5} />

            {/* Fountain basin — lower tier */}
            <ellipse cx={0} cy={-4} rx={22} ry={6} fill="#d9cdb2" stroke="#c9a03a" strokeWidth={1.2} />
            {/* Water in basin */}
            <ellipse cx={0} cy={-3} rx={18} ry={4} fill="rgba(180,210,230,0.15)" />

            {/* Fountain stem */}
            <rect x={-4} y={-22} width={8} height={18} fill="#ddd0b0" stroke="#c9a03a" strokeWidth={0.8} rx={2} />

            {/* Upper basin */}
            <ellipse cx={0} cy={-24} rx={14} ry={4} fill="#ddd0b0" stroke="#c9a03a" strokeWidth={1} />
            {/* Water in upper basin */}
            <ellipse cx={0} cy={-23} rx={11} ry={2.5} fill="rgba(180,210,230,0.2)" />

            {/* Water jet */}
            <path d="M-2 -26 Q-4 -36 0 -40 Q4 -36 2 -26" fill="rgba(180,210,230,0.12)" />
            {/* Water drops — deterministic positions */}
            {[-8, -4, 0, 4, 8].map((x, i) => (
              <circle key={`drop-${i}`} cx={x} cy={-16 + (i % 3) * 0.8} r={1} fill="rgba(180,210,230,0.15)" />
            ))}

            {/* Gold rim highlight */}
            <ellipse cx={0} cy={-24} rx={14} ry={4} fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth={0.8} />
            <ellipse cx={0} cy={-4} rx={22} ry={6} fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth={0.8} />
          </g>

          {/* 💡 WARM AMBIENT LIGHTING — pools of golden light */}
          {[
            { cx: 280, cy: 220, r: 100 },
            { cx: 540, cy: 180, r: 95 },
            { cx: 400, cy: 420, r: 100 },
            { cx: 750, cy: 280, r: 110 },
          ].map((glow, i) => (
            <g key={`ambient-${i}`}>
              <circle cx={glow.cx} cy={glow.cy} r={glow.r} fill="#c9a03a" opacity={0.035} />
              <circle cx={glow.cx} cy={glow.cy} r={glow.r * 0.6} fill="#c9a03a" opacity={0.025} />
            </g>
          ))}

          {/* 🏮 ORNATE PERSIAN-STYLE RUGS under each table */}
          {[
            { cx: 280, cy: 220, w: 110, h: 110 },
            { cx: 540, cy: 180, w: 116, h: 116 },
            { cx: 400, cy: 420, w: 110, h: 110 },
            { cx: 750, cy: 280, w: 176, h: 120 },
          ].map((rug, i) => (
            <g key={`rug-${i}`}>
              {/* Outer border */}
              <rect
                x={rug.cx - rug.w / 2}
                y={rug.cy - rug.h / 2}
                width={rug.w}
                height={rug.h}
                rx={10}
                fill="rgba(212,175,55,0.06)"
                stroke="rgba(212,175,55,0.14)"
                strokeWidth={1.2}
              />
              {/* Inner border */}
              <rect
                x={rug.cx - rug.w / 2 + 5}
                y={rug.cy - rug.h / 2 + 5}
                width={rug.w - 10}
                height={rug.h - 10}
                rx={6}
                fill="none"
                stroke="rgba(212,175,55,0.08)"
                strokeWidth={0.6}
              />
              {/* Corner ornaments */}
              {[
                { dx: -rug.w / 2 + 8, dy: -rug.h / 2 + 8 },
                { dx: rug.w / 2 - 8, dy: -rug.h / 2 + 8 },
                { dx: -rug.w / 2 + 8, dy: rug.h / 2 - 8 },
                { dx: rug.w / 2 - 8, dy: rug.h / 2 - 8 },
              ].map((corner, j) => (
                <circle key={`rug-corner-${i}-${j}`} cx={rug.cx + corner.dx} cy={rug.cy + corner.dy} r={3} fill="rgba(212,175,55,0.12)" />
              ))}
            </g>
          ))}

          {/* 🌿 LUXE TALL PLANTERS */}
          {/* Large statement plants */}
          <Plant x={75} y={140} s={1.15} />
          <Plant x={925} y={140} s={1.15} />
          <Plant x={75} y={470} s={1.25} />
          <Plant x={925} y={470} s={1.25} />

          {/* Marble planters (pots under plants) */}
          {[
            { x: 75, y: 155 },
            { x: 925, y: 155 },
            { x: 75, y: 485 },
            { x: 925, y: 485 },
          ].map((pot, i) => (
            <rect key={`pot-${i}`} x={pot.x - 12} y={pot.y} width={24} height={10} rx={3} fill="#ddd0b0" stroke="#c9a03a" strokeWidth={0.6} opacity={0.4} />
          ))}

          {/* Small accent plants */}
          <Plant x={240} y={108} s={0.6} />
          <Plant x={700} y={108} s={0.6} />
          <Plant x={240} y={530} s={0.6} />
          <Plant x={700} y={530} s={0.6} />

          {/* Mid-height plants flanking centre */}
          <Plant x={420} y={115} s={0.7} />
          <Plant x={580} y={115} s={0.7} />

          {/* ✨ GOLD SPARKLE ACCENTS */}
          {[
            { x: 130, y: 130 }, { x: 870, y: 130 },
            { x: 130, y: 490 }, { x: 870, y: 490 },
            { x: 320, y: 115 }, { x: 680, y: 115 },
            { x: 200, y: 530 }, { x: 800, y: 530 },
          ].map((s, i) => (
            <text key={`sparkle-${i}`} x={s.x} y={s.y} textAnchor="middle" fontSize={11} fill="rgba(212,175,55,0.18)" fontWeight={900}>✦</text>
          ))}

          {/* Extra tiny sparkles */}
          {[
            { x: 170, y: 180 }, { x: 830, y: 180 },
            { x: 170, y: 420 }, { x: 830, y: 420 },
            { x: 300, y: 540 }, { x: 700, y: 540 },
            { x: 460, y: 130 }, { x: 540, y: 130 },
          ].map((s, i) => (
            <text key={`sparkle-sm-${i}`} x={s.x} y={s.y} textAnchor="middle" fontSize={7} fill="rgba(212,175,55,0.12)">✦</text>
          ))}
        </>
      ) : (
        <>
          {/* terrace zone (left) */}
          <rect x={25} y={21} width={178} height={578} fill="url(#patio)" />
          <line x1={203} y1={21} x2={203} y2={180} stroke="#3b352c" strokeWidth={7} />
          <line x1={203} y1={250} x2={203} y2={600} stroke="#3b352c" strokeWidth={7} />
          <path d="M203 180 A70 70 0 0 1 273 250" fill="none" stroke="#3b352c" strokeWidth={2} />

          <text x={114} y={330} textAnchor="middle" className="fill-[#8a755a]" fontSize={13} fontWeight={800} letterSpacing={3}>PATIO</text>
          <text x={480} y={52} textAnchor="middle" className="fill-[#a08a68]" fontSize={11} fontWeight={800} letterSpacing={3}>WINDOW SIDE</text>
          <text x={500} y={360} textAnchor="middle" className="fill-[#a08a68]" fontSize={13} fontWeight={800} letterSpacing={4}>MAIN HALL</text>
          <text x={886} y={120} textAnchor="middle" className="fill-[#a08a68]" fontSize={11} fontWeight={800} letterSpacing={3}>PRIVATE</text>

          {/* centre planter */}
          <rect x={380} y={186} width={240} height={22} rx={4} fill="#d9cdb2" stroke="#b7a684" strokeWidth={2} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Plant key={i} x={398 + i * 34} y={196} s={0.62} />
          ))}

          <Plant x={48} y={48} />
          <Plant x={180} y={60} s={0.8} />
          <Plant x={48} y={560} s={1.1} />
          <Plant x={180} y={520} s={0.8} />
          <Plant x={268} y={52} s={0.9} />
          <Plant x={760} y={52} s={0.9} />
          <Plant x={952} y={566} s={0.9} />

          {/* bar */}
          <rect x={430} y={548} width={520} height={34} rx={10} fill="#e3d7bd" stroke="#c2b18c" strokeWidth={2} />
          <text x={690} y={570} textAnchor="middle" className="fill-[#8a755a]" fontSize={12} fontWeight={800} letterSpacing={3}>BAR</text>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle key={i} cx={466 + i * 66} cy={536} r={10} fill="#8a6a44" stroke="#6e5232" strokeWidth={1.5} />
          ))}

          {/* host stand */}
          <rect x={240} y={540} width={120} height={50} rx={8} fill="#e3d7bd" stroke="#c2b18c" strokeWidth={2} />
          <rect x={252} y={550} width={26} height={30} rx={3} fill="#b08c5c" />
          <text x={316} y={563} textAnchor="middle" className="fill-[#8a755a]" fontSize={10} fontWeight={800} letterSpacing={2}>HOST</text>
          <text x={316} y={576} textAnchor="middle" className="fill-[#8a755a]" fontSize={10} fontWeight={800} letterSpacing={2}>STAND</text>
          <Plant x={348} y={552} s={0.55} />

          {/* private booth walls — L-shape (top + right edge only) */}
          <path d="M810 130 L975 130 L975 296" fill="none" stroke="#3b352c" strokeWidth={7} />
          <path d="M810 306 L975 306 L975 480" fill="none" stroke="#3b352c" strokeWidth={7} />
        </>
      )}

      {/* tables */}
      {tables.map((t) => {
        const shape = layout[t.tableNo];
        if (!shape) return null;
        const isVip = t.vip;
        const st = isVip ? (VIP_FILL[t.status] ?? VIP_FILL.free) : (STATUS_FILL[t.status] ?? STATUS_FILL.free);
        const interactive = t.status === "free";
        const selected = selectedId === t.id;
        const cx0 = shape.x;
        const cy0 = shape.y;
        const badge =
          shape.kind === "round"
            ? { x: shape.x + shape.r - 4, y: shape.y - shape.r + 4 }
            : shape.kind === "square"
              ? { x: shape.x + shape.s / 2 - 4, y: shape.y - shape.s / 2 + 4 }
              : { x: shape.x + shape.w / 2 - 4, y: shape.y - shape.h / 2 + 4 };
        return (
          <g
            key={t.id}
            onClick={() => onSelect(t)}
            className={cx(
              "transition-transform duration-200",
              interactive ? "cursor-pointer hover:scale-[1.04]" : "cursor-not-allowed opacity-95",
              isVip && "drop-shadow-[0_0_8px_rgba(193,151,58,0.5)]",
            )}
            style={{ transformOrigin: `${cx0}px ${cy0}px` }}
          >
            <Chairs shape={shape} seats={t.seats} />
            {selected && (
              <>
                {shape.kind === "round" ? (
                  <circle cx={shape.x} cy={shape.y} r={shape.r + 8} fill="none" stroke="#be8f35" strokeWidth={3.5} className="animate-pulse" />
                ) : shape.kind === "square" ? (
                  <rect x={shape.x - shape.s / 2 - 8} y={shape.y - shape.s / 2 - 8} width={shape.s + 16} height={shape.s + 16} rx={14} fill="none" stroke="#be8f35" strokeWidth={3.5} className="animate-pulse" />
                ) : (
                  <rect x={shape.x - shape.w / 2 - 8} y={shape.y - shape.h / 2 - 8} width={shape.w + 16} height={shape.h + 16} rx={14} fill="none" stroke="#be8f35" strokeWidth={3.5} className="animate-pulse" />
                )}
              </>
            )}
            {shape.kind === "round" ? (
              <circle cx={shape.x} cy={shape.y} r={shape.r} fill={st.fill} stroke={st.stroke} strokeWidth={2.5} strokeDasharray={st.dashed ? "6 5" : undefined} filter="url(#tblshadow)" />
            ) : shape.kind === "square" ? (
              <rect x={shape.x - shape.s / 2} y={shape.y - shape.s / 2} width={shape.s} height={shape.s} rx={10} fill={st.fill} stroke={st.stroke} strokeWidth={2.5} strokeDasharray={st.dashed ? "6 5" : undefined} filter="url(#tblshadow)" />
            ) : (
              <rect x={shape.x - shape.w / 2} y={shape.y - shape.h / 2} width={shape.w} height={shape.h} rx={10} fill={st.fill} stroke={st.stroke} strokeWidth={2.5} strokeDasharray={st.dashed ? "6 5" : undefined} filter="url(#tblshadow)" />
            )}
            <text
              x={cx0}
              y={cy0 + 6}
              textAnchor="middle"
              fontSize={shape.kind === "rect" ? 22 : 24}
              fontWeight={800}
              fill={st.text}
              fontFamily="Fraunces, serif"
            >
              {t.tableNo}
            </text>
            {(t.status === "reserved" || t.status === "cleaning") && (
              <text x={cx0} y={cy0 + 22} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={st.text} letterSpacing={1}>
                {t.status === "reserved" ? "RESERVED" : "CLEANING"}
              </text>
            )}
            {/* seats badge */}
            <g transform={`translate(${badge.x} ${badge.y})`}>
              <circle r={9} fill={isVip ? "#7a5a12" : "#2a1b0e"} opacity={0.82} />
              <text y={3.2} textAnchor="middle" fontSize={9} fontWeight={800} fill={isVip ? "#f6eacd" : "#f6eacd"}>{t.seats}</text>
            </g>
            {/* VIP crown indicator */}
            {isVip && (
              <g transform={`translate(${badge.x - 8} ${badge.y - 14})`}>
                <text fontSize={12} fill="#c9a03a" fontWeight={900}>👑</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
