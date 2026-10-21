from pathlib import Path

path = Path("src/components/TimelineSection.jsx")
source = path.read_text(encoding="utf-8")

# Le projet utilise formatMatchMinute. On conserve une compatibilité
# avec l'ancien nom au cas où.
if "formatMatchMinute" in source:
    formatter = "formatMatchMinute"
elif "formatTime" in source:
    formatter = "formatTime"
else:
    raise SystemExit("Aucune fonction de formatage temporel trouvée.")

# Composants internes dédiés aux deux types de lignes.
helpers = r'''
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
          {__FORMATTER__(row.time)}
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
          {__FORMATTER__(event.time)}
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
'''.replace("__FORMATTER__", formatter)

if "function TimelineMilestoneRow" not in source:
    source = source.replace(
        "export default function TimelineSection",
        helpers + "\nexport default function TimelineSection",
        1,
    )

# Remplace la déclaration des anciens milestones par une liste unique
# contenant à la fois les repères et les événements.
rows_start = source.find("  const milestones = [")

if rows_start != -1:
    rows_end = source.find("\n\n  return (", rows_start)

    if rows_end == -1:
        raise SystemExit(
            "Impossible de localiser la fin de la déclaration milestones."
        )

    timeline_rows = r'''
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
'''.strip()

    source = source[:rows_start] + timeline_rows + source[rows_end:]

# Remplace les deux anciens groupes de rendu par le rendu trié unique.
render_start = source.find(
    "                {milestones.map((milestone) => ("
)

if render_start != -1:
    render_end_marker = "              </div>\n            </div>\n          </div>"
    render_end = source.find(render_end_marker, render_start)

    if render_end == -1:
        raise SystemExit(
            "Impossible de localiser la fin du rendu de la timeline."
        )

    new_render = r'''                {timelineRows.map((row) => {
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
                })}
'''.rstrip()

    source = (
        source[:render_start]
        + new_render
        + source[render_end:]
    )

path.write_text(source, encoding="utf-8")
print("✓ Timeline corrigée : événements et repères sont maintenant fusionnés et triés chronologiquement.")