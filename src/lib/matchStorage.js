const DATABASE_NAME = "rugby-discipline-history";
const DATABASE_VERSION = 1;
const STORE_NAME = "matches";

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `match-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(
        new Error(
          "IndexedDB n’est pas disponible dans ce navigateur.",
        ),
      );
      return;
    }

    const request = globalThis.indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("savedAt", "savedAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Impossible d’ouvrir l’historique local."),
      );
    };

    request.onblocked = () => {
      reject(
        new Error(
          "La base historique est verrouillée par un autre onglet. Fermez les autres onglets puis réessayez.",
        ),
      );
    };
  });
}

function canonicalJson(source) {
  return JSON.stringify(JSON.parse(source));
}

function normalizeText(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

/**
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
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawMatchDate)
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

/**
 * Retourne tous les matchs sauvegardés, du plus récent au plus ancien.
 */
export async function listSavedMatches() {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readonly",
      );

      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      let records = [];

      request.onsuccess = () => {
        records = Array.isArray(request.result)
          ? request.result
          : [];
      };

      transaction.oncomplete = () => {
        resolve(
          records
            .filter(
              (record) =>
                record &&
                typeof record.id === "string" &&
                typeof record.rawJson === "string",
            )
            .sort((first, second) => {
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
            }),
        );
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error("Impossible de lire l’historique local."),
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error("La lecture de l’historique a été interrompue."),
        );
      };
    });
  } finally {
    database.close();
  }
}

/**
 * Sauvegarde un match.
 *
 * Le JSON original est conservé intact. Un hash structurel est utilisé
 * uniquement pour éviter d'enregistrer deux fois exactement le même JSON.
 */
export async function saveMatchToHistory({
  rawJson,
  currentMatch = {},
  currentSummary = {},
  label = "",
}) {
  if (typeof rawJson !== "string" || !rawJson.trim()) {
    throw new Error("Aucun JSON à sauvegarder.");
  }

  let parsedJson;

  try {
    parsedJson = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(
      `Le JSON à sauvegarder est invalide : ${
        error instanceof Error ? error.message : "erreur inconnue"
      }.`,
    );
  }

  if (!parsedJson || typeof parsedJson !== "object") {
    throw new Error("Le JSON à sauvegarder doit être un objet.");
  }

  const fingerprint = canonicalJson(rawJson);
  const existingMatches = await listSavedMatches();

  const duplicate = existingMatches.find(
    (record) => record.fingerprint === fingerprint,
  );

  if (duplicate) {
    return {
      record: duplicate,
      duplicate: true,
    };
  }

  const homeTeamName = normalizeText(
    currentMatch.homeTeamName ??
      parsedJson.homeTeamName,
    "Équipe domicile",
  );

  const awayTeamName = normalizeText(
    currentMatch.awayTeamName ??
      parsedJson.awayTeamName,
    "Équipe extérieur",
  );

  const now = new Date().toISOString();

  const record = {
    id: createId(),
    schemaVersion: 1,
    fingerprint,
    rawJson,
    label: normalizeText(label),
    savedAt: now,
    createdAt: now,

    homeTeamName,
    awayTeamName,
    homeTeamColor: normalizeText(
      currentMatch.homeTeamColor ??
        parsedJson.homeTeamColor,
      "#3b82f6",
    ),
    awayTeamColor: normalizeText(
      currentMatch.awayTeamColor ??
        parsedJson.awayTeamColor,
      "#64748b",
    ),

    matchDate: normalizeText(
      currentMatch.matchDate ?? parsedJson.matchDate,
    ),
    refereeName: normalizeText(
      currentMatch.refereeName ?? parsedJson.refereeName,
    ),
    matchLevel: normalizeText(
      currentMatch.matchLevel ?? parsedJson.matchLevel,
    ),

    eventCount: Array.isArray(currentMatch.events)
      ? currentMatch.events.length
      : Array.isArray(parsedJson.events)
        ? parsedJson.events.length
        : 0,

    summary: {
      penalties: Number(currentSummary.penalties) || 0,
      cards: Number(currentSummary.cards) || 0,
      homeScore: Number(currentSummary.homeScore) || 0,
      awayScore: Number(currentSummary.awayScore) || 0,
    },
  };

  if (!record.label) {
    record.label = `${homeTeamName} — ${awayTeamName}`;
  }

  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite",
      );

      const store = transaction.objectStore(STORE_NAME);
      store.put(record);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Impossible de sauvegarder le match."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("La sauvegarde a été interrompue."),
        );
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new Error(
        "L’espace de stockage du navigateur est insuffisant. Exportez puis supprimez d’anciens matchs.",
      );
    }

    throw error;
  } finally {
    database.close();
  }

  return {
    record,
    duplicate: false,
  };
}

export async function deleteSavedMatch(id) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite",
      );

      transaction.objectStore(STORE_NAME).delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Impossible de supprimer le match."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("La suppression a été interrompue."),
        );
    });
  } finally {
    database.close();
  }
}

export async function clearSavedMatches() {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite",
      );

      transaction.objectStore(STORE_NAME).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Impossible de vider l’historique."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Le vidage de l’historique a été interrompu."),
        );
    });
  } finally {
    database.close();
  }
}

export async function countSavedMatches() {
  const matches = await listSavedMatches();
  return matches.length;
}

/**
 * Demande au navigateur de préserver les données du site.
 * Certains navigateurs refusent cette demande sans bloquer l'application.
 */
export async function requestPersistentStorage() {
  try {
    if (!globalThis.navigator?.storage?.persist) {
      return false;
    }

    return await globalThis.navigator.storage.persist();
  } catch {
    return false;
  }
}
