import {
  CARD_COLORS,
  DEFAULT_WEIGHTS,
  SCORE_VALUES,
} from "./constants";

export function typeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function isPenaltyEvent(event) {
  return typeKey(event.type) === "penalty conceded";
}

export function isCardEvent(event) {
  return ["yellow card", "white card", "red card"].includes(
    typeKey(event.type),
  );
}

export function isScoreEvent(event) {
  return Object.prototype.hasOwnProperty.call(
    SCORE_VALUES,
    typeKey(event.type),
  );
}

export function isAdvantageEvent(event) {
  return typeKey(event.type) === "advantage";
}

export function isTimelineEvent(event) {
  return (
    isPenaltyEvent(event) ||
    isCardEvent(event) ||
    isScoreEvent(event)
  );
}

export function formatMatchMinute(minutes) {
  if (!Number.isFinite(minutes)) {
    return "—";
  }

  /*
   * Les temps sont stockés en minutes décimales pour les calculs,
   * mais l'interface affiche uniquement la minute entière écoulée.
   */
  return `${Math.max(0, Math.floor(minutes))}e`;
}

export function teamFor(event, match) {
  const raw = String(event.team ?? "").trim().toLowerCase();

  const home = [
    "home",
    "domicile",
    "dom",
    "h",
    String(match.homeTeamName ?? "").toLowerCase(),
  ];

  const away = [
    "away",
    "visiteur",
    "exterieur",
    "extérieur",
    "visitor",
    "ext",
    String(match.awayTeamName ?? "").toLowerCase(),
  ];

  if (home.includes(raw)) return "HOME";
  if (away.includes(raw)) return "AWAY";
  return "UNKNOWN";
}

export function scorePoints(event) {
  if (Number.isFinite(event.points)) return event.points;
  return SCORE_VALUES[typeKey(event.type)] ?? 0;
}

function cardColor(event) {
  switch (typeKey(event.type)) {
    case "yellow card":
      return CARD_COLORS.yellow;
    case "white card":
      return CARD_COLORS.white;
    case "red card":
      return CARD_COLORS.red;
    default:
      return CARD_COLORS.white;
  }
}

