import QRCode from "qrcode";
/** Join origin + Vite base + /verify/<code>, handling slashes and encoding. */
export function buildVerificationUrl(origin, baseUrl, certificateCode) {
    const cleanOrigin = origin.replace(/\/+$/, "");
    const base = ("/" + (baseUrl || "/").replace(/^\/+|\/+$/g, "")).replace(/\/$/, "");
    return `${cleanOrigin}${base}/verify/${encodeURIComponent(certificateCode)}`;
}
/** Verification URL for the current runtime origin (works on any published host). */
export function currentVerificationUrl(certificateCode) {
    return buildVerificationUrl(window.location.origin, import.meta.env.BASE_URL, certificateCode);
}
/**
 * Generate a crisp inline SVG QR code (black on white) locally.
 * Throws if the payload cannot be encoded.
 */
export function buildQrSvg(text, quietZone = 4) {
    if (!Number.isInteger(quietZone) || quietZone < 4)
        throw new Error("QR codes require at least a four-module quiet zone.");
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const total = size + quietZone * 2;
    let d = "";
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (data[y * size + x])
                d += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR code to verify this certificate"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${d}" fill="#000000"/></svg>`;
}
/** Classify a lookup error: 404 => not found, anything else => unavailable. */
export function isNotFoundError(error) {
    if (error && typeof error === "object" && "status" in error) {
        return error.status === 404;
    }
    return false;
}
/** Never show an email address as the learner name. */
export function safeLearnerName(name) {
    const n = (name ?? "").trim();
    if (!n || n.includes("@"))
        return "Care Professional";
    return n;
}
