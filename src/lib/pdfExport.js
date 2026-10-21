import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function safeFileName(value) {
  return String(value || "match")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function exportMatchToPdf(reportElement, metadata = {}) {
  if (!reportElement) {
    throw new Error("Le rapport PDF n'est pas disponible.");
  }

  const pages = Array.from(
    reportElement.querySelectorAll(".pdf-page"),
  );

  if (pages.length === 0) {
    throw new Error("Aucune page PDF n'a été générée.");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  reportElement.classList.add("pdf-export-active");

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    pdf.setProperties({
      title: `Analyse disciplinaire — ${metadata.homeTeamName ?? ""} vs ${
        metadata.awayTeamName ?? ""
      }`,
      subject: "Analyse arbitrale et disciplinaire d'un match de rugby",
      author: "Rugby Discipline",
      creator: "Rugby Discipline",
    });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];

      const canvas = await html2canvas(page, {
        scale: 1.8,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0,
      });

      if (index > 0) {
        pdf.addPage("a4", "portrait");
      }

      const image = canvas.toDataURL("image/jpeg", 0.95);

      pdf.addImage(
        image,
        "JPEG",
        0,
        0,
        210,
        297,
        undefined,
        "FAST",
      );
    }

    const datePart = metadata.matchDate
      ? `-${safeFileName(metadata.matchDate)}`
      : "";

    const teamsPart = `${safeFileName(
      metadata.homeTeamName,
    )}-${safeFileName(metadata.awayTeamName)}`;

    pdf.save(`analyse-rugby${datePart}-${teamsPart}.pdf`);

    return pages.length;
  } finally {
    reportElement.classList.remove("pdf-export-active");
  }
}
