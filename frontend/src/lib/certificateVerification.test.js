import test from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { buildVerificationUrl, buildQrSvg, isNotFoundError, safeLearnerName } from "./certificateVerification";
test("verification URLs preserve the app base path and encode opaque codes", () => {
    assert.equal(buildVerificationUrl("https://care.example/", "/", "ABC123"), "https://care.example/verify/ABC123");
    assert.equal(buildVerificationUrl("https://care.example", "/learning/", "a/b?&"), "https://care.example/learning/verify/a%2Fb%3F%26");
});
test("an independent QR decoder reads the locally generated SVG modules", () => {
    for (const url of [
        "https://care.example/verify/0123456789ABCDEF0123456789ABCDEF",
        `https://${"preview-host-".repeat(8)}.example/learning/verify/0123456789ABCDEF0123456789ABCDEF`,
    ]) {
        const svg = buildQrSvg(url);
        const dimension = Number(svg.match(/viewBox="0 0 (\d+) \d+"/)?.[1]);
        assert.ok(dimension > 0);
        const scale = 6;
        const width = dimension * scale;
        const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
        const cells = [...svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)];
        assert.ok(cells.length > 0);
        for (const cell of cells) {
            const x = Number(cell[1]), y = Number(cell[2]);
            assert.ok(x >= 4 && y >= 4 && x < dimension - 4 && y < dimension - 4);
            for (let dy = 0; dy < scale; dy++) {
                for (let dx = 0; dx < scale; dx++) {
                    const index = ((y * scale + dy) * width + x * scale + dx) * 4;
                    pixels[index] = pixels[index + 1] = pixels[index + 2] = 0;
                }
            }
        }
        assert.equal(jsQR(pixels, width, width)?.data, url);
        assert.ok(!svg.includes(url), "Payload is encoded in the QR, not inserted as unescaped text.");
    }
});
test("unknown records and service failures remain distinct", () => {
    assert.equal(isNotFoundError({ status: 404 }), true);
    assert.equal(isNotFoundError({ status: 500 }), false);
    assert.equal(isNotFoundError(new Error("Network unavailable")), false);
    assert.equal(isNotFoundError(null), false);
});
test("certificate display names never fall back to email addresses", () => {
    assert.equal(safeLearnerName("  Morgan Taylor  "), "Morgan Taylor");
    assert.equal(safeLearnerName("someone@example.com"), "Care Professional");
    assert.equal(safeLearnerName(null), "Care Professional");
});
test("QR generation rejects empty payloads and insufficient quiet zones", () => {
    assert.throws(() => buildQrSvg(""));
    assert.throws(() => buildQrSvg("https://care.example", 0), /quiet zone/);
});
