from pathlib import Path
import shutil

ROOT = Path(".")
BACKUP = ROOT / ".backup-design"

FILES_TO_PATCH = [
    ROOT / "src/index.css",
    ROOT / "src/App.jsx",
    ROOT / "src/components/ui.jsx",
    ROOT / "src/components/TimelineSection.jsx",
    ROOT / "src/components/DataImportPanel.jsx",
]

# Sauvegarde unique des fichiers d'origine.
for file_path in FILES_TO_PATCH:
    if not file_path.exists():
        continue

    destination = BACKUP / file_path.relative_to(ROOT)

    if not destination.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, destination)


def replace_if_present(path, old, new, label, replace_all=False):
    if not path.exists():
        print(f"⚠ Fichier absent : {path}")
        return

    source = path.read_text(encoding="utf-8")

    if old not in source:
        print(f"⚠ Motif non trouvé : {label}")
        return

    if replace_all:
        source = source.replace(old, new)
    else:
        source = source.replace(old, new, 1)

    path.write_text(source, encoding="utf-8")
    print(f"✓ {label}")


# ===================================================================
# 1. Nouveau design system
# ===================================================================

css = r'''
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    --app-background: #f3f6fb;
    --app-border: rgba(203, 213, 225, 0.76);
    --app-blue: #2563eb;
    --app-cyan: #06b6d4;
    --app-shadow:
      0 1px 2px rgba(15, 23, 42, 0.03),
      0 18px 48px -30px rgba(15, 23, 42, 0.28);
  }

  html {
    scroll-behavior: smooth;
    scroll-padding-top: 7rem;
  }

  body {
    @apply m-0 min-w-[320px] bg-slate-50 font-sans text-slate-900 antialiased;
    min-height: 100vh;
    background-color: var(--app-background);
    background-image:
      radial-gradient(
        circle at 8% -2%,
        rgba(37, 99, 235, 0.12),
        transparent 30rem
      ),
      radial-gradient(
        circle at 95% 2%,
        rgba(6, 182, 212, 0.1),
        transparent 28rem
      ),
      linear-gradient(
        180deg,
        #f8faff 0%,
        #f3f6fb 44%,
        #eef3f9 100%
      );
    background-attachment: fixed;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.28;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.11) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.11) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(
      to bottom,
      black 0%,
      rgba(0, 0, 0, 0.5) 32%,
      transparent 78%
    );
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button,
  a,
  input,
  textarea,
  select {
    -webkit-tap-highlight-color: transparent;
  }

  ::selection {
    color: #0f172a;
    background: rgba(147, 197, 253, 0.68);
  }

  :focus-visible {
    outline: 2px solid rgba(37, 99, 235, 0.75);
    outline-offset: 3px;
  }
}

@layer components {
  .panel {
    @apply rounded-2xl border border-slate-200/80 bg-white shadow-card;
    border-color: var(--app-border);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: var(--app-shadow);
    backdrop-filter: blur(10px);
  }

  .panel-muted {
    @apply rounded-2xl border border-slate-200/70 bg-slate-50/80;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold 
text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 
focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50;
    background-image: linear-gradient(
      135deg,
      #2563eb 0%,
      #0ea5e9 125%
    );
    box-shadow:
      0 10px 25px -12px rgba(37, 99, 235, 0.58),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow:
      0 14px 30px -12px rgba(37, 99, 235, 0.68),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm 
font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 
focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50;
    box-shadow: 0 5px 15px -12px rgba(15, 23, 42, 0.45);
  }

  .btn-secondary:hover {
    transform: translateY(-1px);
    border-color: rgba(37, 99, 235, 0.3);
    color: #1d4ed8;
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 
transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200;
  }

  .field {
    @apply w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition 
placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10;
  }

  .chip {
    @apply inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold 
text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700;
    box-shadow: 0 3px 10px -8px rgba(15, 23, 42, 0.5);
  }

  .chip-active {
    @apply border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:border-blue-700 hover:bg-blue-700 
hover:text-white;
    background-image: linear-gradient(
      135deg,
      #2563eb 0%,
      #0ea5e9 125%
    );
    box-shadow:
      0 7px 18px -8px rgba(37, 99, 235, 0.65),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }
}

/* ------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------ */

.app-header {
  background:
    linear-gradient(
      180deg,
      rgba(7, 17, 31, 0.985) 0%,
      rgba(9, 24, 43, 0.94) 100%
    );
  border-bottom-color: rgba(148, 163, 184, 0.14);
  box-shadow:
    0 12px 38px -24px rgba(2, 6, 23, 0.92),
    inset 0 -1px 0 rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(20px) saturate(140%);
}

.app-header::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.8) 18%,
    rgba(6, 182, 212, 0.7) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.app-logo {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.98),
      rgba(14, 165, 233, 0.94)
    );
  box-shadow:
    0 10px 28px -12px rgba(37, 99, 235, 0.88),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.app-logo:hover {
  transform: translateY(-1px) rotate(-1deg);
  box-shadow:
    0 14px 34px -12px rgba(37, 99, 235, 0.95),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.app-nav-link {
  position: relative;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.app-nav-link::after {
  content: "";
  position: absolute;
  right: 12px;
  bottom: 3px;
  left: 12px;
  height: 1px;
  transform: scaleX(0);
  transform-origin: center;
  background: linear-gradient(90deg, #60a5fa, #22d3ee);
  transition: transform 180ms ease;
}

.app-nav-link:hover::after {
  transform: scaleX(1);
}

.app-header-action,
.app-export-button {
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.app-header-action:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(255, 255, 255, 0.08);
}

.app-export-button {
  background-image: linear-gradient(
    135deg,
    #2563eb 0%,
    #0284c7 100%
  );
  border: 1px solid rgba(125, 211, 252, 0.2);
  box-shadow:
    0 10px 25px -12px rgba(37, 99, 235, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.app-export-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 15px 30px -12px rgba(37, 99, 235, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.app-mobile-nav {
  background: rgba(2, 6, 23, 0.26);
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}

/* ------------------------------------------------------------------
 * Hero du match
 * ------------------------------------------------------------------ */

.app-main {
  position: relative;
  z-index: 1;
}

.app-match-hero {
  isolation: isolate;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(
      135deg,
      rgba(7, 17, 31, 0.99) 0%,
      rgba(12, 31, 55, 0.98) 52%,
      rgba(7, 17, 31, 0.99) 100%
    );
  box-shadow:
    0 30px 75px -38px rgba(2, 6, 23, 0.95),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.app-match-hero::after {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6),
    transparent 72%
  );
}

.app-match-hero > * {
  z-index: 1;
}

.app-score {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.055em;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #dbeafe 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 8px 18px rgba(37, 99, 235, 0.18));
}

.app-discipline-card {
  border-color: rgba(148, 163, 184, 0.17);
  background: rgba(255, 255, 255, 0.055);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 12px 28px -22px rgba(0, 0, 0, 0.8);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}

.app-discipline-card:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(255, 255, 255, 0.075);
}

/* ------------------------------------------------------------------
 * Sections et cartes
 * ------------------------------------------------------------------ */

.app-content-section {
  position: relative;
  scroll-margin-top: 7rem;
}

.app-section-header {
  position: relative;
}

.app-section-icon {
  color: #ffffff !important;
  border: 1px solid rgba(96, 165, 250, 0.24);
  background:
    linear-gradient(135deg, #2563eb 0%, #0891b2 125%) !important;
  box-shadow:
    0 9px 22px -11px rgba(37, 99, 235, 0.72),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.app-section-header:hover .app-section-icon {
  transform: translateY(-1px) rotate(-2deg);
  box-shadow:
    0 13px 26px -11px rgba(37, 99, 235, 0.82),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.app-section-title {
  color: #0f172a;
  letter-spacing: -0.025em;
}

.app-section-description {
  color: #64748b;
}

.app-card {
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.app-card:hover {
  border-color: rgba(59, 130, 246, 0.25);
  background-color: rgba(255, 255, 255, 0.975);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 24px 52px -30px rgba(15, 23, 42, 0.36);
}

.app-metric-card {
  position: relative;
  overflow: hidden;
  border-color: rgba(203, 213, 225, 0.8);
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(248, 250, 252, 0.96)
    );
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 17px 42px -30px rgba(15, 23, 42, 0.32);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.app-metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 18%;
  left: 18%;
  height: 2px;
  opacity: 0.7;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(37, 99, 235, 0.8),
    transparent
  );
}

.app-metric-card:hover {
  transform: translateY(-3px);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow:
    0 2px 4px rgba(15, 23, 42, 0.04),
    0 25px 50px -28px rgba(15, 23, 42, 0.4);
}

.app-metric-label {
  color: #64748b;
  letter-spacing: 0.075em;
}

.app-metric-value {
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.035em;
}

.app-metric-helper {
  color: #64748b;
}

.app-metric-icon {
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    0 10px 25px -12px rgba(15, 23, 42, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.app-metric-card:hover .app-metric-icon {
  transform: translateY(-1px) scale(1.025);
}

.app-empty-state {
  border-color: rgba(148, 163, 184, 0.5);
  background:
    linear-gradient(
      145deg,
      rgba(248, 250, 252, 0.96),
      rgba(239, 246, 255, 0.86)
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.app-team-badge {
  box-shadow: 0 4px 12px -9px rgba(15, 23, 42, 0.55);
}

/* ------------------------------------------------------------------
 * Tableaux
 * ------------------------------------------------------------------ */

.app-card table {
  border-collapse: separate;
  border-spacing: 0;
}

.app-card table thead {
  background: linear-gradient(
    180deg,
    #f8fafc 0%,
    #f1f5f9 100%
  );
}

.app-card table th {
  color: #64748b;
  border-bottom-color: #e2e8f0;
  letter-spacing: 0.045em;
}

.app-card table td {
  border-bottom-color: rgba(226, 232, 240, 0.9);
}

.app-card table tbody tr {
  transition: background-color 150ms ease;
}

.app-card table tbody tr:hover {
  background: rgba(239, 246, 255, 0.72) !important;
}

/* ------------------------------------------------------------------
 * Graphiques Recharts
 * ------------------------------------------------------------------ */

.recharts-wrapper,
.recharts-surface {
  outline: none;
}

.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: rgba(203, 213, 225, 0.7);
}

.recharts-cartesian-axis-tick-value {
  fill: #64748b;
  font-size: 12px;
}

.recharts-legend-item-text {
  color: #475569 !important;
  font-size: 12px;
  font-weight: 600;
}

.recharts-default-tooltip {
  border: 1px solid rgba(203, 213, 225, 0.85) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.97) !important;
  box-shadow:
    0 18px 42px -22px rgba(15, 23, 42, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(12px);
}

.recharts-pie-sector path,
.recharts-bar-rectangle path {
  transition:
    opacity 160ms ease,
    filter 160ms ease;
}

.recharts-pie-sector:hover path {
  filter: brightness(1.06) saturate(1.08);
}

.recharts-line-curve {
  filter: drop-shadow(0 5px 5px rgba(37, 99, 235, 0.12));
}

.recharts-tooltip-wrapper {
  z-index: 30;
}

/* ------------------------------------------------------------------
 * Timeline
 * ------------------------------------------------------------------ */

.timeline-central-line {
  background: linear-gradient(
    to bottom,
    rgba(37, 99, 235, 0.08),
    rgba(37, 99, 235, 0.42) 14%,
    rgba(6, 182, 212, 0.4) 82%,
    rgba(148, 163, 184, 0.1)
  ) !important;
  box-shadow: 0 0 14px rgba(37, 99, 235, 0.1);
}

.timeline-event-row {
  transition: transform 160ms ease;
}

.timeline-event-row:hover {
  transform: translateX(1px);
}

.timeline-event-card {
  border-color: rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.97);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 12px 28px -24px rgba(15, 23, 42, 0.55);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.timeline-event-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow:
    0 2px 5px rgba(15, 23, 42, 0.04),
    0 18px 34px -24px rgba(15, 23, 42, 0.55);
}

.timeline-milestone-card {
  border-color: rgba(59, 130, 246, 0.22);
  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.99),
      rgba(239, 246, 255, 0.95)
    );
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 18px 36px -28px rgba(37, 99, 235, 0.4);
}

/* ------------------------------------------------------------------
 * Modale d'import
 * ------------------------------------------------------------------ */

.app-import-backdrop {
  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(37, 99, 235, 0.18),
      transparent 38%
    ),
    rgba(2, 6, 23, 0.72) !important;
  backdrop-filter: blur(12px) saturate(115%);
}

.app-import-modal {
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 40px 100px -35px rgba(2, 6, 23, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.04);
}

/* ------------------------------------------------------------------
 * Scrollbar
 * ------------------------------------------------------------------ */

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: #cbd5e1;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  background-clip: padding-box;
}

/* ------------------------------------------------------------------
 * Rapport PDF hors écran
 * ------------------------------------------------------------------ */

.pdf-report {
  position: absolute;
  top: 0;
  left: -20000px;
  width: 794px;
  z-index: -1;
}

.pdf-report.pdf-export-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 50 !important;
  background: white;
}

.pdf-page {
  box-sizing: border-box;
  width: 794px;
  height: 1123px;
  overflow: hidden;
  background: white;
  color: #0f172a;
}

@media print {
  body > #root {
    display: none;
  }

  .pdf-report {
    position: static !important;
    left: auto !important;
    width: 794px !important;
  }

  .pdf-page {
    break-after: page;
  }
}

@media (max-width: 640px) {
  .panel {
    border-radius: 1.1rem;
  }

  .app-section-icon {
    width: 2.35rem;
    height: 2.35rem;
  }

  .app-section-title {
    font-size: 1.18rem;
  }

  .app-metric-card {
    padding: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
'''

