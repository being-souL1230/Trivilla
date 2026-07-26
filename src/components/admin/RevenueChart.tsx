"use client";
import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { inr } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type WeekPoint = { label: string; date: string; sales: number };

type RevenueChartProps = {
  week: WeekPoint[];
  revenueDeltaPct?: number;
};

/* soft glow behind the stroke — gives the line an elevated, premium feel */
const lineGlowPlugin: Plugin<"line"> = {
  id: "lineGlow",
  beforeDatasetsDraw(chart) {
    chart.ctx.save();
    chart.ctx.shadowColor = "rgba(249, 115, 22, 0.35)";
    chart.ctx.shadowBlur = 12;
    chart.ctx.shadowOffsetY = 6;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  },
};

/* crisp dashed crosshair on hover, instead of the default single dot */
const crosshairPlugin: Plugin<"line"> = {
  id: "crosshair",
  afterDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.();
    if (!active || !active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(15, 47, 87, 0.16)";
    ctx.stroke();
    ctx.restore();
  },
};

export default function RevenueChart({ week, revenueDeltaPct }: RevenueChartProps) {
  const total = useMemo(() => week.reduce((s, w) => s + w.sales, 0), [week]);

  const chartData = {
    labels: week.map((w) => w.label),
    datasets: [
      {
        data: week.map((w) => w.sales),
        borderColor: "#f97316",
        backgroundColor: (context: any) => {
          const { ctx } = context.chart;
          const gradient = ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, "rgba(249, 115, 22, 0.28)");
          gradient.addColorStop(0.55, "rgba(249, 115, 22, 0.08)");
          gradient.addColorStop(1, "rgba(249, 115, 22, 0)");
          return gradient;
        },
        borderWidth: 2.5,
        borderCapStyle: "round" as const,
        borderJoinStyle: "round" as const,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 18,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#f97316",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const chartOpts: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 14, right: 4 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0e2f57",
        padding: 12,
        cornerRadius: 10,
        caretSize: 6,
        displayColors: false,
        titleFont: { family: "Manrope", weight: 600, size: 11 },
        titleColor: "rgba(255,255,255,0.65)",
        bodyFont: { family: "Manrope", weight: "bold", size: 13.5 },
        bodyColor: "#fff",
        callbacks: {
          title: (items) => week[items[0].dataIndex]?.date ?? items[0].label,
          label: (c) => ` ${inr(Number(c.raw))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#94a3b8", font: { family: "Manrope", weight: 600, size: 11 } },
      },
      y: {
        grid: { color: "#eef2f8", drawTicks: false, tickBorderDash: [4, 4] as any },
        border: { display: false },
        ticks: {
          color: "#a8b4c6",
          padding: 8,
          font: { family: "Manrope", size: 11 },
          callback: (v) => `₹${Number(v) >= 1000 ? `${Number(v) / 1000}K` : v}`,
        },
      },
    },
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-[#0e2f57]">Revenue Overview</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-[#94a3b8]">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-extrabold leading-none tracking-tight text-[#0e2f57]">{inr(total)}</p>
          {typeof revenueDeltaPct === "number" && (
            <span className={`mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-extrabold ${revenueDeltaPct >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
              <svg width="9" height="9" viewBox="0 0 10 10" className={revenueDeltaPct >= 0 ? "" : "rotate-180"}>
                <path d="M5 1l4 6H1l4-6z" fill="currentColor" />
              </svg>
              {Math.abs(revenueDeltaPct)}% vs last week
            </span>
          )}
        </div>
      </div>
      <div className="h-56 px-4 pb-5">
        <Line data={chartData} options={chartOpts} plugins={[lineGlowPlugin, crosshairPlugin]} />
      </div>
    </>
  );
}
