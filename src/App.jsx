import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  FileDown,
  FileUp,
  History,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import DataImportPanel from "./components/DataImportPanel";
import MatchHistoryPanel from "./components/MatchHistoryPanel";
import KpiSection from "./components/KpiSection";
import PenaltiesSection from "./components/PenaltiesSection";
import PeriodsSection from "./components/PeriodsSection";
import TimelineSection from "./components/TimelineSection";
import MomentumSection from "./components/MomentumSection";
import AdvantagesSection from "./components/AdvantagesSection";
import PdfReport from "./components/PdfReport";
import { analyzeMatch } from "./lib/analytics";
import { parseMatchJson } from "./lib/parser";
import {
  countSavedMatches,
  saveMatchToHistory,
} from "./lib/matchStorage";
import { exportMatchToPdf } from "./lib/pdfExport";
import { DEFAULT_WEIGHTS } from "./lib/constants";
import { demoMatch } from "./data/demoMatch";

const parsedDemo = parseMatchJson(JSON.stringify(demoMatch));

const initialMatch = parsedDemo.ok
  ? parsedDemo.match
  : {
      events: [],
      homeTeamName: "Chartres",
      awayTeamName: "Le Rheu",
      homeTeamColor: "#3b82f6",
      awayTeamColor: "#64748b",
      yellowCardDuration: 10,
      whiteCardDuration: 10,
      matchDate: "",
      refereeName: "",
      matchLevel: "",
    };

