"use strict";

const fs = require("fs");
const path = require("path");

const sources = [
  {
    id: "mkt101",
    code: "MKT101",
    title: "Marketing căn bản",
    file: "SEMESTER_1_MKT101.html",
  },
  {
    id: "eco121",
    code: "ECO121",
    title: "Kinh tế học",
    file: "SEMESTER_2_ECO121 (1).html",
  },
  {
    id: "fin202",
    code: "FIN202",
    title: "Tài chính doanh nghiệp",
    file: "SEMESTER_2_FIN202.html",
  },
];

const outRoot = "slides";
const dataRoot = "data";

fs.mkdirSync(outRoot, { recursive: true });
fs.mkdirSync(dataRoot, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  subjects: sources.map(extractSubject),
};

fs.writeFileSync(
  path.join(dataRoot, "slides.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

function extractSubject(source) {
  const html = fs.readFileSync(source.file, "utf8");
  const slides = JSON.parse(extractSlidesLiteral(html));
  const subjectDir = path.join(outRoot, source.id);
  fs.mkdirSync(subjectDir, { recursive: true });

  const items = slides.map((slide, index) => {
    const filename = `${String(index + 1).padStart(4, "0")}.svg`;
    const svgPath = path.join(subjectDir, filename);
    fs.writeFileSync(svgPath, slide.svg, "utf8");
    return {
      id: slide.id || `${source.id}-${index + 1}`,
      number: index + 1,
      image: `${outRoot}/${source.id}/${filename}`,
      notes: normalizeText(slide.notes),
    };
  });

  return {
    id: source.id,
    code: source.code,
    title: source.title,
    slides: items,
  };
}

function extractSlidesLiteral(html) {
  const marker = "const slides = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("Cannot find slides array");

  const arrayStart = start + marker.length;
  const endMarker = "];";
  const end = html.indexOf(endMarker, arrayStart);
  if (end === -1) throw new Error("Cannot find slides array end");

  return html.slice(arrayStart, end + 1);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
