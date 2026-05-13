"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryStat } from "@/lib/types";

const COLORS = [
  "#a855f7", // purple-500
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
];

export function CategoryChart({ data }: { data: CategoryStat[] }) {
  const chartData = data.map((d, i) => ({
    name: d.category ?? "Kategorisiz",
    count: d.count,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 16, bottom: 28, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="name"
          angle={-22}
          textAnchor="end"
          tick={{ fontSize: 11, fill: "#71717a" }}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#71717a" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            backgroundColor: "white",
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