(ROOT / "src/index.css").write_text(
    css.strip() + "\n",
    encoding="utf-8",
)

print("✓ Nouveau design system appliqué à src/index.css")


# ===================================================================
# 2. Classes visuelles du header et du hero
# ===================================================================

app_path = ROOT / "src/App.jsx"

replace_if_present(
    app_path,'className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 text-white shadow-lg backdrop-blur-xl"','className="app-header sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 text-white shadow-lg backdrop-blur-xl"',
    "Header modernisé",
)

replace_if_present(
    app_path,'className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20"','className="app-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20"',
    "Logo du header",
)

replace_if_present(
    app_path,
    'className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"','className="app-nav-link rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"',"Navigation principale",
)

replace_if_present(
    app_path,'className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:inline-flex"','className="app-header-action hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:inline-flex"',"Bouton de réinitialisation",
)

replace_if_present(
    app_path,'className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"','className="app-header-action inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"',
    "Bouton d’import",
)

replace_if_present(
    app_path,'className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"','className="app-export-button inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"',
    "Bouton d’export PDF",
)

replace_if_present(
    app_path,
    'className="scrollbar-thin flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 xl:hidden"',
    'className="app-mobile-nav scrollbar-thin flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 xl:hidden"',
    "Navigation mobile",
)

