import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon, Table } from "lucide-react";
import { Card, EmptyState, SectionHeader } from "./ui";

const CHART_COLORS = [
  "#2563eb",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#64748b",
  "#84cc16",
  "#f97316",
];

function PenaltyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xl">
      <p className="max-w-[220px] text-xs font-bold text-slate-800">
        {row.detail}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {row.total} pénalité(s) · {row.share.toFixed(1)} %
      </p>
    </div>
  );
}

export default function PenaltiesSection({ analysis }) {
  const pieData = analysis.penaltyTypes.map((row, index) => ({
    ...row,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <section id="penalties" className="app-content-section scroll-mt-28">
      <SectionHeader
        icon={PieChartIcon}
        eyebrow="Discipline"
        title="Pénalités concédées"
        description="Répartition par type de faute, équipe et mi-temps, avec vision synthétique de la fréquence des 
infractions."
      />

      {analysis.penalties.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={PieChartIcon}
            title="Aucune pénalité détectée"
            description="Ce match ne contient aucun événement de type « Penalty Conceded » exploitable."
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-slate-900">Types de fautes</h3>
            <p className="mt-1 text-sm text-slate-500">
              Part de chaque type dans le total des pénalités.
            </p>

            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="detail"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={108}
                    paddingAngle={2}
                    label={({ percent }) =>
                      `${Math.round((percent ?? 0) * 100)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.detail}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PenaltyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {pieData.map((entry) => (
                <div
                  key={entry.detail}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-xs font-semibold text-slate-700">
                      {entry.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-slate-900">
                    {entry.total} · {entry.share.toFixed(0)} %
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-bold text-slate-900">
                  Matrice des pénalités
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Première et seconde mi-temps, puis cumul par équipe.
                </p>
              </div>
              <Table className="hidden text-slate-400 sm:block" size={19} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Type de faute</th>
                    <th className="px-4 py-3 text-center font-semibold">Dom. 1re</th>
                    <th className="px-4 py-3 text-center font-semibold">Dom. 2e</th>
                    <th className="px-4 py-3 text-center font-semibold">Dom. total</th>
                    <th className="px-4 py-3 text-center font-semibold">Ext. 1re</th>
                    <th className="px-4 py-3 text-center font-semibold">Ext. 2e</th>
                    <th className="px-4 py-3 text-center font-semibold">Ext. total</th>
                    <th className="px-4 py-3 text-center font-semibold">Total</th>
                    <th className="px-5 py-3 text-center font-semibold">Part</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analysis.penaltyTypes.map((row) => (
                    <tr key={row.detail} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.detail}
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600">{row.HOME.first}</td>
                      <td className="px-4 py-4 text-center text-slate-600">{row.HOME.second}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">{row.HOME.total}</td>
                      <td className="px-4 py-4 text-center text-slate-600">{row.AWAY.first}</td>
                      <td className="px-4 py-4 text-center text-slate-600">{row.AWAY.second}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">{row.AWAY.total}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">{row.total}</td>
                      <td className="px-5 py-4 text-center text-slate-500">
                        {row.share.toFixed(1)} %
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td className="px-5 py-4">Total match</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyHalfTotals.HOME.first}</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyHalfTotals.HOME.second}</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyTotals.HOME}</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyHalfTotals.AWAY.first}</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyHalfTotals.AWAY.second}</td>
                    <td className="px-4 py-4 text-center">{analysis.penaltyTotals.AWAY}</td>
                    <td className="px-4 py-4 text-center">{analysis.penalties.length}</td>
                    <td className="px-5 py-4 text-center">100 %</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Sous-totaux par période
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "1re mi-temps",
                    home: analysis.penaltyHalfTotals.HOME.first,
                    away: analysis.penaltyHalfTotals.AWAY.first,
                  },
                  {
                    label: "2e mi-temps",
                    home: analysis.penaltyHalfTotals.HOME.second,
                    away: analysis.penaltyHalfTotals.AWAY.second,
                  },
                  {
                    label: "Total match",
                    home: analysis.penaltyTotals.HOME,
                    away: analysis.penaltyTotals.AWAY,
                  },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">{row.label}</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {row.home} + {row.away}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {row.home} domicile · {row.away} extérieur
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
