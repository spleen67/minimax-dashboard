import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  History,
  Loader2,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  clearSavedMatches,
  deleteSavedMatch,
  listSavedMatches,
  requestPersistentStorage,
  saveMatchToHistory,
} from "../lib/matchStorage";

function formatSavedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMatchDate(value) {
  if (!value) {
    return "Date non communiquée";
  }

  const normalized = String(value).includes("T")
    ? value
    : `${value}T12:00:00`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function safeFileName(value) {
  return String(value || "match")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function downloadJson(source, name) {
  const blob = new Blob([source], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${safeFileName(name)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function MatchHistoryPanel({
  open,
  onClose,
  currentRawJson,
  currentMatch,
  currentSummary,
  onAnalyze,
  onHistoryChanged,
  autoSaveImports = true,
  onAutoSaveImportsChange,
}) {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const savedMatches = await listSavedMatches();
      setRecords(savedMatches);
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Impossible de charger l’historique local.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCustomLabel("");
    setError("");
    setNotice("");
    void refreshRecords();
  }, [open, refreshRecords]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase("fr");

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [
        record.label,
        record.homeTeamName,
        record.awayTeamName,
        record.matchDate,
        record.refereeName,
        record.matchLevel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalizedQuery),
    );
  }, [records, query]);

  const selectedRecord = records.find(
    (record) => record.id === selectedId,
  );

  async function handleSaveCurrent(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await saveMatchToHistory({
        rawJson: currentRawJson,
        currentMatch,
        currentSummary,
        label: customLabel,
      });

      await refreshRecords();
      setSelectedId(result.record.id);
      setCustomLabel("");
      onHistoryChanged?.();

      if (result.duplicate) {
        setNotice(
          "Ce JSON est déjà présent dans l’historique.",
        );
      } else {
        setNotice("Le match a été ajouté à l’historique.");
      }

      void requestPersistentStorage();
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Impossible de sauvegarder le match.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${record.label} » de l’historique ?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deleteSavedMatch(record.id);

      if (selectedId === record.id) {
        setSelectedId(null);
      }

      await refreshRecords();
      onHistoryChanged?.();
      setNotice("Le match a été supprimé de l’historique.");
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Impossible de supprimer le match.",
      );
    }
  }

  async function handleClearHistory() {
    if (records.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer les ${records.length} match(s) de l’historique ? Cette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await clearSavedMatches();
      setSelectedId(null);
      await refreshRecords();
      onHistoryChanged?.();
      setNotice("L’historique a été vidé.");
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Impossible de vider l’historique.",
      );
    }
  }

  function handleDownload(record) {
    downloadJson(
      record.rawJson,
      `${record.label}-${record.matchDate || "sans-date"}`,
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="app-import-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 
backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-history-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="app-import-modal flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white 
shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <History size={20} />
            </div>

            <div>
              <h2
                id="match-history-title"
                className="text-xl font-bold tracking-tight text-slate-950"
              >
                Historique des matchs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Les JSON sont conservés localement dans ce navigateur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !p-2"
            aria-label="Fermer l'historique"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-slate-100 bg-slate-50/60 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Database size={14} />
              Match courant
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-bold text-slate-900">
                {currentMatch.homeTeamName}
                <span className="mx-2 text-slate-400">vs</span>
                {currentMatch.awayTeamName}
              </p>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Date</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {formatMatchDate(currentMatch.matchDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Niveau</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {currentMatch.matchLevel || "Non communiqué"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Événements</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {currentMatch.events?.length ?? 0}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Score</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {currentSummary.homeScore ?? 0} –{" "}
                    {currentSummary.awayScore ?? 0}
                  </dd>
                </div>
              </dl>
            </div>

            <form
              onSubmit={handleSaveCurrent}
              className="mt-5"
            >
              <label
                htmlFor="history-match-label"
                className="text-xs font-bold text-slate-700"
              >
                Nom du match
              </label>

              <input
                id="history-match-label"
                type="text"
                value={customLabel}
                onChange={(event) =>
                  setCustomLabel(event.target.value)
                }
                placeholder={`${currentMatch.homeTeamName} — ${currentMatch.awayTeamName}`}
                className="field mt-2"
              />

              <button
                type="submit"
                disabled={saving || !currentRawJson}
                className="btn-primary mt-3 w-full"
              >
                {saving ? (
                  <Loader2
                    className="animate-spin"
                    size={17}
                  />
                ) : (
                  <Save size={17} />
                )}
                Enregistrer le match
              </button>
            </form>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={autoSaveImports}
                onChange={(event) =>
                  onAutoSaveImportsChange?.(event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span>
                <span className="block text-xs font-bold text-slate-700">
                  Enregistrer automatiquement les imports
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                  Un JSON identique n’est jamais ajouté deux fois.
                </span>
              </span>
            </label>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-900">
              Les données ne sont jamais envoyées vers un serveur. Elles
              restent dans le stockage local du navigateur.
            </div>
          </aside>

          <section className="flex min-h-[540px] min-w-0 flex-col p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Matchs sauvegardés
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {records.length} match(s) disponible(s)
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  type="search"
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Équipe, date, arbitre…"
                  className="field pl-9"
                  aria-label="Rechercher dans l'historique"
                />
              </div>
            </div>

            {error ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 
text-red-700">
                <AlertCircle
                  className="mt-0.5 shrink-0"
                  size={16}
                />
                <span>{error}</span>
              </div>
            ) : null}

            {notice ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs 
leading-5 text-emerald-700">
                <CheckCircle2
                  className="mt-0.5 shrink-0"
                  size={16}
                />
                <span>{notice}</span>
              </div>
            ) : null}

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200">
              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-slate-400">
                  <Loader2
                    className="mb-3 animate-spin"
                    size={26}
                  />
                  <p className="text-sm font-semibold">
                    Chargement de l’historique…
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 
text-slate-400">
                    <History size={22} />
                  </div>

                  <h4 className="font-bold text-slate-800">
                    {records.length === 0
                      ? "Aucun match enregistré"
                      : "Aucun résultat"}
                  </h4>

                  <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
                    {records.length === 0
                      ? "Enregistrez le match courant ou importez un nouveau JSON."
                      : "Modifiez votre recherche pour retrouver un match."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const selected = selectedId === record.id;

                    return (
                      <div
                        key={record.id}
                        className={`flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center ${
                          selected
                            ? "bg-blue-50/70"
                            : "bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            name="saved-match"
                            checked={selected}
                            onChange={() => setSelectedId(record.id)}
                            className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Sélectionner ${record.label}`}
                          />

                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {record.label}
                              </span>

                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 
text-[10px] font-semibold text-slate-500">
                                <FileJson size={10} />
                                {record.eventCount} événements
                              </span>
                            </span>

                            <span className="mt-1.5 block text-xs text-slate-500">
                              {formatMatchDate(record.matchDate)}
                              {record.matchLevel
                                ? ` · ${record.matchLevel}`
                                : ""}
                              {record.refereeName
                                ? ` · ${record.refereeName}`
                                : ""}
                            </span>

                            <span className="mt-1 block text-[11px] text-slate-400">
                              Sauvegardé le {formatSavedAt(record.savedAt)}
                            </span>
                          </span>
                        </label>

                        <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
                          <button
                            type="button"
                            onClick={() => onAnalyze(record)}
                            className="btn-secondary !px-3 !py-2 text-xs"
                          >
                            Analyser
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(record)}
                            className="btn-ghost !p-2"
                            title="Télécharger le JSON"
                            aria-label={`Télécharger ${record.label}`}
                          >
                            <Download size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(record)}
                            className="btn-ghost !p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="Supprimer"
                            aria-label={`Supprimer ${record.label}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center 
sm:justify-between">
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={records.length === 0}
                className="btn-ghost self-start text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={14} />
                Vider l’historique
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedRecord) {
                    onAnalyze(selectedRecord);
                  }
                }}
                disabled={!selectedRecord}
                className="btn-primary"
              >
                <History size={17} />
                Analyser le match sélectionné
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
