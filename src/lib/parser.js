const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const TIME_UNIT_ALIASES = {
  second: "seconds",
  seconds: "seconds",
  sec: "seconds",
  secs: "seconds",
  s: "seconds",
  minute: "minutes",
  minutes: "minutes",
  min: "minutes",
  mins: "minutes",
  m: "minutes",
};

function text(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function color(value, fallback) {
  const candidate = text(value);
  return HEX_COLOR.test(candidate) ? candidate : fallback;
}

function duration(value, fallback = 10) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function positiveDuration(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeTimeUnit(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return TIME_UNIT_ALIASES[normalized] ?? null;
}

/**
 * Normalise un temps de match vers un nombre décimal de minutes.
 *
 * Les temps numériques sources sont interprétés en secondes par défaut :
 * - 64       -> 1.066666 minutes, affiché 1e04
 * - "115"    -> 1.916666 minutes, affiché 1e55
 *
 * Les chaînes horodatées sont déjà explicites :
 * - "01:04"    -> 1.066666 minutes
 * - "00:01:04" -> 1.066666 minutes
 */
function normalizeMatchTime(value, timeUnit) {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    return timeUnit === "seconds" ? value / 60 : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  // Valeur numérique, exprimée dans l'unité source.
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    const numericValue = Number(normalized);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return timeUnit === "seconds"
      ? numericValue / 60
      : numericValue;
  }

  // Format mm:ss ou hh:mm:ss.
  const parts = normalized.split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const numericParts = parts.map(Number);

  if (
    numericParts.some(
      (part) => !Number.isFinite(part) || part < 0,
    )
  ) {
    return null;
  }

  const seconds = numericParts[numericParts.length - 1];

  if (seconds >= 60) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, remainingSeconds] = numericParts;
    return minutes + remainingSeconds / 60;
  }

  const [hours, minutes, remainingSeconds] = numericParts;

  if (minutes >= 60) {
    return null;
  }

  return hours * 60 + minutes + remainingSeconds / 60;
}

export function parseMatchJson(source) {
  const errors = [];
  const warnings = [];

  if (!source || !source.trim()) {
    return {
      ok: false,
      errors: ["Le JSON est vide."],
      warnings,
    };
  }

  let raw;

  try {
    raw = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      errors: [
        `JSON invalide : ${
          error instanceof Error ? error.message : "erreur de syntaxe"
        }.`,
      ],
      warnings,
    };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: ["La racine du JSON doit être un objet."],
      warnings,
    };
  }

  if (!Array.isArray(raw.events)) {
    return {
      ok: false,
      errors: ["Le champ « events » doit être un tableau."],
      warnings,
    };
  }

  const requestedTimeUnit = text(
    raw.timeUnit ?? raw.time_unit,
    "",
  );

  let timeUnit = normalizeTimeUnit(requestedTimeUnit);

  if (requestedTimeUnit && !timeUnit) {
    warnings.push(
      `Unité de temps « ${requestedTimeUnit} » non reconnue. Les temps numériques ont été interprétés en secondes.`,
    );
  }

  if (!timeUnit) {
    timeUnit = "seconds";
  }

  let invalidCount = 0;
  let unknownCount = 0;

  const events = raw.events
    .map((event, index) => {
      if (!event || typeof event !== "object" || Array.isArray(event)) {
        invalidCount += 1;
        return null;
      }

      const time = normalizeMatchTime(event.time, timeUnit);

      if (time === null) {
        invalidCount += 1;
        return null;
      }

      const type = text(event.type, "Unknown");

      if (!type || type.toLowerCase() === "unknown") {
        unknownCount += 1;
      }

      const numericPoints = Number(event.points ?? event.value);
      const points = Number.isFinite(numericPoints)
        ? numericPoints
        : undefined;

      return {
        id: text(event.id, `event-${index}`),
        time,
        type,
        team: text(event.team, "UNKNOWN"),
        detail: text(event.detail),
        ...(points !== undefined ? { points } : {}),
        sourceOrder: index,
      };
    })
    .filter(Boolean);

  if (invalidCount > 0) {
    warnings.push(
      `${invalidCount} événement(s) sans temps numérique valide ont été ignorés.`,
    );
  }

  if (unknownCount > 0) {
    warnings.push(
      `${unknownCount} événement(s) de type inconnu sont conservés pour la chronologie, mais exclus des statistiques.`,
    );
  }

  if (events.length === 0) {
    warnings.push("Le match ne contient aucun événement exploitable.");
  }

  events.sort(
    (first, second) =>
      first.time - second.time ||
      first.sourceOrder - second.sourceOrder,
  );

  return {
    ok: true,
    errors,
    warnings,
    match: {
      events,
      homeTeamName: text(raw.homeTeamName, "Équipe domicile"),
      awayTeamName: text(raw.awayTeamName, "Équipe extérieur"),
      homeTeamColor: color(raw.homeTeamColor, "#3b82f6"),
      awayTeamColor: color(raw.awayTeamColor, "#64748b"),
      yellowCardDuration: duration(raw.yellowCardDuration),
      whiteCardDuration: duration(raw.whiteCardDuration),
      matchDate: text(raw.matchDate),
      refereeName: text(raw.refereeName, "Non communiqué"),
      matchLevel: text(raw.matchLevel, "Non communiqué"),
      matchDuration: positiveDuration(raw.matchDuration, 80),
      timeUnit,
    },
  };
}