function formatMatchDate(value) {
  if (!value) return "Date non communiquée";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const NAVIGATION = [
  ["#kpi", "KPI"],
  ["#penalties", "Pénalités"],
  ["#periods", "Périodes"],
  ["#timeline", "Timeline"],
  ["#momentum", "Momentum"],
  ["#advantages", "Avantages"],
];

export default function App() {
  const [match, setMatch] = useState(initialMatch);
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [notice, setNotice] = useState(null);


  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [currentRawJson, setCurrentRawJson] = useState(() =>
    JSON.stringify(demoMatch, null, 2),
  );
  const [autoSaveImports, setAutoSaveImports] = useState(() => {
    try {
      return (
        globalThis.localStorage?.getItem(
          "rugby-discipline:auto-save-imports",
        ) !== "false"
      );
    } catch {
      return true;
    }
  });

  const shouldAutoSaveRef = useRef(false);

  const reportRef = useRef(null);

  const analysis = useMemo(
    () => analyzeMatch(match, weights),
    [match, weights],
  );

  useEffect(() => {
    document.title = `Rugby Discipline — ${match.homeTeamName} vs ${match.awayTeamName}`;
  }, [match.homeTeamName, match.awayTeamName]);

  // Synchronise le compteur affiché dans le header.
  useEffect(() => {
    void refreshHistoryCount();
  }, []);

  /*
   * Enregistrement automatique des nouveaux imports.
   *
   * Le JSON original est conservé tel quel, afin de préserver notamment
   * son unité de temps et ses métadonnées.
   */
  useEffect(() => {
    if (
      !autoSaveImports ||
      !shouldAutoSaveRef.current ||
      !currentRawJson
    ) {
      return;
    }

    let cancelled = false;

    saveMatchToHistory({
      rawJson: currentRawJson,
      currentMatch: match,
      currentSummary: {
        penalties: analysis.penalties.length,
        cards: analysis.cards.length,
        homeScore: analysis.scoreTotals.HOME,
        awayScore: analysis.scoreTotals.AWAY,
      },
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        void refreshHistoryCount();

        if (!result.duplicate) {
          showNotice("Le match a été ajouté à l’historique.");
        }
      })
      .catch((storageError) => {
        if (!cancelled) {
          showNotice(
            storageError instanceof Error
              ? storageError.message
              : "Impossible d’enregistrer le match dans l’historique.",
            "warning",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [match, currentRawJson, autoSaveImports]);

  function showNotice(message, type = "success") {
    setNotice({ message, type });

    window.setTimeout(() => {
      setNotice(null);
    }, 4500);
  }

  async function refreshHistoryCount() {
    try {
      const count = await countSavedMatches();
      setHistoryCount(count);
    } catch {
      setHistoryCount(0);
    }
  }

  function handleAutoSaveImportsChange(value) {
    setAutoSaveImports(value);

    try {
      globalThis.localStorage?.setItem(
        "rugby-discipline:auto-save-imports",
        String(value),
      );
    } catch {
      // Le réglage reste valable pour la session courante.
    }
  }

  function handleHistoryAnalyze(record) {
    const parsedResult = parseMatchJson(record.rawJson);

    if (!parsedResult.ok) {
      showNotice(
        parsedResult.errors[0] ??
          "Le JSON enregistré ne peut pas être analysé.",
        "error",
      );
      return;
    }

    setMatch(parsedResult.match);
    setCurrentRawJson(record.rawJson);
    shouldAutoSaveRef.current = false;
    setResetSignal((current) => current + 1);
    setHistoryOpen(false);

    showNotice(
      `Analyse de « ${record.label} » chargée.`,
    );
  }

  function handleLoad(nextMatch, warnings = [], rawJson) {
    setMatch(nextMatch);

    if (typeof rawJson === "string") {
      setCurrentRawJson(rawJson);
    }

    shouldAutoSaveRef.current = true;
    setResetSignal((current) => current + 1);

    if (warnings.length > 0) {
      showNotice(
        `Match chargé avec ${warnings.length} avertissement(s).`,
        "warning",
      );
    } else {
      showNotice("Les nouvelles données ont été analysées.");
    }
  }

  function handleWeightChange(key, value) {
    setWeights((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetView() {
    setResetSignal((current) => current + 1);
    showNotice("Les filtres et le zoom de la timeline ont été réinitialisés.");
  }

  async function handleExport() {
    if (!reportRef.current || exporting) return;

    setExporting(true);

    try {
      await exportMatchToPdf(reportRef.current, {
        homeTeamName: match.homeTeamName,
        awayTeamName: match.awayTeamName,
        matchDate: match.matchDate,
      });

      showNotice("Le rapport PDF a été généré.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Impossible de générer le PDF.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 text-white shadow-lg 
backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 
lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br 
from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <ShieldCheck size={21} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight sm:text-base">
                Rugby Discipline
              </span>
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Analyse arbitrale & disciplinaire
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 xl:flex">
            {NAVIGATION.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 
hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetView}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold 
text-slate-200 transition hover:bg-white/10 sm:inline-flex"
              title="Réinitialiser les filtres de la vue"
            >
              <RotateCcw size={16} />
              <span className="hidden lg:inline">Réinitialiser</span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="app-header-action inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 
px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              title="Ouvrir l’historique des matchs"
            >
              <History size={16} />
              <span className="hidden sm:inline">Historique</span>
              {historyCount > 0 ? (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 
text-[10px] font-black text-white">
                  {historyCount > 99 ? "99+" : historyCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm 
font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <FileUp size={16} />
              <span className="hidden sm:inline">Importer</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold 
text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <Activity className="animate-pulse" size={16} />
              ) : (
                <FileDown size={16} />
              )}
              <span className="hidden sm:inline">
                {exporting ? "Génération…" : "Export PDF"}
              </span>
            </button>
          </div>
        </div>

        <nav className="app-mobile-nav scrollbar-thin flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 xl:hidden">
          {NAVIGATION.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-400 
hover:bg-white/10 hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main
        id="top"
        className="app-main mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      >
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-slate-950 px-5 py-7 text-white shadow-2xl 
sm:px-8 sm:py-9">
          <div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ backgroundColor: match.homeTeamColor }}
          />
          <div
            className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: match.awayTeamColor }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] 
text-blue-200 ring-1 ring-white/10">
                  Rapport de match
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {match.matchLevel}
                </span>
              </div>

              <div className="grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-7">
                <div className="min-w-0 text-center">
                  <p
                    className="truncate text-lg font-bold sm:text-2xl"
                    style={{ color: match.homeTeamColor }}
                  >
                    {match.homeTeamName}
                  </p>
                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Domicile
                  </p>
                </div>

                <div className="text-center">
                  <p className="app-score text-3xl font-black tracking-tight sm:text-5xl">
                    {analysis.scoreTotals.HOME} – {analysis.scoreTotals.AWAY}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Score final
                  </p>
                </div>

                <div className="min-w-0 text-center">
                  <p
                    className="truncate text-lg font-bold sm:text-2xl"
                    style={{ color: match.awayTeamColor }}
                  >
                    {match.awayTeamName}
                  </p>
                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Extérieur
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                <span>{formatMatchDate(match.matchDate)}</span>
                <span>Arbitre : {match.refereeName}</span>
                <span>
                  {analysis.penalties.length} pénalités · {analysis.cards.length} cartons
                </span>
              </div>
            </div>

            <div className="hidden gap-3 lg:flex">
              <div className="app-discipline-card rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur">
                <p className="text-xs font-semibold text-slate-400">
                  Indice discipline
                </p>
                <p className="mt-2 text-3xl font-black">
                  {analysis.discipline.teams.HOME.score}
                </p>
                <p className="mt-1 text-xs text-slate-500">Domicile</p>
              </div>

              <div className="app-discipline-card rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur">
                <p className="text-xs font-semibold text-slate-400">
                  Indice discipline
                </p>
                <p className="mt-2 text-3xl font-black">
                  {analysis.discipline.teams.AWAY.score}
                </p>
                <p className="mt-1 text-xs text-slate-500">Extérieur</p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-12 sm:space-y-16">
          <KpiSection
            analysis={analysis}
            match={match}
            weights={weights}
            onWeightChange={handleWeightChange}
          />

          <PenaltiesSection analysis={analysis} />

          <PeriodsSection analysis={analysis} match={match} />

          <TimelineSection
            analysis={analysis}
            match={match}
            resetSignal={resetSignal}
          />

          <MomentumSection analysis={analysis} match={match} />

          <AdvantagesSection analysis={analysis} match={match} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center 
sm:justify-between sm:px-6 lg:px-8">
          <p>
            Rugby Discipline — analyse entièrement locale, sans envoi de données
            vers un serveur.
          </p>
          <p>
            Mi-temps :{" "}
            {analysis.boundaries.halfTimeSource === "event"
              ? "Half Time"
              : "40:00 (secours)"}{" "}
            · Fin :{" "}
            {analysis.boundaries.fullTimeSource === "event"
              ? "Full Time"
              : "estimation"}
          </p>
        </div>
      </footer>

      <MatchHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentRawJson={currentRawJson}
        currentMatch={match}
        currentSummary={{
          penalties: analysis.penalties.length,
          cards: analysis.cards.length,
          homeScore: analysis.scoreTotals.HOME,
          awayScore: analysis.scoreTotals.AWAY,
        }}
        onAnalyze={handleHistoryAnalyze}
        onHistoryChanged={refreshHistoryCount}
        autoSaveImports={autoSaveImports}
        onAutoSaveImportsChange={handleAutoSaveImportsChange}
      />

      <DataImportPanel
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={handleLoad}
      />

      <div ref={reportRef}>
        <PdfReport analysis={analysis} match={match} />
      </div>

      {notice ? (
        <div
          className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm 
font-semibold shadow-2xl backdrop-blur ${
            notice.type === "error"
              ? "border-red-200 bg-red-50/95 text-red-800"
              : notice.type === "warning"
                ? "border-amber-200 bg-amber-50/95 text-amber-800"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-800"
          }`}
          role="status"
        >
          {notice.type === "error" ? (
            <X className="mt-0.5 shrink-0" size={17} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
          )}
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-2 opacity-60 transition hover:opacity-100"
            aria-label="Fermer la notification"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      {exporting ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-800 
shadow-2xl">
            <Activity className="animate-pulse text-blue-600" size={19} />
            Génération du rapport A4…
          </div>
        </div>
      ) : null}
    </div>
  );
}
