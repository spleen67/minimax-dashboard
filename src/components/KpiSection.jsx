import {
  AlertTriangle,
  Clock,
  Flag,
  Hash,
  Layers,
  Settings2,
  ShieldAlert,
  Square,
  Trophy,
} from "lucide-react";
import {
  Card,
  MetricCard,
  SectionHeader,
  TeamBadge,
} from "./ui";
import { disciplineFormula, formatMatchMinute } from "../lib/analytics";

const WEIGHT_FIELDS = [
  { key: "penalty", label: "Pénalité" },
  { key: "whiteCard", label: "Carton blanc" },
  { key: "yellowCard", label: "Carton jaune" },
  { key: "redCard", label: "Carton rouge" },
  { key: "moderateSeries", label: "Alerte 4 fautes" },
  { key: "highSeries", label: "Alerte rouge 5+" },
];

function DisadvantageImpactTable({ analysis, match }) {
  const teams = [
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
  ];

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="font-bold text-slate-900">
          Impact de l’infériorité numérique
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Points marqués par l’adversaire pendant une suspension de
          l’équipe analysée. Un carton rouge est compté jusqu’à la fin
          du match.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Équipe</th>
              <th className="px-5 py-3 font-semibold">
                Cartons responsable
              </th>
              <th className="px-5 py-3 font-semibold">
                Scores pendant l’infériorité
              </th>
              <th className="px-5 py-3 font-semibold">
                Points encaissés
              </th>
              <th className="px-5 py-3 font-semibold">Détail</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => {
              const data =
                analysis.pointsConcededUnderDisadvantage?.[
                  team.key
                ] ?? {
                  points: 0,
                  scoreCount: 0,
                  cardCount: 0,
                  scores: [],
                };

              const details = data.scores.length
                ? data.scores
                    .map(
                      (score) =>
                        `${score.event.type} à ${formatMatchMinute(
                          score.event.time,
                        )} (+${score.points})`,
                    )
                    .join(" · ")
                : data.cardCount > 0
                  ? "Aucune marque adverse pendant l’infériorité"
                  : "Aucun carton enregistré";

              return (
                <tr
                  key={team.key}
                  className="align-top hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-900">
                    {data.cardCount}
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-900">
                    {data.scoreCount}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-black ${
                        data.points > 0
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}
                    >
                      {data.points}
                    </span>
                  </td>

                  <td className="max-w-[380px] px-5 py-4 text-xs leading-5 text-slate-500">
                    {details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function KpiSection({
  analysis,
  match,
  weights,
  onWeightChange,
}) {
  const homeCards =
    analysis.cardsByColor.white.HOME +
    analysis.cardsByColor.yellow.HOME +
    analysis.cardsByColor.red.HOME;

  const awayCards =
    analysis.cardsByColor.white.AWAY +
    analysis.cardsByColor.yellow.AWAY +
    analysis.cardsByColor.red.AWAY;

  const leader =
    analysis.discipline.mostSanctionedTeam === "HOME"
      ? match.homeTeamName
      : match.awayTeamName;

  return (
    <section id="kpi" className="app-content-section scroll-mt-28">
      <SectionHeader
        icon={Hash}
        eyebrow="Vue d'ensemble"
        title="Indicateurs clés du match"
        description="Lecture synthétique de la pression disciplinaire, de la distribution des sanctions et de l'évolution 
du score."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Flag}
          label="Pénalités domicile"
          value={analysis.penaltyTotals.HOME}
          helper={`${analysis.penaltyHalfTotals.HOME.first} en 1re, ${analysis.penaltyHalfTotals.HOME.second} en 2e`}
          accent="blue"
        />
        <MetricCard
          icon={Flag}
          label="Pénalités extérieur"
          value={analysis.penaltyTotals.AWAY}
          helper={`${analysis.penaltyHalfTotals.AWAY.first} en 1re, ${analysis.penaltyHalfTotals.AWAY.second} en 2e`}
          accent="slate"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Équipe la plus sanctionnée"
          value={leader}
          helper={`Indice : ${Math.max(
            analysis.discipline.teams.HOME.score,
            analysis.discipline.teams.AWAY.score,
          )} points`}
          accent="red"
        />
        <MetricCard
          icon={Layers}
          label="Fenêtres analysées"
          value={analysis.momentumSeries.length}
          helper="Fenêtres glissantes de 10 minutes"
          accent="amber"
        />
        <MetricCard
          icon={Square}
          label="Cartons domicile"
          value={homeCards}
          helper={`${analysis.cardsByColor.yellow.HOME} jaunes · ${analysis.cardsByColor.white.HOME} blancs · 
${analysis.cardsByColor.red.HOME} rouges`}
          accent="amber"
        />
        <MetricCard
          icon={Square}
          label="Cartons extérieur"
          value={awayCards}
          helper={`${analysis.cardsByColor.yellow.AWAY} jaunes · ${analysis.cardsByColor.white.AWAY} blancs · 
${analysis.cardsByColor.red.AWAY} rouges`}
          accent="slate"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Points encaissés en infériorité — domicile"
          value={
            analysis.pointsConcededUnderDisadvantage?.HOME?.points ?? 0
          }
          helper={`${
            analysis.pointsConcededUnderDisadvantage?.HOME
              ?.scoreCount ?? 0
          } score(s) reçu(s) pendant une exclusion`}
          accent="red"
        />

        <MetricCard
          icon={ShieldAlert}
          label="Points encaissés en infériorité — extérieur"
          value={
            analysis.pointsConcededUnderDisadvantage?.AWAY?.points ?? 0
          }
          helper={`${
            analysis.pointsConcededUnderDisadvantage?.AWAY
              ?.scoreCount ?? 0
          } score(s) reçu(s) pendant une exclusion`}
          accent="violet"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Faute la plus fréquente"
          value={analysis.mostFrequentFoul?.detail ?? "Aucune"}
          helper={
            analysis.mostFrequentFoul
              ? `${analysis.mostFrequentFoul.total} occurrence(s), ${analysis.mostFrequentFoul.share.toFixed(0)} %`
              : "Aucune pénalité détectée"
          }
          accent="amber"
        />
        <MetricCard
          icon={Clock}
          label="Période la plus indisciplinée"
          value={
            analysis.mostDisciplinedPeriod?.total
              ? analysis.mostDisciplinedPeriod.label
              : "—"
          }
          helper={
            analysis.mostDisciplinedPeriod?.total
              ? `${analysis.mostDisciplinedPeriod.total} pénalité(s)`
              : "Aucune activité"
          }
          accent="red"
        />
        <MetricCard
          icon={Trophy}
          label="Score final"
          value={`${analysis.scoreTotals.HOME} – ${analysis.scoreTotals.AWAY}`}
          helper={`Mi-temps : ${analysis.halfTimeScore.HOME} – ${analysis.halfTimeScore.AWAY}`}
          accent="emerald"
        />
        <MetricCard
          icon={Clock}
          label="Bornes du match"
          value={`${formatMatchMinute(analysis.boundaries.halfTime)} → ${formatMatchMinute(
            analysis.boundaries.fullTime,
          )}`}
          helper={
            analysis.boundaries.halfTimeSource === "event"
              ? "Mi-temps issue de Half Time"
              : "Mi-temps de secours : 40:00"
          }
          accent="violet"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Settings2 size={19} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Indice d'indiscipline
              </h3>
              <p className="text-xs text-slate-500">
                Pondérations configurables
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WEIGHT_FIELDS.map((field) => (
              <label
                key={field.key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span className="mb-2 block text-[11px] font-semibold text-slate-500">
                  {field.label}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={weights[field.key]}
                  onChange={(event) =>
                    onWeightChange(
                      field.key,
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-bold 
text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Formule active
            </p>
            <p className="mt-2 text-sm font-semibold leading-6">
              {disciplineFormula(weights)}
            </p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">
            Comparaison de l'indiscipline
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Le score est un indicateur comparatif non normalisé, utilisable
            pour comparer les deux équipes du même match.
          </p>

          <div className="mt-5 space-y-4">
            {[
              {
                team: "HOME",
                name: match.homeTeamName,
                color: match.homeTeamColor,
                data: analysis.discipline.teams.HOME,
              },
              {
                team: "AWAY",
                name: match.awayTeamName,
                color: match.awayTeamColor,
                data: analysis.discipline.teams.AWAY,
              },
            ].map((entry) => (
              <div
                key={entry.team}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <TeamBadge name={entry.name} color={entry.color} />
                  <strong className="text-2xl text-slate-950">
                    {entry.data.score}
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      pts
                    </span>
                  </strong>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (entry.data.score /
                          Math.max(
                            1,
                            analysis.discipline.teams.HOME.score,
                            analysis.discipline.teams.AWAY.score,
                          )) *
                          100,
                      )}%`,
                      backgroundColor: entry.color,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Base : {entry.data.base} points · Bonus momentum :{" "}
                  {entry.data.seriesBonus} points
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <DisadvantageImpactTable
        analysis={analysis}
        match={match}
      />

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="font-bold text-slate-900">
            Cartons par couleur et par équipe
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Couleur</th>
                <th className="px-5 py-3 font-semibold">
                  {match.homeTeamName}
                </th>
                <th className="px-5 py-3 font-semibold">
                  {match.awayTeamName}
                </th>
                <th className="px-5 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {["yellow", "white", "red"].map((color) => {
                const data = analysis.cardsByColor[color];
                const dot = {
                  yellow: "#eab308",
                  white: "#94a3b8",
                  red: "#ef4444",
                }[color];

                return (
                  <tr key={color}>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: dot }}
                        />
                        {data.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {data.HOME}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {data.AWAY}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {data.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
