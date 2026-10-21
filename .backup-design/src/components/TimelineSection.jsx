import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Filter,
  Flag,
  RotateCcw,
  Square,
  Trophy,
  ZoomIn,
} from "lucide-react";
import { Card, EmptyState, SectionHeader } from "./ui";
import {
  formatMatchMinute,
  isScoreEvent,
  isTimelineEvent,
  scorePoints,
  teamFor,
  typeKey,
} from "../lib/analytics";

const TYPE_FILTERS = [
  { key: "penalty", label: "Pénalités" },
  { key: "cards", label: "Cartons" },
  { key: "score", label: "Scores" },
];

function categoryOf(event) {
  if (typeKey(event.type) === "penalty conceded") return "penalty";
  if (typeKey(event.type) === "yellow card") return "yellow";
  if (typeKey(event.type) === "white card") return "white";
  if (typeKey(event.type) === "red card") return "red";
  if (isScoreEvent(event)) return "score";
  return null;
}

const CARD_CATEGORIES = new Set([
  "yellow",
  "white",
  "red",
]);

function timelineFilterCategory(event) {
  const category = categoryOf(event);

  return CARD_CATEGORIES.has(category) ? "cards" : category;
}

const CATEGORY_STYLE = {
  penalty: {
    label: "Pénalité",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  yellow: {
    label: "Carton jaune",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  white: {
    label: "Carton blanc",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  red: {
    label: "Carton rouge",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-200",
  },
  score: {
    label: "Score",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

function EventCard({ event, teamName, teamColor }) {
  const category = categoryOf(event);
  const style = CATEGORY_STYLE[category];
  const points = isScoreEvent(event) ? scorePoints(event) : null;

  return (
    <div
      className="w-full max-w-[285px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"
      style={{ borderLeftColor: teamColor, borderLeftWidth: 4 }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 
${style.badge}`}
        >
          {style.label}
        </span>
        <span className="max-w-[110px] truncate text-[11px] font-semibold text-slate-400">
          {teamName}
        </span>
      </div>
      <p className="text-sm font-bold leading-5 text-slate-900">
        {event.detail || event.type}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {event.type}
        {points ? ` · +${points} points` : ""}
      </p>
    </div>
  );
}


function TimelineMilestoneRow({ row }) {
  return (
    <div className="flex justify-center py-3">
      <div className="relative w-[370px] rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] 
border-white bg-blue-600 shadow" />

        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {row.label}
        </p>

        <p className="mt-1 font-semibold text-slate-800">
          {row.detail}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatMatchMinute(row.time)}
        </p>
      </div>
    </div>
  );
}

function TimelineEventRow({ row, match }) {
  const event = row.event;
  const category = categoryOf(event);
  const style = CATEGORY_STYLE[category];
  const team = teamFor(event, match);

  const teamName =
    team === "HOME"
      ? match.homeTeamName
      : team === "AWAY"
        ? match.awayTeamName
        : "Équipe non précisée";

  const teamColor =
    team === "HOME"
      ? match.homeTeamColor
      : team === "AWAY"
        ? match.awayTeamColor
        : "#94a3b8";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center gap-3 py-1.5">
      <div className="flex justify-end pr-1">
        {team === "HOME" ? (
          <EventCard
            event={event}
            teamName={teamName}
            teamColor={teamColor}
          />
        ) : null}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <span
          className={`h-3.5 w-3.5 rounded-full border-[3px] border-white shadow ${style.dot}`}
        />

        <span className="mt-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
          {formatMatchMinute(event.time)}
        </span>
      </div>

      <div className="flex justify-start pl-1">
        {team === "AWAY" || team === "UNKNOWN" ? (
          <EventCard
            event={event}
            teamName={teamName}
            teamColor={teamColor}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function TimelineSection({
  analysis,
  match,
  resetSignal,
}) {
  const fullTime = analysis.boundaries.fullTime;
  const halfTime = analysis.boundaries.halfTime;

  const [typeFilters, setTypeFilters] = useState({
      penalty: true,
      cards: true,
      score: true,
    });

  const [teamFilters, setTeamFilters] = useState({
    HOME: true,
    AWAY: true,
  });

  const [halfFilters, setHalfFilters] = useState({
    1: true,
    2: true,
  });

  const [zoom, setZoom] = useState("all");
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(fullTime);

  const activeTypeCount = Object.values(typeFilters).filter(
    Boolean,
  ).length;

  useEffect(() => {
    setTypeFilters({
      penalty: true,
      cards: true,
      score: true,
    });
    setTeamFilters({ HOME: true, AWAY: true });
    setHalfFilters({ 1: true, 2: true });
    setZoom("all");
    setCustomStart(0);
    setCustomEnd(fullTime);
  }, [resetSignal, fullTime]);

  function toggleFilter(setter, key) {
    setter((current) => ({ ...current, [key]: !current[key] }));
  }

  /**
   * Active ou désactive un type d'événement.
   *
   * Invariant : au moins un type doit rester sélectionné.
   * Le dernier filtre actif ne peut donc pas être désactivé.
   */
  function toggleTypeFilter(key) {
    setTypeFilters((current) => {
      const nextFilters = {
        ...current,
        [key]: !current[key],
      };

      const hasAtLeastOneType = Object.values(nextFilters).some(
        Boolean,
      );

      return hasAtLeastOneType ? nextFilters : current;
    });
  }

  const range = useMemo(() => {
    if (zoom === "first") return { start: 0, end: halfTime };
    if (zoom === "second") return { start: halfTime, end: fullTime };
    if (zoom === "last10")
      return { start: Math.max(0, fullTime - 10), end: fullTime };
    if (zoom === "custom")
      return {
        start: Math.min(customStart, customEnd),
        end: Math.max(customStart, customEnd),
      };

    return { start: 0, end: fullTime };
  }, [zoom, halfTime, fullTime, customStart, customEnd]);

  const visibleEvents = useMemo(
    () =>
      analysis.events.filter((event) => {
        if (!isTimelineEvent(event)) return false;

        const filterCategory = timelineFilterCategory(event);
        const team = teamFor(event, match);
        const period = event.time < halfTime ? 1 : 2;

        return (
          Boolean(typeFilters[filterCategory]) &&
          (team === "UNKNOWN" ||
            teamFilters[team]) &&
          halfFilters[period] &&
          event.time >= range.start &&
          event.time <= range.end
        );
      }),
    [
      analysis.events,
      match,
      typeFilters,
      teamFilters,
      halfFilters,
      halfTime,
      range.start,
      range.end,
    ],
  );

  function showPenaltiesAndCards() {
    setTypeFilters({
      penalty: true,
      cards: true,
      score: false,
    });
  }

const timelineRows = useMemo(() => {
    const milestones = [
      {
        kind: "milestone",
        key: "start",
        time: 0,
        milestoneType: "start",
        label: "Début du match",
        detail: "Coup d'envoi",
      },
      {
        kind: "milestone",
        key: "half-time",
        time: halfTime,
        milestoneType: "half-time",
        label: "Mi-temps",
        detail: `Score : ${analysis.halfTimeScore.HOME} – ${analysis.halfTimeScore.AWAY}`,
      },
      {
        kind: "milestone",
        key: "full-time",
        time: fullTime,
        milestoneType: "full-time",
        label: "Fin du match",
        detail: `Score final : ${analysis.scoreTotals.HOME} – ${analysis.scoreTotals.AWAY}`,
      },
    ].filter(
      (milestone) =>
        milestone.time >= range.start &&
        milestone.time <= range.end,
    );

    const eventRows = visibleEvents.map((event) => ({
      kind: "event",
      key: `event-${event.order}`,
      time: event.time,
      event,
    }));

    /*
     * Ordre à la minute identique :
     * - le coup d'envoi précède un événement à 0e ;
     * - la mi-temps précède un événement located exactement à la mi-temps ;
     * - la fin du match suit un événement located exactement à la fin.
     */
    const boundaryOrder = {
      start: 0,
      "half-time": 1,
      "full-time": 3,
    };

    return [...milestones, ...eventRows].sort((first, second) => {
      if (first.time !== second.time) {
        return first.time - second.time;
      }

      const firstOrder =
        first.kind === "event"
          ? 2
          : (boundaryOrder[first.milestoneType] ?? 2);

      const secondOrder =
        second.kind === "event"
          ? 2
          : (boundaryOrder[second.milestoneType] ?? 2);

      return firstOrder - secondOrder;
    });
  }, [
    visibleEvents,
    range.start,
    range.end,
    halfTime,
    fullTime,
    analysis.halfTimeScore.HOME,
    analysis.halfTimeScore.AWAY,
    analysis.scoreTotals.HOME,
    analysis.scoreTotals.AWAY,
  ]);

  return (
    <section id="timeline" className="scroll-mt-28">
      <SectionHeader
        icon={Clock}
        eyebrow="Chronologie"
        title="Timeline interactive du match"
        description="Équipe domicile à gauche, équipe extérieure à droite et axe temporel central. Tous les filtres sont 
combinables."
        action={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setTypeFilters({
      penalty: true,
      cards: true,
      score: true,
    });
              setTeamFilters({ HOME: true, AWAY: true });
              setHalfFilters({ 1: true, 2: true });
              setZoom("all");
              setCustomStart(0);
              setCustomEnd(fullTime);
            }}
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Filter size={14} />
                  Équipe
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      key: "HOME",
                      name: match.homeTeamName,
                      color: match.homeTeamColor,
                    },
                    {
                      key: "AWAY",
                      name: match.awayTeamName,
                      color: match.awayTeamColor,
                    },
                  ].map((team) => (
                    <button
                      type="button"
                      key={team.key}
                      onClick={() =>
                        toggleFilter(setTeamFilters, team.key)
                      }
                      className={`chip ${
                        teamFilters[team.key] ? "chip-active" : ""
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mi-temps
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2].map((period) => (
                    <button
                      type="button"
                      key={period}
                      onClick={() =>
                        toggleFilter(setHalfFilters, period)
                      }
                      className={`chip ${
                        halfFilters[period] ? "chip-active" : ""
                      }`}
                    >
                      {period === 1 ? "1re mi-temps" : "2e mi-temps"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Types d'événements
                    </span>
                    {activeTypeCount === 1 ? (
                      <p className="mt-1 text-[10px] font-medium text-amber-600">
                        Au moins un type doit rester sélectionné.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={showPenaltiesAndCards}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Pénalités + cartons
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TYPE_FILTERS.map((filter) => (
                    <button
                      type="button"
                      key={filter.key}
                      aria-pressed={typeFilters[filter.key]}
                      onClick={() =>
                        toggleTypeFilter(filter.key)
                      }
                      className={`chip ${
                        typeFilters[filter.key] ? "chip-active" : ""
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-w-[285px] rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ZoomIn size={14} />
                Zoom temporel
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Tout" },
                  { key: "first", label: "1re mi-temps" },
                  { key: "second", label: "2e mi-temps" },
                  { key: "last10", label: "10 dernières min" },
                  { key: "custom", label: "Personnalisé" },
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.key}
                    onClick={() => setZoom(preset.key)}
                    className={`chip ${
                      zoom === preset.key ? "chip-active" : ""
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {zoom === "custom" ? (
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  <label className="block text-xs font-semibold text-slate-600">
                    Début : {formatMatchMinute(customStart)}
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, fullTime)}
                      step="0.5"
                      value={customStart}
                      onChange={(event) =>
                        setCustomStart(Number(event.target.value))
                      }
                      className="mt-2 w-full"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Fin : {formatMatchMinute(customEnd)}
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, fullTime)}
                      step="0.5"
                      value={customEnd}
                      onChange={(event) =>
                        setCustomEnd(Number(event.target.value))
                      }
                      className="mt-2 w-full"
                    />
                  </label>
                </div>
              ) : null}

              <p className="mt-3 text-xs text-slate-500">
                Plage visible : {formatMatchMinute(range.start)} –{" "}
                {formatMatchMinute(range.end)}
              </p>
            </div>
          </div>
        </div>

        {visibleEvents.length === 0 && milestones.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Clock}
              title="Aucun événement dans cette vue"
              description="Modifiez les filtres ou la plage temporelle pour afficher davantage d'événements."
            />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <div className="relative min-w-[820px] px-4 py-5 sm:px-8">
              <div className="absolute bottom-5 left-1/2 top-5 w-px bg-slate-200" />

              <div className="relative z-10 space-y-2">
                {timelineRows.map((row) => {
                  if (row.kind === "milestone") {
                    return (
                      <TimelineMilestoneRow
                        key={row.key}
                        row={row}
                      />
                    );
                  }

                  return (
                    <TimelineEventRow
                      key={row.key}
                      row={row}
                      match={match}
                    />
                  );
                })}              </div>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