function detectMomentumForTeam(events, match, team) {
  const teamEvents = events.filter(
    (event) => teamFor(event, match) === team,
  );

  const penalties = teamEvents.filter(isPenaltyEvent);
  const cards = teamEvents.filter(isCardEvent);

  /*
   * Les séquences sont séparées :
   * - lorsqu'un carton de la même équipe survient ;
   * - lorsqu'un écart d'au moins 10 minutes existe entre deux pénalités.
   *
   * Cette séparation permet notamment de détecter une nouvelle accumulation
   * après un carton, tout en évitant les doublons.
   */
  const penaltyGroups = [];
  let currentGroup = [];
  let previousPenalty = null;

  teamEvents.forEach((event) => {
    if (isPenaltyEvent(event)) {
      if (
        previousPenalty &&
        event.time - previousPenalty.time >= 10
      ) {
        if (currentGroup.length > 0) {
          penaltyGroups.push(currentGroup);
        }

        currentGroup = [];
      }

      currentGroup.push(event);
      previousPenalty = event;
      return;
    }

    if (isCardEvent(event)) {
      if (currentGroup.length > 0) {
        penaltyGroups.push(currentGroup);
      }

      currentGroup = [];
      previousPenalty = null;
    }
  });

  if (currentGroup.length > 0) {
    penaltyGroups.push(currentGroup);
  }

  const windows = [];

  penaltyGroups.forEach((group, groupIndex) => {
    const candidates = group.map((anchor) => {
      const windowStart = anchor.time;
      const windowEnd = windowStart + 10;

      /*
       * La borne droite est exclusive : une pénalité située exactement
       * 10 minutes après le début n'appartient pas à la fenêtre.
       */
      const windowPenalties = group.filter(
        (penalty) =>
          penalty.time >= windowStart &&
          penalty.time < windowEnd,
      );

      const windowCards = cards.filter(
        (card) =>
          card.time >= windowStart &&
          card.time < windowEnd,
      );

      return {
        anchor,
        windowStart,
        windowEnd,
        windowPenalties,
        windowCards,
        count: windowPenalties.length,
        hasCard: windowCards.length > 0,
      };
    });

    if (candidates.length === 0) {
      return;
    }

    /*
     * Une seule fenêtre est conservée par groupe : celle qui contient
     * le plus grand nombre de pénalités.
     *
     * À égalité :
     * - une fenêtre sans carton est privilégiée ;
     * - puis la fenêtre la plus ancienne est conservée.
     */
    const peak = candidates.reduce((best, candidate) => {
      if (candidate.count > best.count) {
        return candidate;
      }

      if (candidate.count === best.count) {
        if (candidate.hasCard !== best.hasCard) {
          return candidate.hasCard ? best : candidate;
        }

        return candidate.anchor.time < best.anchor.time
          ? candidate
          : best;
      }

      return best;
    }, candidates[0]);

    if (peak.count < 3) {
      return;
    }

    const firstPenalty = peak.windowPenalties[0];
    const lastPenalty =
      peak.windowPenalties[peak.windowPenalties.length - 1];

    const severity = peak.hasCard
      ? "managed"
      : peak.count >= 5
        ? "red"
        : peak.count === 4
          ? "warning"
          : "observation";

    const alertLevel = peak.hasCard
      ? "none"
      : peak.count >= 5
        ? "red"
        : peak.count === 4
          ? "warning"
          : "none";

    windows.push({
      id: `${team}-${groupIndex}-${firstPenalty.order}`,
      team,

      startTime: firstPenalty.time,
      endTime: lastPenalty.time,

      windowStart: peak.windowStart,
      windowEnd: peak.windowEnd,

      count: peak.count,
      totalPenalties: group.length,

      hasCard: peak.hasCard,
      cardCount: peak.windowCards.length,

      cards: peak.windowCards.map((card) => ({
        time: card.time,
        type: card.type,
        detail: card.detail ?? "",
      })),

      /*
       * Ces deux champs sont conservés pour compatibilité avec les
       * anciennes versions du rapport et des composants.
       */
      hasInterruption: peak.hasCard,
      interruptionTime: peak.windowCards[0]?.time ?? null,
      interruptionType: peak.windowCards[0]?.type ?? null,

      severity,
      alertLevel,
    });
  });

  return windows;
}

/**
 * Analyse les points encaissés par chaque équipe pendant les périodes
 * d'infériorité numérique dues à ses cartons.
 *
 * Hypothèses :
 * - carton jaune / blanc : durée configurée dans le JSON ;
 * - carton rouge : jusqu'à la fin du match ;
 * - une fenêtre [début, fin) : un score exactement à la fin de la
 *   suspension n'est pas compté ;
 * - un score n'est compté qu'une fois, même si plusieurs cartes se
 *   chevauchent ;
 * - si la carte et le score ont le même temps, l'ordre source est utilisé.
 */