replace_if_present(
    app_path,
    'className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8"',
    'className="app-main mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8"',
    "Conteneur principal",
)

replace_if_present(
    app_path,'className="relative mb-8 overflow-hidden rounded-[28px] bg-slate-950 px-5 py-7 text-white shadow-2xl sm:px-8 sm:py-9"','className="app-match-hero relative mb-8 overflow-hidden rounded-[28px] bg-slate-950 px-5 py-7 text-white shadow-2xl sm:px-8 sm:py-9"',
    "Hero du match",
)

replace_if_present(
    app_path,
    'className="text-3xl font-black tracking-tight sm:text-5xl"',
    'className="app-score text-3xl font-black tracking-tight sm:text-5xl"',
    "Score final",
)

replace_if_present(
    app_path,
    'className="hidden gap-3 lg:flex"',
    'className="hidden gap-3 lg:flex"',
    "Bloc des indices disciplinaires",
)

replace_if_present(
    app_path,
    'className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur"',
    'className="app-discipline-card rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur"',
    "Cartes des indices disciplinaires",
    replace_all=True,
)

replace_if_present(
    app_path,
    'className="border-t border-slate-200 bg-white"',
    'className="border-t border-slate-200 bg-white/85 backdrop-blur"',
    "Footer modernisé",
)


