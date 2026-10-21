import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flag,
  ShieldAlert,
  TimerReset,
} from "lucide-react";
import {
  Card,
  EmptyState,
  SectionHeader,
  TeamBadge,
} from "./ui";
import { formatMatchMinute } from "../lib/analytics";

const STATUS = {
  observation: {
    label: "Observation",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    color: "#3b82f6",
    icon: Flag,
    description:
      "Trois pénalités sans carton dans la fenêtre : situation à surveiller.",
  },
  warning: {
    label: "Alerte",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    color: "#f59e0b",
    icon: AlertTriangle,
    description:
      "Quatre pénalités sans carton en moins de dix minutes : un carton était probablement attendu.",
  },
  red: {
    label: "Alerte rouge",
    badge: "bg-red-50 text-red-700 ring-red-200",
    color: "#ef4444",
    icon: ShieldAlert,
    description:
      "Cinq pénalités ou plus sans carton en moins de dix minutes : point de vigilance prioritaire.",
  },
  managed: {
    label: "Prise en charge",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    color: "#10b981",
    icon: CheckCircle2,
    description:
      "Un carton de cette équipe est intervenu dans la fenêtre : la situation a été prise en charge.",
  },
};

const SUMMARY_ORDER = [
  "warning",
  "red",
  "observation",
  "managed",
];

export default function MomentumSection({ analysis, match }) {
  const counts = Object.fromEntries(
    Object.keys(STATUS).map((key) => [
      key,
      analysis.momentumSeries.filter(
        (series) => series.severity === key,
      ).length,
    ]),
  );

  return (
    <section id="momentum" className="app-content-section scroll-mt-28">
      <SectionHeader
        icon={Activity}
        eyebrow="Vigilance de l'arbitre"
        title="Séries de pénalités et alertes"
        description="Analyse des concentrations de fautes dans une fenêtre glissante de dix minutes, avec détection d'un 
carton de la même équipe dans cette fenêtre."
      />

      {analysis.momentumSeries.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={Activity}
            title="Aucune fenêtre à analyser"
            description="Aucune équipe ne concède au moins trois pénalités dans une fenêtre de dix minutes."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SUMMARY_ORDER.map((key) => {
              const status = STATUS[key];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={key}
                  className="flex items-center gap-4 p-4"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: status.color }}
                  >
                    <StatusIcon size={19} />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-slate-950">
                      {counts[key]}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {status.label}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {analysis.momentumSeries.map((series) => {
              const status = STATUS[series.severity] ?? STATUS.observation;
              const StatusIcon = status.icon;

              const isHome = series.team === "HOME";
              const teamName = isHome
                ? match.homeTeamName
                : match.awayTeamName;
              const teamColor = isHome
                ? match.homeTeamColor
                : match.awayTeamColor;

              const cardDetails = (series.cards ?? [])
                .map(
                  (card) =>
                    `${card.type} à ${formatMatchMinute(card.time)}`,
                )
                .join(" · ");

              return (
                <Card
                  key={series.id}
                  className="overflow-hidden border-l-4 p-5 sm:p-6"
                  style={{ borderLeftColor: status.color }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: teamColor }}
                      >
                        <StatusIcon size={19} />
                      </div>

                      <div className="min-w-0">
                        <TeamBadge
                          name={teamName}
                          color={teamColor}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Pénalités de{" "}
                          {formatMatchMinute(series.startTime)} à{" "}
                          {formatMatchMinute(series.endTime)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${status.badge}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pénalités
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-950">
                        {series.count}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Fenêtre
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {formatMatchMinute(series.windowStart)}–
                        {formatMatchMinute(series.windowEnd)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Carton
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {series.hasCard ? "Oui" : "Non"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <TimerReset
                        className="mt-0.5 shrink-0 text-slate-400"
                        size={16}
                      />

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Carton dans la fenêtre
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                          {series.hasCard
                            ? cardDetails
                            : "Aucun carton de cette équipe"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        Concentration sur 10 minutes
                      </span>
                      <span className="font-bold text-slate-800">
                        {series.count} / 5
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (series.count / 5) * 100,
                          )}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="mt-4 rounded-xl border p-3 text-xs leading-5"
                    style={{
                      borderColor: `${status.color}55`,
                      backgroundColor: `${status.color}0D`,
                      color: "#334155",
                    }}
                  >
                    {status.description}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-blue-900">
            <p>
              Seuls les cartons de l'équipe analysée sont pris en compte.
              Une fenêtre contenant un carton n'est pas une alerte, mais elle
              reste affichée afin de montrer que la situation a été traitée.
              Un carton sépare également les séquences : une nouvelle
              accumulation après le carton peut ainsi être détectée.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