function buildCardDisadvantageAnalysis(events, match, fullTime) {
  const windows = {
    HOME: [],
    AWAY: [],
  };

  const cards = events.filter(isCardEvent);

  cards.forEach((card) => {
    const team = teamFor(card, match);

    if (team !== "HOME" && team !== "AWAY") {
      return;
    }

    const canonicalType = typeKey(card.type);
    let durationMinutes = null;
    let endTime = null;

    if (canonicalType === "yellow card") {
      const configuredDuration = Number(match.yellowCardDuration);

      durationMinutes = Number.isFinite(configuredDuration)
        ? Math.max(0, configuredDuration)
        : 10;

      endTime = Math.min(
        fullTime,
        card.time + durationMinutes,
      );
    }

    if (canonicalType === "white card") {
      const configuredDuration = Number(match.whiteCardDuration);

      durationMinutes = Number.isFinite(configuredDuration)
        ? Math.max(0, configuredDuration)
        : 10;

      endTime = Math.min(
        fullTime,
        card.time + durationMinutes,
      );
    }

    if (canonicalType === "red card") {
      endTime = fullTime;
      durationMinutes = Math.max(0, endTime - card.time);
    }

    if (
      endTime === null ||
      !Number.isFinite(endTime) ||
      endTime <= card.time
    ) {
      return;
    }

    windows[team].push({
      card,
      startTime: card.time,
      endTime,
      startOrder: card.order,
      durationMinutes,
    });
  });

  const result = {
    HOME: {
      points: 0,
      scoreCount: 0,
      cardCount: windows.HOME.length,
      cardWindows: windows.HOME,
      scores: [],
    },
    AWAY: {
      points: 0,
      scoreCount: 0,
      cardCount: windows.AWAY.length,
      cardWindows: windows.AWAY,
      scores: [],
    },
  };

  const scoreEvents = events.filter(isScoreEvent);

  scoreEvents.forEach((score) => {
    const scoringTeam = teamFor(score, match);

    if (scoringTeam !== "HOME" && scoringTeam !== "AWAY") {
      return;
    }

    const disadvantagedTeam =
      scoringTeam === "HOME" ? "AWAY" : "HOME";

    /*
     * La recherche porte sur toutes les sanctions de l'équipe en
     * infériorité. Le premier point d'infériorité est conservé pour
     * expliquer le score, mais chaque score n'est ajouté qu'une fois.
     */
    const matchingWindow = result[
      disadvantagedTeam
    ].cardWindows.find(
      (window) =>
        score.order > window.startOrder &&
        score.time < window.endTime,
    );

    if (!matchingWindow) {
      return;
    }

    const points = Math.max(0, scorePoints(score));

    result[disadvantagedTeam].points += points;
    result[disadvantagedTeam].scoreCount += 1;
    result[disadvantagedTeam].scores.push({
      event: score,
      points,
      scoringTeam,
      card: matchingWindow.card,
      startTime: matchingWindow.startTime,
      endTime: matchingWindow.endTime,
    });
  });

  return result;
}

