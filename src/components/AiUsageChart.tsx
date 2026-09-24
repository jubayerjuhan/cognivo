"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { day: string; date: string; calls: number };

export function AiUsageChart({ data }: { data: Point[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(v: number) => [v, "AI calls"]}
            labelFormatter={(_, p) => (p?.[0]?.payload as Point | undefined)?.date ?? ""}
          />
          <Bar dataKey="calls" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
