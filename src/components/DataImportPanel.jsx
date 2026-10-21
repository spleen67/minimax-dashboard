import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  FileJson,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { parseMatchJson } from "../lib/parser";
import { demoMatch } from "../data/demoMatch";

export default function DataImportPanel({
  open,
  onClose,
  onApply,
}) {
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function readFile(file) {
    if (!file) return;

    setReading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const content = await file.text();
      setSource(content);
      setFileName(file.name);
    } catch (error) {
      setErrors([
        `Impossible de lire le fichier : ${
          error instanceof Error ? error.message : "erreur inconnue"
        }.`,
      ]);
    } finally {
      setReading(false);
    }
  }

  function applySource(content = source) {
    const result = parseMatchJson(content);

    if (!result.ok) {
      setErrors(result.errors);
      setWarnings([]);
      return;
    }

    setErrors([]);
    setWarnings(result.warnings);
    onApply(result.match, result.warnings, content);
    onClose();
  }

  function loadDemo() {
    const content = JSON.stringify(demoMatch, null, 2);
    setSource(content);
    setFileName("match-demonstration.json");
    setErrors([]);
    setWarnings([]);
    applySource(content);
  }

  return (
    <div
      className="app-import-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-import-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="app-import-modal flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <h2
              id="data-import-title"
              className="text-xl font-bold tracking-tight text-slate-950"
            >
              Importer les données du match
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chargez un fichier JSON ou collez directement son contenu.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !p-2"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-slate-100 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <h3 className="font-bold text-slate-900">
              Source des données
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Le document doit contenir un objet avec un tableau
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                events
              </code>
              .
            </p>

            <label className="btn-primary mt-5 w-full cursor-pointer">
              {reading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Upload size={17} />
              )}
              Choisir un fichier JSON
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(event) => readFile(event.target.files?.[0])}
              />
            </label>

            <button
              type="button"
              onClick={loadDemo}
              className="btn-secondary mt-3 w-full"
            >
              <FileJson size={17} />
              Charger le match de démonstration
            </button>

            {fileName ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  Fichier sélectionné
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-800">
                  {fileName}
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              Les événements sans temps numérique valide sont ignorés avec un
              avertissement. Les types inconnus ne bloquent pas l’analyse et
              restent utilisables dans la chronologie des avantages.
            </div>
          </div>

          <div className="flex min-h-[540px] flex-col p-5 sm:p-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label
                htmlFor="match-json"
                className="text-sm font-bold text-slate-800"
              >
                Contenu JSON
              </label>
              <button
                type="button"
                onClick={() => {
                  setSource("");
                  setFileName("");
                  setErrors([]);
                  setWarnings([]);
                }}
                className="btn-ghost !px-2 !py-1 text-xs"
              >
                Effacer
              </button>
            </div>

            <textarea
              id="match-json"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setErrors([]);
              }}
              spellCheck={false}
              placeholder={`{
  "events": [
    {
      "time": 12,
      "type": "Penalty Conceded",
      "team": "HOME",
      "detail": "Plongeon"
    }
  ],
  "homeTeamName": "Équipe A",
  "awayTeamName": "Équipe B"
}`}
              className="min-h-[370px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono 
text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 
focus:ring-blue-500/10"
            />

            {errors.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertCircle size={17} />
                  Données invalides
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-red-700">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <CheckCircle2 size={17} />
                  Avertissements
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-700">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Les données actuelles seront remplacées après validation.
              </p>
              <button
                type="button"
                onClick={() => applySource()}
                disabled={!source.trim() || reading}
                className="btn-primary"
              >
                <ClipboardPaste size={17} />
                Valider et analyser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