# ===================================================================
# 3. Composants UI partagés
# ===================================================================

ui_path = ROOT / "src/components/ui.jsx"

replace_if_present(
    ui_path,
    'className={cn("panel", className)}',
    'className={cn("panel app-card", className)}',
    "Cartes applicatives",
)

replace_if_present(
    ui_path,
    'className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"',
    'className="app-section-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"',
    "En-tête de section",
)

replace_if_present(
    ui_path,
    'className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"','className="app-section-icon mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"',
    "Icône de section",
)

replace_if_present(
    ui_path,
    'className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"',
    'className="app-section-title text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"',
    "Titre de section",
)

replace_if_present(
    ui_path,
    'className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500"',
    'className="app-section-description mt-1.5 max-w-3xl text-sm leading-6 text-slate-500"',
    "Description de section",
)

replace_if_present(
    ui_path,'"flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center",','"app-empty-state flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center",',
    "États vides",
)

replace_if_present(
    ui_path,
    'className="panel relative overflow-hidden p-5"',
    'className="app-metric-card panel relative overflow-hidden p-5"',
    "Cartes KPI",
)

replace_if_present(
    ui_path,
    'className="text-xs font-semibold uppercase tracking-wider text-slate-500"',
    'className="app-metric-label text-xs font-semibold uppercase tracking-wider text-slate-500"',
    "Libellés KPI",
)

