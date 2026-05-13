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
import type { SourceStat } from "@/lib/types";

const SOURCE_COLORS: Record<string, string> = {
  bubilet: "#a855f7",
  biletzero: "#0ea5e9",
};

function labelSource(id: string): string {
  if (id === "bubilet") return "Bubilet";
  if (id === "biletzero") return "Biletzero";
  return id;
}

export function SourceChart({ data }: { data: SourceStat[] }) {
  const chartData = data.map((d) => ({
    name: labelSource(d.sourceId),
    count: d.count,
    fill: SOURCE_COLORS[d.sourceId] ?? "#71717a",
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
          tick={{ fontSize: 11, fill: "#71717a" }}
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
