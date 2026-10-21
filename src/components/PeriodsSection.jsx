import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3 } from "lucide-react";
import {
  Card,
  ChartTooltip,
  SectionHeader,
} from "./ui";

function PenaltyBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload = {},
  fill,
  teamKey,
}) {
  const markers = payload[`${teamKey}Cards`] ?? [];
  const center = x + width / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(0, height)}
        rx={6}
        fill={fill}
      />

      {markers.slice(0, 5).map((marker, index) => {
        const offset =
          (index - (Math.min(markers.length, 5) - 1) / 2) * 11;

        return (
          <circle
            key={marker.event.order}
            cx={center + offset}
            cy={Math.max(5, y - 9)}
            r={4.5}
            fill={marker.color}
            stroke="#ffffff"
            strokeWidth={1.5}
          >
            <title>{marker.event.type}</title>
          </circle>
        );
      })}
    </g>
  );
}

function CardLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        Carton jaune
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
        Carton blanc
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        Carton rouge
      </span>
    </div>
  );
}

export default function PeriodsSection({ analysis, match }) {
  const halfIndex = Math.min(
    analysis.periods.length - 1,
    Math.max(0, Math.floor(analysis.boundaries.halfTime / 10)),
  );

  const halfLabel = analysis.periods[halfIndex]?.label;

  return (
    <section id="periods" className="app-content-section scroll-mt-28">
      <SectionHeader
        icon={BarChart3}
        eyebrow="Pression dans le temps"
        title="Pénalités par période de 10 minutes"
        description="Comparaison des volumes par équipe, signalement des cartons et évolution du cumul de penalties."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">
            Histogramme par équipe
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Les points colorés au-dessus des barres signalent les cartons.
          </p>

          <div className="mt-5 h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.periods}
                margin={{ top: 28, right: 8, left: -20, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(value, name) =>
                        `${value} pénalité(s) · ${
                          name === "homePenalties"
                            ? "Domicile"
                            : "Extérieur"
                        }`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="homePenalties"
                  name="Domicile"
                  fill={match.homeTeamColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={25}
                  shape={<PenaltyBar teamKey="home" />}
                />
                <Bar
                  dataKey="awayPenalties"
                  name="Extérieur"
                  fill={match.awayTeamColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={25}
                  shape={<PenaltyBar teamKey="away" />}
                />
                {halfLabel ? (
                  <ReferenceLine
                    x={halfLabel}
                    stroke="#ef4444"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                    label={{
                      value: "Mi-temps",
                      fill: "#ef4444",
                      fontSize: 11,
                      fontWeight: 700,
                      position: "insideTopRight",
                    }}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <CardLegend />
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">
            Comparaison du cumul
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nombre total de pénalités accumulées depuis le coup d'envoi.
          </p>

          <div className="mt-5 h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analysis.cumulativePeriods}
                margin={{ top: 12, right: 12, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(value) => `${value} cumulées`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeHome"
                  name="Domicile"
                  stroke={match.homeTeamColor}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeAway"
                  name="Extérieur"
                  stroke={match.awayTeamColor}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900">
            <div className="flex items-start gap-3">
              <Activity className="mt-1 shrink-0 text-blue-600" size={18} />
              <p>
                Une rupture brutale de la courbe peut signaler une phase de
                jeu particulièrement disputée ou un momentum disciplinaire.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
