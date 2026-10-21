import {
  disciplineFormula,
  formatMatchMinute,
  isTimelineEvent,
  scorePoints,
  teamFor,
  typeKey,
} from "../lib/analytics";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const styles = {
  page: {
    position: "relative",
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#ffffff",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  content: {
    padding: "26px 42px 70px",
  },
  title: {
    margin: 0,
    fontSize: 23,
    fontWeight: 800,
    letterSpacing: "-0.025em",
  },
  subtitle: {
    margin: "6px 0 20px",
    color: "#64748b",
    fontSize: 10.5,
    lineHeight: 1.6,
  },
  sectionTitle: {
    margin: "0 0 13px",
    fontSize: 15,
    fontWeight: 800,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 9,
  },
  th: {
    padding: "9px 8px",
    textAlign: "left",
    background: "#f8fafc",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 800,
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
  },
};

function chunk(items, size, includeEmpty = false) {
  if (!items.length) {
    return includeEmpty ? [[]] : [];
  }

  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function formatDate(value) {
  if (!value) {
    return "Date non communiquée";
  }

  const normalized = String(value).includes("T")
    ? value
    : `${value}T12:00:00`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getTeamName(team, match) {
  if (team === "HOME") {
    return match.homeTeamName;
  }

  if (team === "AWAY") {
    return match.awayTeamName;
  }

  return "Équipe non précisée";
}

function getTeamColor(team, match) {
  if (team === "HOME") {
    return match.homeTeamColor;
  }

  if (team === "AWAY") {
    return match.awayTeamColor;
  }

  return "#94a3b8";
}

/**
 * Lit le nombre de cartons de manière compatible avec les différentes
 * structures de données possibles.
 */
function getCardCount(analysis, color, team) {
  const bucket = analysis.cardsByColor?.[color];

  return bucket?.teams?.[team] ?? bucket?.[team] ?? 0;
}

function getTotalCards(analysis) {
  return ["yellow", "white", "red"].reduce(
    (total, color) => total + getCardCount(analysis, color, "HOME"),
    0,
  ) + ["yellow", "white", "red"].reduce(
    (total, color) => total + getCardCount(analysis, color, "AWAY"),
    0,
  );
}

function getDisadvantagePoints(analysis, team) {
  return (
    analysis.pointsConcededUnderDisadvantage?.[team]?.points ?? 0
  );
}

function getDisadvantageScoreCount(analysis, team) {
  return (
    analysis.pointsConcededUnderDisadvantage?.[team]?.scoreCount ?? 0
  );
}

function ReportHeader({ analysis, match }) {
  const homeScore = analysis.scoreTotals?.HOME ?? 0;
  const awayScore = analysis.scoreTotals?.AWAY ?? 0;

  return (
    <>
      <div
        style={{
          height: 8,
          background: `linear-gradient(90deg, ${match.homeTeamColor}, ${match.awayTeamColor})`,
        }}
      />

      <header
        style={{
          padding: "18px 42px 16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              color: "#2563eb",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Rugby Discipline — Rapport d’analyse
          </div>

          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            {match.matchLevel || "Niveau non communiqué"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              minWidth: 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                flex: "0 0 auto",
                borderRadius: 999,
                background: match.homeTeamColor,
                boxShadow: "0 0 0 3px #f1f5f9",
              }}
            />

            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {match.homeTeamName}
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              {homeScore} – {awayScore}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#94a3b8",
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Score final
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 9,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {match.awayTeamName}
            </span>

            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                flex: "0 0 auto",
                borderRadius: 999,
                background: match.awayTeamColor,
                boxShadow: "0 0 0 3px #f1f5f9",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 28,
            marginTop: 14,
            color: "#64748b",
            fontSize: 8.5,
          }}
        >
          <span>
            <strong>Date :</strong> {formatDate(match.matchDate)}
          </span>

          <span>
            <strong>Arbitre :</strong>{" "}
            {match.refereeName || "Non communiqué"}
          </span>

          <span>
            <strong>Match :</strong>{" "}
            {match.matchLevel || "Niveau non communiqué"}
          </span>
        </div>
      </header>
    </>
  );
}

function ReportFooter({ analysis, page, total }) {
  return (
    <footer
      style={{
        position: "absolute",
        left: 42,
        right: 42,
        bottom: 22,
        display: "flex",
        justifyContent: "space-between",
        borderTop: "1px solid #e2e8f0",
        paddingTop: 9,
        color: "#94a3b8",
        fontSize: 8,
      }}
    >
      <span>
        Mi-temps {formatMatchMinute(analysis.boundaries.halfTime)} · Fin{" "}
        {formatMatchMinute(analysis.boundaries.fullTime)}
      </span>

      <span>
        Page {page} / {total}
      </span>
    </footer>
  );
}

function PdfPage({
  analysis,
  match,
  page,
  total,
  children,
}) {
  return (
    <section
      className="pdf-page"
      data-pdf-page="true"
      style={styles.page}
    >
      <ReportHeader analysis={analysis} match={match} />

      {children}

      <ReportFooter
        analysis={analysis}
        page={page}
        total={total}
      />
    </section>
  );
}

function ReportKpi({ label, value, helper }) {
  return (
    <div
      style={{
        minWidth: 0,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 13,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 7.5,
          fontWeight: 800,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 21,
          fontWeight: 800,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 3,
          color: "#94a3b8",
          fontSize: 8,
          lineHeight: 1.4,
        }}
      >
        {helper}
      </div>
    </div>
  );
}

function SummaryPage({ analysis, match }) {
  const penaltyTotal = analysis.penalties?.length ?? 0;
  const cardTotal = getTotalCards(analysis);

  const leaderTeam =
    analysis.discipline?.mostSanctionedTeam ?? "HOME";

  const leaderName = getTeamName(leaderTeam, match);

  const leaderScore =
    analysis.discipline?.teams?.[leaderTeam]?.score ?? 0;

  const disadvantageTotal =
    getDisadvantagePoints(analysis, "HOME") +
    getDisadvantagePoints(analysis, "AWAY");

  const teams = [
    {
      key: "HOME",
      name: match.homeTeamName,
      color: match.homeTeamColor,
    },
    {
      key: "AWAY",
      name: match.awayTeamName,
      color: match.awayTeamColor,
    },
  ];

  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Synthèse du match</h1>

      <p style={styles.subtitle}>
        Indicateurs disciplinaires, pénalités et cartons par équipe.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <ReportKpi
          label="Pénalités"
          value={penaltyTotal}
          helper={`${
            analysis.penaltyTotals?.HOME ?? 0
          } domicile · ${
            analysis.penaltyTotals?.AWAY ?? 0
          } extérieur`}
        />

        <ReportKpi
          label="Cartons"
          value={cardTotal}
          helper={`${
            analysis.cardsByColor?.yellow?.total ?? 0
          } jaunes · ${
            analysis.cardsByColor?.white?.total ?? 0
          } blancs · ${
            analysis.cardsByColor?.red?.total ?? 0
          } rouges`}
        />

        <ReportKpi
          label="Score à la mi-temps"
          value={`${analysis.halfTimeScore?.HOME ?? 0}–${
            analysis.halfTimeScore?.AWAY ?? 0
          }`}
          helper={formatMatchMinute(analysis.boundaries.halfTime)}
        />

        <ReportKpi
          label="Équipe la plus sanctionnée"
          value={leaderName}
          helper={`Indice disciplinaire : ${leaderScore}`}
        />

        <ReportKpi
          label="Points en infériorité"
          value={disadvantageTotal}
          helper="Points encaissés pendant une suspension"
        />

        <ReportKpi
          label="Fenêtres analysées"
          value={analysis.momentumSeries?.length ?? 0}
          helper="Fenêtres glissantes de dix minutes"
        />
      </div>

      <h2 style={styles.sectionTitle}>
        Pénalités et cartons par équipe
      </h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Équipe</th>
            <th style={styles.th}>1re</th>
            <th style={styles.th}>2e</th>
            <th style={styles.th}>Pén. total</th>
            <th style={styles.th}>Jaunes</th>
            <th style={styles.th}>Blancs</th>
            <th style={styles.th}>Rouges</th>
            <th style={styles.th}>Cartons</th>
            <th style={styles.th}>Indice</th>
          </tr>
        </thead>

        <tbody>
          {teams.map((team) => {
            const firstHalf =
              analysis.penaltyHalfTotals?.[team.key]?.first ?? 0;

            const secondHalf =
              analysis.penaltyHalfTotals?.[team.key]?.second ?? 0;

            const penalties =
              analysis.penaltyTotals?.[team.key] ?? 0;

            const yellow = getCardCount(
              analysis,
              "yellow",
              team.key,
            );

            const white = getCardCount(
              analysis,
              "white",
              team.key,
            );

            const red = getCardCount(
              analysis,
              "red",
              team.key,
            );

            const cards = yellow + white + red;

            const disciplineScore =
              analysis.discipline?.teams?.[team.key]?.score ?? 0;

            return (
              <tr key={team.key}>
                <td style={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      marginRight: 7,
                      borderRadius: 999,
                      background: team.color,
                    }}
                  />

                  <strong>{team.name}</strong>
                </td>

                <td style={styles.td}>{firstHalf}</td>
                <td style={styles.td}>{secondHalf}</td>
                <td style={{ ...styles.td, fontWeight: 800 }}>
                  {penalties}
                </td>

                <td style={styles.td}>{yellow}</td>
                <td style={styles.td}>{white}</td>
                <td style={styles.td}>{red}</td>

                <td style={{ ...styles.td, fontWeight: 800 }}>
                  {cards}
                </td>

                <td style={{ ...styles.td, fontWeight: 800 }}>
                  {disciplineScore}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 20,
        }}
      >
        <div
          style={{
            padding: 15,
            borderRadius: 13,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            Formule d’indiscipline
          </h3>

          <div
            style={{
              color: "#475569",
              fontSize: 9,
              lineHeight: 1.7,
            }}
          >
            {disciplineFormula(analysis.weights)}
          </div>
        </div>

        <div
          style={{
            padding: 15,
            borderRadius: 13,
            background: "#eff6ff",
            color: "#1e3a8a",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            Impact de l’infériorité numérique
          </h3>

          {teams.map((team) => (
            <div
              key={team.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 5,
                fontSize: 9,
              }}
            >
              <span>{team.name}</span>

              <strong>
                {getDisadvantagePoints(analysis, team.key)} points ·{" "}
                {getDisadvantageScoreCount(
                  analysis,
                  team.key,
                )}{" "}
                score(s)
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PenaltyDetailsPage({
  analysis,
  rows,
  page,
  totalPages,
}) {
  const penaltyTotal = analysis.penalties?.length ?? 0;

  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Détail des pénalités concédées</h1>

      <p style={styles.subtitle}>
        Répartition par type de faute, équipe et mi-temps.
        {totalPages > 1 ? ` Page ${page}/${totalPages}.` : ""}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <ReportKpi
          label="Total des pénalités"
          value={penaltyTotal}
          helper="Toutes équipes confondues"
        />

        <ReportKpi
          label="Types de fautes"
          value={analysis.penaltyTypes?.length ?? 0}
          helper="Types distincts"
        />

        <ReportKpi
          label="Faute la plus fréquente"
          value={
            analysis.mostFrequentFoul?.detail ?? "Aucune"
          }
          helper={
            analysis.mostFrequentFoul
              ? `${analysis.mostFrequentFoul.total} occurrence(s)`
              : "Aucune pénalité"
          }
        />
      </div>

      {rows.length === 0 ? (
        <p
          style={{
            padding: 30,
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
            background: "#f8fafc",
            color: "#64748b",
            textAlign: "center",
            fontSize: 10,
          }}
        >
          Aucune pénalité concédée dans ce match.
        </p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type de faute</th>
              <th style={styles.th}>Dom. 1re</th>
              <th style={styles.th}>Dom. 2e</th>
              <th style={styles.th}>Dom. total</th>
              <th style={styles.th}>Ext. 1re</th>
              <th style={styles.th}>Ext. 2e</th>
              <th style={styles.th}>Ext. total</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Part</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.detail}>
                <td style={styles.td}>
                  <strong>{row.detail}</strong>
                </td>

                <td style={styles.td}>{row.HOME?.first ?? 0}</td>
                <td style={styles.td}>{row.HOME?.second ?? 0}</td>

                <td
                  style={{
                    ...styles.td,
                    fontWeight: 800,
                  }}
                >
                  {row.HOME?.total ?? 0}
                </td>

                <td style={styles.td}>{row.AWAY?.first ?? 0}</td>
                <td style={styles.td}>{row.AWAY?.second ?? 0}</td>

                <td
                  style={{
                    ...styles.td,
                    fontWeight: 800,
                  }}
                >
                  {row.AWAY?.total ?? 0}
                </td>

                <td
                  style={{
                    ...styles.td,
                    fontWeight: 800,
                  }}
                >
                  {row.total}
                </td>

                <td style={styles.td}>
                  {row.share.toFixed(1)} %
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
              <td style={styles.td}>Total match</td>
              <td style={styles.td}>
                {analysis.penaltyHalfTotals?.HOME?.first ?? 0}
              </td>
              <td style={styles.td}>
                {analysis.penaltyHalfTotals?.HOME?.second ?? 0}
              </td>
              <td style={styles.td}>
                {analysis.penaltyTotals?.HOME ?? 0}
              </td>
              <td style={styles.td}>
                {analysis.penaltyHalfTotals?.AWAY?.first ?? 0}
              </td>
              <td style={styles.td}>
                {analysis.penaltyHalfTotals?.AWAY?.second ?? 0}
              </td>
              <td style={styles.td}>
                {analysis.penaltyTotals?.AWAY ?? 0}
              </td>
              <td style={styles.td}>{penaltyTotal}</td>
              <td style={styles.td}>100 %</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

function timelineCategory(event) {
  const canonicalType = typeKey(event.type);

  if (canonicalType === "penalty conceded") {
    return "penalty";
  }

  if (canonicalType === "yellow card") {
    return "yellow";
  }

  if (canonicalType === "white card") {
    return "white";
  }

  if (canonicalType === "red card") {
    return "red";
  }

  return "score";
}

function timelineCategoryStyle(category) {
  switch (category) {
    case "penalty":
      return {
        label: "Pénalité",
        color: "#b45309",
        background: "#fffbeb",
        border: "#fde68a",
      };

    case "yellow":
      return {
        label: "Carton jaune",
        color: "#854d0e",
        background: "#fef9c3",
        border: "#fde047",
      };

    case "white":
      return {
        label: "Carton blanc",
        color: "#475569",
        background: "#f8fafc",
        border: "#cbd5e1",
      };

    case "red":
      return {
        label: "Carton rouge",
        color: "#991b1b",
        background: "#fef2f2",
        border: "#fecaca",
      };

    default:
      return {
        label: "Score",
        color: "#166534",
        background: "#f0fdf4",
        border: "#bbf7d0",
      };
  }
}

function buildTimelineRows(analysis, match) {
  const halfTime = analysis.boundaries?.halfTime ?? 40;
  const fullTime = analysis.boundaries?.fullTime ?? 80;

  const milestones = [
    {
      kind: "milestone",
      key: "start",
      time: 0,
      sortRank: 0,
      label: "Début du match",
      detail: "Coup d’envoi",
    },
    {
      kind: "milestone",
      key: "half-time",
      time: halfTime,
      sortRank: 1,
      label: "Mi-temps",
      detail: `Score : ${
        analysis.halfTimeScore?.HOME ?? 0
      } – ${analysis.halfTimeScore?.AWAY ?? 0}`,
    },
    {
      kind: "milestone",
      key: "full-time",
      time: fullTime,
      sortRank: 3,
      label: "Fin du match",
      detail: `Score final : ${
        analysis.scoreTotals?.HOME ?? 0
      } – ${analysis.scoreTotals?.AWAY ?? 0}`,
    },
  ];

  const eventRows = (analysis.events ?? [])
    .filter(
      (event) =>
        isTimelineEvent(event) &&
        event.time >= 0 &&
        event.time <= fullTime,
    )
    .map((event) => ({
      kind: "event",
      key: `event-${event.order}`,
      time: event.time,
      sortRank: 2,
      event,
    }));

  return [...milestones, ...eventRows].sort((first, second) => {
    if (first.time !== second.time) {
      return first.time - second.time;
    }

    if (first.sortRank !== second.sortRank) {
      return first.sortRank - second.sortRank;
    }

    return (first.event?.order ?? 0) - (second.event?.order ?? 0);
  });
}

function TimelinePage({
  analysis,
  match,
  rows,
  page,
  totalPages,
}) {
  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Timeline du match</h1>

      <p style={styles.subtitle}>
        Présentation chronologique : début du match, événements, mi-temps,
        événements et fin du match.
        {totalPages > 1 ? ` Page ${page}/${totalPages}.` : ""}
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: "9%" }}>Minute</th>
            <th style={{ ...styles.th, width: "18%" }}>Type</th>
            <th style={{ ...styles.th, width: "20%" }}>Équipe</th>
            <th style={styles.th}>Détail</th>
            <th style={{ ...styles.th, width: "8%" }}>Points</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            if (row.kind === "milestone") {
              return (
                <tr
                  key={row.key}
                  style={{
                    background:
                      row.key === "half-time" ? "#eff6ff" : "#f8fafc",
                  }}
                >
                  <td
                    colSpan={5}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      padding: "12px 8px",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          row.key === "half-time"
                            ? "#2563eb"
                            : "#0f172a",
                      }}
                    >
                      {row.label}
                    </strong>

                    <span style={{ color: "#64748b" }}>
                      {" "}
                      — {row.detail} —{" "}
                      {formatMatchMinute(row.time)}
                    </span>
                  </td>
                </tr>
              );
            }

            const event = row.event;
            const category = timelineCategory(event);
            const categoryStyle = timelineCategoryStyle(category);

            const team = teamFor(event, match);
            const teamName = getTeamName(team, match);
            const teamColor = getTeamColor(team, match);

            const points =
              category === "score" ? scorePoints(event) : null;

            return (
              <tr key={row.key}>
                <td
                  style={{
                    ...styles.td,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatMatchMinute(event.time)}
                </td>

                <td style={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 7px",
                      borderRadius: 999,
                      border: `1px solid ${categoryStyle.border}`,
                      background: categoryStyle.background,
                      color: categoryStyle.color,
                      fontSize: 7.5,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {categoryStyle.label}
                  </span>
                </td>

                <td style={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      marginRight: 6,
                      borderRadius: 999,
                      background: teamColor,
                    }}
                  />

                  {teamName}
                </td>

                <td style={styles.td}>
                  {event.detail || event.type}
                </td>

                <td
                  style={{
                    ...styles.td,
                    textAlign: "center",
                    fontWeight: 800,
                  }}
                >
                  {points !== null ? `+${points}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          marginTop: 16,
          color: "#64748b",
          fontSize: 8,
        }}
      >
        <span>Pénalité</span>
        <span>Carton jaune</span>
        <span>Carton blanc</span>
        <span>Carton rouge</span>
        <span>Score</span>
      </div>
    </div>
  );
}

function MomentumPage({ analysis, match, rows }) {
  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Séries de pénalités et alertes</h1>

      <p style={styles.subtitle}>
        Fenêtres glissantes de dix minutes. Un carton de la même équipe dans
        la fenêtre neutralise l’alerte correspondante.
      </p>

      {rows.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 10 }}>
          Aucune fenêtre analysée.
        </p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Équipe</th>
              <th style={styles.th}>Début</th>
              <th style={styles.th}>Fin</th>
              <th style={styles.th}>Pénalités</th>
              <th style={styles.th}>Carton</th>
              <th style={styles.th}>Niveau</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((series) => {
              const hasCard =
                series.hasCard ?? series.hasInterruption ?? false;

              const level = hasCard
                ? "Prise en charge"
                : series.count >= 5
                  ? "Alerte rouge"
                  : series.count === 4
                    ? "Alerte"
                    : "Observation";

              return (
                <tr key={series.id}>
                  <td style={styles.td}>
                    {getTeamName(series.team, match)}
                  </td>

                  <td style={styles.td}>
                    {formatMatchMinute(series.startTime)}
                  </td>

                  <td style={styles.td}>
                    {formatMatchMinute(series.endTime)}
                  </td>

                  <td style={{ ...styles.td, fontWeight: 800 }}>
                    {series.count}
                  </td>

                  <td style={styles.td}>
                    {hasCard ? "Oui" : "Non"}
                  </td>

                  <td
                    style={{
                      ...styles.td,
                      fontWeight: 800,
                      color:
                        level === "Alerte rouge"
                          ? "#dc2626"
                          : level === "Alerte"
                            ? "#d97706"
                            : "#475569",
                    }}
                  >
                    {level}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdvantagesPage({ analysis, match, rows }) {
  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Analyse des avantages</h1>

      <p style={styles.subtitle}>
        {analysis.advantageTotals?.total ?? 0} avantage(s) :{" "}
        {analysis.advantageTotals?.minus ?? 0} « - »,{" "}
        {analysis.advantageTotals?.plus ?? 0} « + »,{" "}
        {analysis.advantageTotals?.plusPlus ?? 0} « ++ ».
      </p>

      {rows.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 10 }}>
          Aucun avantage détecté.
        </p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Minute</th>
              <th style={styles.th}>Équipe</th>
              <th style={styles.th}>Mi-temps</th>
              <th style={styles.th}>Résultat</th>
              <th style={styles.th}>Événement suivant</th>
              <th style={styles.th}>Écart</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((result) => (
              <tr key={result.event.order}>
                <td style={styles.td}>
                  {formatMatchMinute(result.event.time)}
                </td>

                <td style={styles.td}>
                  {getTeamName(result.team, match)}
                </td>

                <td style={styles.td}>
                  {result.period === 1 ? "1re" : "2e"}
                </td>

                <td
                  style={{
                    ...styles.td,
                    fontWeight: 800,
                  }}
                >
                  Advantage{result.category}
                </td>

                <td style={styles.td}>
                  {result.nextEvent?.type ?? "Aucun"}
                </td>

                <td style={styles.td}>
                  {result.deltaSeconds !== null
                    ? `${result.deltaSeconds} s`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MethodologyPage() {
  return (
    <div style={styles.content}>
      <h1 style={styles.title}>Méthodologie et hypothèses</h1>

      <p style={styles.subtitle}>
        Règles utilisées pour produire les indicateurs de ce rapport.
      </p>

      <ol
        style={{
          margin: 0,
          paddingLeft: 20,
          color: "#475569",
          fontSize: 10,
          lineHeight: 1.8,
        }}
      >
        <li>
          Les événements sont triés par temps croissant, puis par ordre
          source en cas d’égalité.
        </li>

        <li>
          La mi-temps utilise l’événement « Half Time ». En son absence,
          une valeur de secours de 40 minutes est appliquée.
        </li>

        <li>
          La fin du match utilise « Full Time ». En son absence, la durée
          minimale configurée dans le JSON est utilisée.
        </li>

        <li>
          Une fenêtre de vigilance couvre dix minutes et ne compte que les
          pénalités de la même équipe.
        </li>

        <li>
          Un carton de la même équipe dans la fenêtre neutralise l’alerte.
          Sans carton, trois pénalités déclenchent une observation, quatre
          une alerte et cinq ou plus une alerte rouge.
        </li>

        <li>
          Les points encaissés pendant l’infériorité numérique correspondent
          aux points marqués par l’adversaire pendant une suspension.
        </li>

        <li>
          La timeline PDF ne présente que les pénalités, les cartons et les
          événements de score, avec les repères de début, mi-temps et fin.
        </li>

        <li>
          L’indice d’indiscipline est un score synthétique et non normalisé,
          destiné à comparer les deux équipes du même match.
        </li>
      </ol>

      <div
        style={{
          marginTop: 22,
          padding: 16,
          borderRadius: 13,
          background: "#eff6ff",
          color: "#1e3a8a",
          fontSize: 9.5,
          lineHeight: 1.7,
        }}
      >
        <strong>Formule d’indiscipline :</strong> pénalité 1, carton blanc
        2, carton jaune 3, carton rouge 5, alerte de quatre fautes sans
        carton +2 et alerte rouge de cinq fautes ou plus sans carton +4.
      </div>
    </div>
  );
}

export default function PdfReport({ analysis, match }) {
  const penaltyChunks = chunk(
    analysis.penaltyTypes ?? [],
    12,
    true,
  );

  const timelineRows = buildTimelineRows(analysis, match);
  const timelineChunks = chunk(timelineRows, 14, true);

  const momentumChunks = chunk(
    analysis.momentumSeries ?? [],
    9,
  );

  const advantageChunks = chunk(
    analysis.advantageResults ?? [],
    10,
  );

  const pageDefinitions = [
    { kind: "summary" },

    ...penaltyChunks.map((rows, index) => ({
      kind: "penalties",
      rows,
      page: index + 1,
      totalPages: penaltyChunks.length,
    })),

    ...timelineChunks.map((rows, index) => ({
      kind: "timeline",
      rows,
      page: index + 1,
      totalPages: timelineChunks.length,
    })),

    ...momentumChunks.map((rows) => ({
      kind: "momentum",
      rows,
    })),

    ...advantageChunks.map((rows) => ({
      kind: "advantages",
      rows,
    })),

    { kind: "methodology" },
  ];

  return (
    <div
      id="pdf-report"
      className="pdf-report"
      aria-hidden="true"
    >
      {pageDefinitions.map((page, index) => (
        <PdfPage
          key={`${page.kind}-${index}`}
          analysis={analysis}
          match={match}
          page={index + 1}
          total={pageDefinitions.length}
        >
          {page.kind === "summary" ? (
            <SummaryPage
              analysis={analysis}
              match={match}
            />
          ) : null}

          {page.kind === "penalties" ? (
            <PenaltyDetailsPage
              analysis={analysis}
              rows={page.rows}
              page={page.page}
              totalPages={page.totalPages}
            />
          ) : null}

          {page.kind === "timeline" ? (
            <TimelinePage
              analysis={analysis}
              match={match}
              rows={page.rows}
              page={page.page}
              totalPages={page.totalPages}
            />
          ) : null}

          {page.kind === "momentum" ? (
            <MomentumPage
              analysis={analysis}
              match={match}
              rows={page.rows}
            />
          ) : null}

          {page.kind === "advantages" ? (
            <AdvantagesPage
              analysis={analysis}
              match={match}
              rows={page.rows}
            />
          ) : null}

          {page.kind === "methodology" ? (
            <MethodologyPage />
          ) : null}
        </PdfPage>
      ))}
    </div>
  );
}