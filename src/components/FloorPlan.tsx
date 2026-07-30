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
  11: { kind: "rect", x: 878, y: 200, w: 120, h: 72 },
  12: { kind: "rect", x: 872, y: 372, w: 132, h: 78 },
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
          {/* VIP Lounge background — rich dark with gold accent */}
          <rect x={20} y={16} width={960} height={588} fill="#2a1f0e" stroke="#8a7a4a" strokeWidth={8} rx={4} />
          <rect x={28} y={24} width={944} height={572} fill="#3d2e12" stroke="#6a5a2a" strokeWidth={2} rx={2} />

          {/* Decorative gold border lines */}
          <rect x={40} y={36} width={920} height={548} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={1} rx={1} />

          {/* VIP Lounge heading */}
          <text x={500} y={70} textAnchor="middle" className="fill-[#c9a03a]" fontSize={16} fontWeight={900} letterSpacing={6}>
            VIP LOUNGE
          </text>
          <text x={500} y={90} textAnchor="middle" className="fill-[#8a7a4a]" fontSize={10} fontWeight={800} letterSpacing={4}>
            SECOND FLOOR
          </text>

          {/* Decorative divider */}
          <line x1={180} y1={100} x2={820} y2={100} stroke="rgba(212,175,55,0.2)" strokeWidth={1} />

          {/* Corner decorative elements */}
          <text x={60} y={570} className="fill-[rgba(212,175,55,0.15)]" fontSize={9} fontWeight={800} letterSpacing={2}>PREMIUM</text>
          <text x={880} y={570} className="fill-[rgba(212,175,55,0.15)]" fontSize={9} fontWeight={800} letterSpacing={2}>EXCLUSIVE</text>
        </>
      ) : (
        <>
          {/* Main floor */}
          <rect x={20} y={16} width={960} height={588} fill="url(#wood)" stroke="#3b352c" strokeWidth={10} rx={4} />

          <rect x={25} y={21} width={178} height={578} fill="url(#patio)" />
          <line x1={203} y1={21} x2={203} y2={180} stroke="#3b352c" strokeWidth={7} />
          <line x1={203} y1={250} x2={203} y2={600} stroke="#3b352c" strokeWidth={7} />
          <path d="M203 180 A70 70 0 0 1 273 250" fill="none" stroke="#3b352c" strokeWidth={2} />

          <text x={114} y={330} textAnchor="middle" className="fill-[#8a755a]" fontSize={13} fontWeight={800} letterSpacing={3}>PATIO</text>
          <text x={480} y={52} textAnchor="middle" className="fill-[#a08a68]" fontSize={11} fontWeight={800} letterSpacing={3}>WINDOW SIDE</text>
          <text x={500} y={360} textAnchor="middle" className="fill-[#a08a68]" fontSize={13} fontWeight={800} letterSpacing={4}>MAIN HALL</text>
          <text x={886} y={120} textAnchor="middle" className="fill-[#a08a68]" fontSize={11} fontWeight={800} letterSpacing={3}>PRIVATE</text>

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

          <rect x={430} y={548} width={520} height={34} rx={10} fill="#e3d7bd" stroke="#c2b18c" strokeWidth={2} />
          <text x={690} y={570} textAnchor="middle" className="fill-[#8a755a]" fontSize={12} fontWeight={800} letterSpacing={3}>BAR</text>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle key={i} cx={466 + i * 66} cy={536} r={10} fill="#8a6a44" stroke="#6e5232" strokeWidth={1.5} />
          ))}

          <rect x={240} y={540} width={120} height={50} rx={8} fill="#e3d7bd" stroke="#c2b18c" strokeWidth={2} />
          <rect x={252} y={550} width={26} height={30} rx={3} fill="#b08c5c" />
          <text x={316} y={563} textAnchor="middle" className="fill-[#8a755a]" fontSize={10} fontWeight={800} letterSpacing={2}>HOST</text>
          <text x={316} y={576} textAnchor="middle" className="fill-[#8a755a]" fontSize={10} fontWeight={800} letterSpacing={2}>STAND</text>
          <Plant x={348} y={552} s={0.55} />

          <path d="M830 158 L975 158 L975 296 L830 296" fill="none" stroke="#3b352c" strokeWidth={7} />
          <path d="M830 330 L975 330 L975 480 L830 480" fill="none" stroke="#3b352c" strokeWidth={7} />
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
