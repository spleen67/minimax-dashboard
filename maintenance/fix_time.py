from pathlib import Path
import re

path = Path("src/lib/analytics.js")
source = path.read_text(encoding="utf-8")

pattern = re.compile(
    r"export function formatMatchMinute\(minutes\)\s*\{.*?^\}",
    re.MULTILINE | re.DOTALL,
)

replacement = '''export function formatMatchMinute(minutes) {
  if (!Number.isFinite(minutes)) {
    return "—";
  }

  /*
   * Les temps sont stockés en minutes décimales pour les calculs,
   * mais l'interface affiche uniquement la minute entière écoulée.
   */
  return `${Math.max(0, Math.floor(minutes))}e`;
}'''

updated_source, replacements = pattern.subn(
    replacement,
    source,
    count=1,
)

if replacements !=1:raise SystemExit("Impossible de remplacer formatMatchMinute dans src/lib/analytics.js")

path.write_text(updated_source, encoding="utf-8")

print("✓ Les temps de match sont désormais affichés en minutes entières.")