export function analyzeMatch(match, configuredWeights = DEFAULT_WEIGHTS) {
  const weights = { ...DEFAULT_WEIGHTS, ...configuredWeights };

  const events = [...(match.events ?? [])]
    .sort(
      (first, second) =>
        first.time - second.time ||
        (first.sourceOrder ?? 0) - (second.sourceOrder ?? 0),
    )
    .map((event, order) => ({ ...event, order }));

  const halfTimeEvent = events.find(
    (event) => typeKey(event.type) === "half time",
  );

  const fullTimeEvent = events.find(
    (event) => typeKey(event.type) === "full time",
  );

  const lastEventTime = events.reduce(
    (latest, event) => Math.max(latest, event.time),
    0,
  );

  const configuredMatchDuration = Number(match.matchDuration);
  const fallbackMatchDuration =
    Number.isFinite(configuredMatchDuration) &&
    configuredMatchDuration > 0
      ? configuredMatchDuration
      : 80;


  const halfTime = halfTimeEvent?.time ?? 40;
  const fullTime = fullTimeEvent?.time ?? Math.max(fallbackMatchDuration, lastEventTime);
  const analysisDuration = Math.max(fullTime, lastEventTime, fallbackMatchDuration);

  const periodFor = (time) => (time < halfTime ? 1 : 2);

  const penalties = events.filter(isPenaltyEvent);
  const cards = events.filter(isCardEvent);
  const scoreEvents = events.filter(isScoreEvent);
  const advantageEvents = events.filter(isAdvantageEvent);

  const penaltyTotals = {
    HOME: 0,
    AWAY: 0,
    UNKNOWN: 0,
  };

  const penaltyHalfTotals = {
    HOME: { first: 0, second: 0 },
    AWAY: { first: 0, second: 0 },
    UNKNOWN: { first: 0, second: 0 },
  };

  const penaltyTypeMap = new Map();

  penalties.forEach((penalty) => {
    const team = teamFor(penalty, match);
    const period = periodFor(penalty.time);
    const detail = penalty.detail || "Type non précisé";

    penaltyTotals[team] += 1;
    penaltyHalfTotals[team][period === 1 ? "first" : "second"] += 1;

    if (!penaltyTypeMap.has(detail)) {
      penaltyTypeMap.set(detail, {
        detail,
        total: 0,
        HOME: { first: 0, second: 0, total: 0 },
        AWAY: { first: 0, second: 0, total: 0 },
        UNKNOWN: { first: 0, second: 0, total: 0 },
      });
    }

    const record = penaltyTypeMap.get(detail);
    record.total += 1;
    record[team][period === 1 ? "first" : "second"] += 1;
    record[team].total += 1;
  });

  const penaltyTypes = [...penaltyTypeMap.values()]
    .map((record) => ({
      ...record,
      share: penalties.length
        ? (record.total / penalties.length) * 100
        : 0,
    }))
    .sort((first, second) => second.total - first.total);

  const cardsByColor = {
    yellow: { label: "Jaunes", total: 0, HOME: 0, AWAY: 0, UNKNOWN: 0 },
    white: { label: "Blancs", total: 0, HOME: 0, AWAY: 0, UNKNOWN: 0 },
    red: { label: "Rouges", total: 0, HOME: 0, AWAY: 0, UNKNOWN: 0 },
  };

  cards.forEach((card) => {
    const key = typeKey(card.type).split(" ")[0];
    const team = teamFor(card, match);

    if (cardsByColor[key]) {
      cardsByColor[key].total += 1;
      cardsByColor[key][team] += 1;
    }
  });

  const scoreTotals = { HOME: 0, AWAY: 0, UNKNOWN: 0 };
  const halfTimeScore = { HOME: 0, AWAY: 0, UNKNOWN: 0 };

  scoreEvents.forEach((event) => {
    const team = teamFor(event, match);
    const points = scorePoints(event);

    scoreTotals[team] += points;

    if (event.time < halfTime) {
      halfTimeScore[team] += points;
    }
  });

  const pointsConcededUnderDisadvantage =
    buildCardDisadvantageAnalysis(events, match, fullTime);

  const periodCount = Math.max(1, Math.ceil(analysisDuration / 10));

  const periods = Array.from({ length: periodCount }, (_, index) => {
    const start = index * 10;
    const end = Math.min(analysisDuration, start + 10);

    return {
      index,
      start,
      end,
      label: `${start}–${Math.ceil(end)}e`,
      homePenalties: 0,
      awayPenalties: 0,
      total: 0,
      homeCards: [],
      awayCards: [],
    };
  });

  const periodIndex = (time) =>
    Math.min(periodCount - 1, Math.max(0, Math.floor(time / 10)));

  penalties.forEach((penalty) => {
    const period = periods[periodIndex(penalty.time)];
    const team = teamFor(penalty, match);

    period.total += 1;

    if (team === "HOME") period.homePenalties += 1;
    if (team === "AWAY") period.awayPenalties += 1;
  });

  cards.forEach((card) => {
    const period = periods[periodIndex(card.time)];
    const team = teamFor(card, match);
    const marker = {
      event: card,
      time: card.time,
      type: card.type,
      color: cardColor(card),
    };

    if (team === "HOME") period.homeCards.push(marker);
    if (team === "AWAY") period.awayCards.push(marker);
  });

  let cumulativeHome = 0;
  let cumulativeAway = 0;

  const cumulativePeriods = periods.map((period) => {
    cumulativeHome += period.homePenalties;
    cumulativeAway += period.awayPenalties;

    return {
      ...period,
      cumulativeHome,
      cumulativeAway,
    };
  });

  const momentumSeries = ["HOME", "AWAY"]
    .flatMap((team) => detectMomentumForTeam(events, match, team))
    .sort((first, second) => first.startTime - second.startTime);

  const advantageResults = advantageEvents.map((event, index) => {
    const nextEvent = events[index + 1] ?? null;
    const deltaSeconds = nextEvent
      ? Math.max(0, (nextEvent.time - event.time) * 60)
      : null;

    let category;
    let reason;

    if (nextEvent && isScoreEvent(nextEvent)) {
      category = "++";
      reason = "L’événement suivant est un score.";
    } else if (
      nextEvent &&
      deltaSeconds !== null &&
      deltaSeconds <= 45
    ) {
      category = "-";
      reason = "L’événement suivant survient dans les 45 secondes.";
    } else {
      category = "+";
      reason = nextEvent
        ? "L’événement suivant survient après 45 secondes."
        : "Aucun événement chronologique suivant.";
    }

    return {
      event,
      team: teamFor(event, match),
      period: periodFor(event.time),
      category,
      reason,
      nextEvent,
      deltaSeconds,
    };
  });

  const advantageTotals = {
    total: advantageResults.length,
    firstHalf: advantageResults.filter((item) => item.period === 1).length,
    secondHalf: advantageResults.filter((item) => item.period === 2).length,
    minus: advantageResults.filter((item) => item.category === "-").length,
    plus: advantageResults.filter((item) => item.category === "+").length,
    plusPlus: advantageResults.filter((item) => item.category === "++").length,
  };

  const disciplineTeams = {};

  ["HOME", "AWAY"].forEach((team) => {
    const teamSeries = momentumSeries.filter(
      (series) => series.team === team,
    );

    const moderateSeries = teamSeries.filter(
      (series) => series.severity === "warning",
    ).length;

    const highSeries = teamSeries.filter(
      (series) => series.severity === "red",
    ).length;

    const base =
      penaltyTotals[team] * weights.penalty +
      cardsByColor.white[team] * weights.whiteCard +
      cardsByColor.yellow[team] * weights.yellowCard +
      cardsByColor.red[team] * weights.redCard;

    const seriesBonus =
      moderateSeries * weights.moderateSeries +
      highSeries * weights.highSeries;

    disciplineTeams[team] = {
      penalties: penaltyTotals[team],
      cards: {
        white: cardsByColor.white[team],
        yellow: cardsByColor.yellow[team],
        red: cardsByColor.red[team],
      },
      seriesCount: teamSeries.length,
      moderateSeries,
      highSeries,
      base,
      seriesBonus,
      score: Math.round((base + seriesBonus) * 10) / 10,
    };
  });

  const mostSanctionedTeam =
    disciplineTeams.HOME.score >= disciplineTeams.AWAY.score
      ? "HOME"
      : "AWAY";

  const mostDisciplinedPeriod = [...periods].sort(
    (first, second) =>
      second.total - first.total || first.start - second.start,
  )[0];

  return {
    events,
    pointsConcededUnderDisadvantage,
    boundaries: {
      halfTime,
      fullTime,
      halfTimeSource: halfTimeEvent ? "event" : "fallback",
      fullTimeSource: fullTimeEvent ? "event" : "fallback",
    },
    penalties,
    cards,
    scoreEvents,
    penaltyTypes,
    penaltyTotals,
    penaltyHalfTotals,
    cardsByColor,
    scoreTotals,
    halfTimeScore,
    periods,
    cumulativePeriods,
    momentumSeries,
    advantageResults,
    advantageTotals,
    discipline: {
      teams: disciplineTeams,
      mostSanctionedTeam,
    },
    mostFrequentFoul: penaltyTypes[0] ?? null,
    mostDisciplinedPeriod,
    weights,
  };
}

export function disciplineFormula(weights) {
  return [
    `Pénalité × ${weights.penalty}`,
    `carton blanc × ${weights.whiteCard}`,
    `carton jaune × ${weights.yellowCard}`,
    `carton rouge × ${weights.redCard}`,
    `alerte 4 fautes sans carton +${weights.moderateSeries}`,
    `alerte rouge 5+ sans carton +${weights.highSeries}`,
  ].join(" + ");
}