replace_if_present(
    ui_path,
    'className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950"',
    'className="app-metric-value mt-2 truncate text-2xl font-bold tracking-tight text-slate-950"',
    "Valeurs KPI",
)

replace_if_present(
    ui_path,
    'className="mt-1.5 text-xs leading-5 text-slate-500"',
    'className="app-metric-helper mt-1.5 text-xs leading-5 text-slate-500"',
    "Descriptions KPI",
)

replace_if_present(
    ui_path,'className={cn(\n              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",','className={cn(\n              "app-metric-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",',
    "Icônes KPI",
)

replace_if_present(
    ui_path,'className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"','className="app-team-badge inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"',
    "Badges d’équipe",
)


# ===================================================================
# 4. Timeline
# ===================================================================

timeline_path = ROOT / "src/components/TimelineSection.jsx"

replace_if_present(
    timeline_path,
    'className="absolute bottom-5 left-1/2 top-5 w-px bg-slate-200"',
    'className="timeline-central-line absolute bottom-5 left-1/2 top-5 w-px bg-slate-200"',
    "Axe central de la timeline",
)

replace_if_present(
    timeline_path,
    'className="w-full max-w-[285px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"','className="timeline-event-card w-full max-w-[285px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"',
    "Cartes d’événements",
)

replace_if_present(
    timeline_path,
    'className="grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center gap-3 py-1.5"',
    'className="timeline-event-row grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center gap-3 py-1.5"',
    "Lignes de la timeline",
)

replace_if_present(
    timeline_path,
    'className="relative w-[370px] rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"','className="timeline-milestone-card relative w-[370px] rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"',
    "Repères chronologiques",
)


# ===================================================================
# 5. Modale d'import
# ===================================================================

import_path = ROOT / "src/components/DataImportPanel.jsx"

replace_if_present(
    import_path,
    'className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"','className="app-import-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"',
    "Arrière-plan de la modale",
)

replace_if_present(
    import_path,
    'className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"','className="app-import-modal flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"',
    "Modale d’import",
)


# ===================================================================
# 6. Espacement homogène des sections
# ===================================================================

for component_path in (ROOT / "src/components").glob("*.jsx"):
    source = component_path.read_text(encoding="utf-8")

    if 'className="scroll-mt-28"' in source:
        source = source.replace(
            'className="scroll-mt-28"',
            'className="app-content-section scroll-mt-28"',
        )

        component_path.write_text(
            source,
            encoding="utf-8",
        )

        print(f"✓ Espacement de section : {component_path.name}")

print("\n✓ Modernisation visuelle terminée.")
print("✓ Aucun calcul métier ni comportement fonctionnel modifié.")
print(f"✓ Sauvegarde disponible dans : {BACKUP}")