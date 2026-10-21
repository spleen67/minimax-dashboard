from pathlib import Path
import re

analytics_path = Path("src/lib/analytics.js")
source = analytics_path.read_text(encoding="utf-8")

# Remplace le convertisseur mm:ss par un affichage en minute de match.
start = source.find("export function formatTime(")
end = source.find("export function teamFor(", start)

if start == -1 or end == -1:
    raise SystemExit(
        "Impossible de localiser formatTime dans src/lib/analytics.js"
    )

new_function = '''export function formatMatchMinute(minutes) {
  if (!Number.isFinite(minutes)) {
    return "—";
  }

  const safeMinutes = Math.max(0, minutes);
  const wholeMinutes = Math.floor(safeMinutes);
  const seconds = Math.round((safeMinutes - wholeMinutes) * 60);

  if (seconds === 0) {
    return `${wholeMinutes}e`;
  }

  // Arrondi à la minute supérieure après normalisation flottante.
  if (seconds === 60) {
    return `${wholeMinutes + 1}e`;
  }

  return `${wholeMinutes}e${String(seconds).padStart(2, "0")}`;
}

'''

source = source[:start] + new_function + source[end:]

# Les libellés des tranches sont également exprimés en minutes de match.
old_label = '''label: `${String(start).padStart(2, "0")}–${String(
        Math.ceil(end),
      ).padStart(2, "0")}`,'''

new_label = '''label: `${start}–${Math.ceil(end)}e`,'''

if old_label in source:
    source = source.replace(old_label, new_label)
else:
    source = re.sub('label: `\$\{String\(start\)\.padStart\(2, "0"\)\}–\$\{String\(\s*Math\.ceil\(end\),\s*\)\.padStart\(2, "0"\)\}`',
        new_label,
        source,
    )

analytics_path.write_text(source, encoding="utf-8")

# Tous les composants utilisent désormais le même convertisseur.
for file_path in Path("src").rglob("*"):
    if file_path.suffix not in {".js", ".jsx"}:
        continue

    content = file_path.read_text(encoding="utf-8")
    content = content.replace("formatTime", "formatMatchMinute")

    # Les colonnes "Heure" deviennent "Minute".
    content = content.replace(">Heure<", ">Minute<")

    file_path.write_text(content, encoding="utf-8")

print("✓ Tous les temps sont maintenant affichés en minutes de match.")
