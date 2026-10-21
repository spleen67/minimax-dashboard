import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Minus,
  Plus,
  TimerReset,
} from "lucide-react";
import { Card, EmptyState, SectionHeader } from "./ui";
import { formatMatchMinute } from "../lib/analytics";

const OUTCOMES = {
  "-": {
    label: "Advantage-",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Minus,
  },
  "+": {
    label: "Advantage+",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: Plus,
  },
  "++": {
    label: "Advantage++",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
};

export default function AdvantagesSection({ analysis, match }) {
  const totals = analysis.advantageTotals;

  return (
    <section id="advantages" className="app-content-section scroll-mt-28">
      <SectionHeader
        icon={Eye}
        eyebrow="Lecture arbitrale"
        title="Analyse des avantages"
        description="Pour chaque avantage, l'événement immédiatement suivant est analysé afin de déterminer s'il a été 
court, prolongé ou converti en score."
      />

      {analysis.advantageResults.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={Eye}
            title="Aucun avantage détecté"
            description="Ce match ne contient aucun événement de type « Advantage »."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Total avantages",
                value: totals.total,
                helper: `${totals.firstHalf} en 1re mi-temps`,
                icon: Eye,
              },
              {
                label: "1re mi-temps",
                value: totals.firstHalf,
                helper: "Avant la pause",
                icon: Clock,
              },
              {
                label: "2e mi-temps",
                value: totals.secondHalf,
                helper: "Après la pause",
                icon: TimerReset,
              },
              {
                label: "Advantage-",
                value: totals.minus,
                helper: "Événement suivant sous 45 s",
                icon: Minus,
              },
              {
                label: "Advantage+ / ++",
                value: totals.plus + totals.plusPlus,
                helper: `${totals.plus} prolongés · ${totals.plusPlus} convertis`,
                icon: Plus,
              },
            ].map((item) => (
              <Card key={item.label} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
                  </div>
                  <item.icon className="text-blue-500" size={20} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.helper}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h3 className="font-bold text-slate-900">Détail des avantages</h3>
              <p className="mt-1 text-xs text-slate-500">
                L'événement suivant peut être de tout type, y compris un type inconnu.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Minute</th>
                    <th className="px-5 py-3 font-semibold">Équipe</th>
                    <th className="px-5 py-3 font-semibold">Mi-temps</th>
                    <th className="px-5 py-3 font-semibold">Résultat</th>
                    <th className="px-5 py-3 font-semibold">Événement suivant</th>
                    <th className="px-5 py-3 font-semibold">Écart</th>
                    <th className="px-5 py-3 font-semibold">Analyse</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analysis.advantageResults.map((result) => {
                    const outcome = OUTCOMES[result.category];
                    const Icon = outcome.icon;
                    const teamName =
                      result.team === "HOME"
                        ? match.homeTeamName
                        : result.team === "AWAY"
                          ? match.awayTeamName
                          : "Non précisée";

                    return (
                      <tr
                        key={result.event.order}
                        className="align-top hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                          {formatMatchMinute(result.event.time)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {teamName}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {result.period === 1 ? "1re" : "2e"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold 
ring-1 ${outcome.badge}`}
                          >
                            <Icon size={13} />
                            {outcome.label}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-5 py-4">
                          {result.nextEvent ? (
                            <div>
                              <p className="font-semibold text-slate-800">
                                {result.nextEvent.type}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {result.nextEvent.detail || "—"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">Aucun</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                          {result.deltaSeconds !== null
                            ? `${result.deltaSeconds} s`
                            : "—"}
                        </td>
                        <td className="max-w-[280px] px-5 py-4 text-xs leading-5 text-slate-500">
                          {result.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-blue-900">
            <div className="flex items-start gap-3">
              <ArrowRight className="mt-1 shrink-0 text-blue-600" size={18} />
              <p>
                Un score suivant est toujours classé <strong>Advantage++</strong>,
                même s'il intervient au-delà de 45 secondes. Dans les autres cas,
                la limite de 45 secondes est inclusive.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
