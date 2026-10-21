from pathlib import Path

path = Path("src/lib/matchStorage.js")
source = path.read_text(encoding="utf-8")

# Ajoute une fonction de tri des dates juste avant listSavedMatches.
marker = "/**\n * Retourne tous les matchs sauvegardés, du plus récent au plus ancien.\n */"

helper = '''/**
 * Retourne un timestamp exploitable pour le tri de l'historique.
 *
 * Priorité :
 * 1. date du match ;
 * 2. date de sauvegarde si la date du match est absente ou invalide.
 */
function getHistorySortTimestamp(record) {
  const rawMatchDate =
    typeof record?.matchDate === "string"
      ? record.matchDate.trim()
      : "";

  if (rawMatchDate) {
    const normalizedDate = /^\\d{4}-\\d{2}-\\d{2}$/.test(rawMatchDate)
      ? `${rawMatchDate}T12:00:00`
      : rawMatchDate;

    const matchTimestamp = Date.parse(normalizedDate);

    if (Number.isFinite(matchTimestamp)) {
      return matchTimestamp;
    }
  }

  const savedTimestamp = Date.parse(record?.savedAt ?? "");

  return Number.isFinite(savedTimestamp) ? savedTimestamp : 0;
}

'''

if "function getHistorySortTimestamp" not in source:
    if marker not in source:
        raise SystemExit(
            "Impossible de trouver le début de listSavedMatches."
        )

    source = source.replace(
        marker,
        helper + marker,
        1,
    )

# Remplace le tri actuel par date de sauvegarde.
old_sort = '''.sort((first, second) =>
              String(second.savedAt).localeCompare(
                String(first.savedAt),
              ),
            )'''

new_sort = '''.sort((first, second) => {
              const dateDifference =
                getHistorySortTimestamp(second) -
                getHistorySortTimestamp(first);

              if (dateDifference !== 0) {
                return dateDifference;
              }

              // Même date de match : le plus récemment sauvegardé passe en premier.
              return String(second.savedAt).localeCompare(
                String(first.savedAt),
              );
            })'''

if old_sort in source:
    source = source.replace(old_sort, new_sort, 1)
elif "getHistorySortTimestamp(second)" not in source:
    raise SystemExit(
        "Impossible de remplacer le tri de l'historique."
    )

path.write_text(source, encoding="utf-8")

print("✓ Historique trié par date de match, du plus récent au plus ancien.")
print("✓ Date de sauvegarde utilisée comme valeur de repli.")