import { format } from "date-fns";
import { buildQrSvg, safeLearnerName } from "./certificateVerification.js";
import { countryLabel } from "./trainingCountry.js";
/** Actual CSS pixel size of an A4 sheet at 96dpi. */
export const CERT_PX_WIDTH = 794;
export const CERT_PX_HEIGHT = 1123;
export const ONLINE_CERTIFICATE_HEADING = "Certificate of Online Course Completion";
export const ONLINE_CERTIFICATE_STATEMENT = "This certifies that the learner has successfully completed the online learning requirements and passed the knowledge assessment for the course named above.";
export const ONLINE_CERTIFICATE_DISCLAIMER = "This certificate confirms online theoretical learning only. It does not certify practical competence or constitute a regulated professional qualification.";
/** A fixed calendar date keeps newly printed awards and public verification in agreement worldwide. */
export function formatOnlineAwardDate(value) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(value));
}
export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
const HEART_PATHS = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>';
/** Inline Care Learn logo mark (HeartPulse in a rounded teal tile). */
export function logoMarkSvg(size = 40) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#177a73"/><g transform="translate(8 8)" fill="none" stroke="#fbf8f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${HEART_PATHS}</g></svg>`;
}
function medallionSvg() {
    const ticks = Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const r1 = 62, r2 = i % 2 ? 66 : 69;
        return `<line x1="${(80 + r1 * Math.cos(a)).toFixed(2)}" y1="${(80 + r1 * Math.sin(a)).toFixed(2)}" x2="${(80 + r2 * Math.cos(a)).toFixed(2)}" y2="${(80 + r2 * Math.sin(a)).toFixed(2)}"/>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
<circle cx="80" cy="80" r="76" fill="#fbf8f1" stroke="#c9a45c" stroke-width="2"/>
<g stroke="#c9a45c" stroke-width="1.2">${ticks}</g>
<circle cx="80" cy="80" r="56" fill="#16324a"/>
<circle cx="80" cy="80" r="50" fill="none" stroke="#c9a45c" stroke-width="0.8" stroke-dasharray="2 3"/>
<g transform="translate(56 50) scale(2)" fill="none" stroke="#fbf8f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${HEART_PATHS}</g>
<text x="80" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="2.5" fill="#e7d3a6">CARE LEARN</text>
</svg>`;
}
function nameSize(name) {
    const n = name.length;
    if (n <= 18)
        return 46;
    if (n <= 26)
        return 38;
    if (n <= 36)
        return 31;
    if (n <= 50)
        return 25;
    return 21;
}
function courseSize(title) {
    const n = title.length;
    if (n <= 40)
        return 26;
    if (n <= 70)
        return 22;
    if (n <= 110)
        return 18;
    return 15;
}
/** Single source of truth: full HTML document used for both preview and print. */
export function buildCertificateHtml(data) {
    const online = data.formatVersion === 1;
    const name = safeLearnerName(data.learnerName);
    const qrSvg = buildQrSvg(data.verificationUrl); // throws on failure; caller handles
    const href = escapeHtml(data.verificationUrl);
    const course = data.courseTitle.trim() || "Care Learn course";
    let dateText = "";
    try {
        dateText = online ? formatOnlineAwardDate(data.completedAt ?? data.issuedAt)
            : format(new Date(data.issuedAt), "d MMMM yyyy");
    }
    catch {
        dateText = "";
    }
    const country = countryLabel(data.trainingCountry) ?? "Not recorded";
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${online ? ONLINE_CERTIFICATE_HEADING : "Certificate of Completion"} - ${escapeHtml(course)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
@page { size: A4 portrait; margin: 0; }
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:210mm;height:297mm;overflow:hidden;background:#fbf8f1;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Inter',system-ui,sans-serif;color:#16324a}
.sheet{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:avoid;break-after:avoid;background:#16324a;padding:6mm}
.frame{position:relative;width:100%;height:100%;border:1.2mm solid #177a73;padding:2.2mm;background:#16324a}
.inner{position:relative;width:100%;height:100%;background:#fbf8f1;display:flex;overflow:hidden;outline:0.3mm solid #c9a45c;outline-offset:-2.5mm}
.pattern{position:absolute;inset:0;pointer-events:none;opacity:.55;
 background-image:repeating-radial-gradient(circle at 115% -10%, transparent 0 9px, rgba(23,122,115,.07) 9px 10px),repeating-radial-gradient(circle at -20% 120%, transparent 0 11px, rgba(22,50,74,.05) 11px 12px)}
.side{position:relative;width:56mm;flex:none;background:#eef2ec;border-right:0.3mm solid #d8dfd6;display:flex;flex-direction:column;align-items:center;padding-bottom:16mm}
.ribbon{position:relative;width:20mm;height:118mm;background:#177a73;margin-top:0}
.ribbon:after{content:"";position:absolute;left:0;bottom:-10mm;border-left:10mm solid #177a73;border-right:10mm solid #177a73;border-bottom:10mm solid transparent}
.ribbon:before{content:"";position:absolute;left:3mm;right:3mm;top:0;bottom:0;border-left:0.3mm solid rgba(251,248,241,.45);border-right:0.3mm solid rgba(251,248,241,.45)}
.medal{position:absolute;top:58mm;left:50%;transform:translateX(-50%);width:42mm;height:42mm;filter:drop-shadow(0 1mm 1.5mm rgba(22,50,74,.25))}
.medal svg{width:100%;height:100%}
.qr{margin-top:auto;display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#16324a}
.qr .box{width:34mm;height:34mm;background:#fff;display:block}
.qr .box svg{width:100%;height:100%;display:block}
.qr .cap{margin-top:2.5mm;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#177a73;font-weight:600}
.side-foot{margin-top:9mm;text-align:center;width:40mm}
.side-foot .v{font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#16324a;padding-bottom:3mm;border-bottom:0.3mm solid #9fb3ad}
.side-foot .l{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#5b7480;margin-top:2.5mm}
.main{position:relative;flex:1;min-width:0;padding:22mm 16mm 18mm 15mm;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:3.5mm}
.brand .wm{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:26px;letter-spacing:-.01em;color:#16324a;line-height:1}
.brand .tag{font-size:8.5px;letter-spacing:.26em;text-transform:uppercase;color:#177a73;margin-top:1.5mm;font-weight:600}
.kicker{margin-top:30mm;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#177a73;font-weight:600}
.title{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:44px;line-height:1.02;color:#16324a;margin-top:3mm}
.title em{font-style:italic;color:#177a73}
.rule{width:28mm;height:0.6mm;background:#c9a45c;margin:9mm 0}
.lead{font-size:13px;color:#5b7480;letter-spacing:.02em}
.name{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#16324a;line-height:1.1;margin:4mm 0 8mm;overflow-wrap:anywhere;word-break:break-word}
.course{font-weight:600;color:#177a73;line-height:1.25;margin-top:4mm;overflow-wrap:anywhere;word-break:break-word}
.foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;border-top:0.3mm solid #d8dfd6;padding-top:6mm}
.foot p{font-size:10px;line-height:1.55;color:#5b7480;max-width:80mm}
.foot .mark{opacity:.9}
.online .kicker{margin-top:18mm}
.online .title{font-size:34px;line-height:1.08}
.online .rule{margin:6mm 0}
.online .name{margin:3mm 0 6mm}
.online .statement{font-size:12px;line-height:1.65;margin-top:5mm;color:#5b7480}
.online .award-meta{font-size:11px;line-height:1.6;margin-top:4mm;color:#16324a}
.online .version{font-size:9px;overflow-wrap:anywhere;color:#5b7480}
.online .foot{font-size:10px;line-height:1.6}
</style></head>
<body><div class="sheet${online ? " online" : ""}"><div class="frame"><div class="inner">
<div class="pattern"></div>
<aside class="side"><div class="ribbon"></div><div class="medal">${medallionSvg()}</div>
<a class="qr" href="${href}" aria-label="Verify this certificate online"><span class="box">${qrSvg}</span><span class="cap">Scan to verify</span></a>
<div class="side-foot"><div class="v">${escapeHtml(dateText)}</div><div class="l">${online ? "Completion date" : "Date of Award"}</div></div></aside>
<main class="main">
<div class="brand">${logoMarkSvg(44)}<div><div class="wm">Care Learn</div><div class="tag">Home-Based Care Learning · Africa</div></div></div>
<div class="kicker">Course achievement</div>
<h1 class="title">${online ? ONLINE_CERTIFICATE_HEADING : "Certificate<br/>of <em>Completion</em>"}</h1>
<div class="rule"></div>
<div class="lead">${online ? "Awarded to" : "This certifies that"}</div>
<div class="name" style="font-size:${nameSize(name)}px">${escapeHtml(name)}</div>
${online ? "" : '<div class="lead">has successfully completed the course</div>'}
<div class="course" style="font-size:${courseSize(course)}px">${escapeHtml(course)}</div>
${online ? `<p class="statement">${ONLINE_CERTIFICATE_STATEMENT}</p><div class="award-meta">Training track: <strong>${country}</strong>${data.courseVersion ? `<div class="version">Course version: ${escapeHtml(data.courseVersion)}</div>` : ""}</div>` : ""}
<div class="foot"><p>${online ? ONLINE_CERTIFICATE_DISCLAIMER : "Issued by Care Learn on completion of all lessons and assessments in this course. Keep this certificate with your professional care training records."}</p><div class="mark">${logoMarkSvg(30)}</div></div>
</main>
</div></div></div></body></html>`;
}
