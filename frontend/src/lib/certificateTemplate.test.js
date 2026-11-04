import test from "node:test";
import assert from "node:assert/strict";
import { buildCertificateHtml, formatOnlineAwardDate, ONLINE_CERTIFICATE_HEADING, ONLINE_CERTIFICATE_STATEMENT, ONLINE_CERTIFICATE_DISCLAIMER } from "./certificateTemplate.js";
const original = {
    learnerName: "Morgan Taylor", courseTitle: "Understanding Your Role as a Care Worker",
    issuedAt: "2026-10-27T12:00:00.000Z",
    verificationUrl: "https://care.example/verify/UNIT-ONLY-NOT-AN-ISSUED-AWARD",
};
const courseVersion = "abc12345".repeat(8);
test("new A4 document includes online-learning wording, Africa branding, date and QR without tracks", () => {
    for (const trainingCountry of ["ZM", "ZA"]) {
        const html = buildCertificateHtml({ ...original, formatVersion: 1, trainingCountry, courseVersion,
            completedAt: "2026-10-26T12:00:00.000Z" });
        for (const text of [ONLINE_CERTIFICATE_HEADING, ONLINE_CERTIFICATE_STATEMENT, ONLINE_CERTIFICATE_DISCLAIMER,
            "Care Learn", "Morgan Taylor", original.courseTitle, "26 October 2026", courseVersion]) {
            assert.ok(html.includes(text), `Missing ${text}`);
        }
        assert.match(html, /size: A4 portrait/);
        assert.ok(html.includes('aria-label="Verify this certificate online"') && html.includes(original.verificationUrl));
        assert.ok(!/CPD accreditation|government approv|UK Care Certificate|Home Care Training UK/i.test(html));
        assert.ok(!html.includes("Certificate ID"));
        assert.doesNotMatch(html, /Training track|Track A|Track B/);
        assert.doesNotMatch(html, /\b(?:UK|United Kingdom|Zambia|South Africa)\b/);
    }
});
test("legacy rendering does not gain new wording, an inferred country or invented version", () => {
    const html = buildCertificateHtml(original);
    assert.ok(html.includes('Certificate<br/>of <em>Completion</em>'));
    assert.ok(html.includes("Home-Based Care Learning · Africa"));
    assert.doesNotMatch(html, /\b(?:UK|United Kingdom|Zambia|South Africa)\b/);
    assert.ok(!html.includes(ONLINE_CERTIFICATE_STATEMENT));
    assert.ok(!html.includes(ONLINE_CERTIFICATE_DISCLAIMER));
    assert.ok(!html.includes("Training country:"));
    assert.ok(!html.includes("Course version:"));
});
test("unknown historical enrolment country is not displayed or guessed", () => {
    const html = buildCertificateHtml({ ...original, formatVersion: 1, trainingCountry: null, courseVersion });
    assert.ok(!html.includes("Training track:"));
});
test("snapshot identity, course title and version remain escaped HTML text", () => {
    const html = buildCertificateHtml({ ...original, formatVersion: 1, trainingCountry: "ZM",
        learnerName: 'Morgan <script>alert("x")</script>', courseTitle: "<img src=x onerror=alert(1)>",
        courseVersion: '<b>not markup</b>' });
    assert.ok(!html.includes("<script>") && !html.includes("<img src=x"));
    assert.ok(html.includes("&lt;script&gt;") && html.includes("&lt;b&gt;not markup&lt;/b&gt;"));
});
test("new award calendar date is stable near midnight; historical display remains unchanged", () => {
    const midnight = "2026-10-27T23:30:00.000Z";
    assert.equal(formatOnlineAwardDate(midnight), "27 October 2026");
    const newHtml = buildCertificateHtml({ ...original, issuedAt: midnight, completedAt: midnight,
        formatVersion: 1, trainingCountry: "ZA" });
    assert.ok(newHtml.includes("27 October 2026"));
    assert.ok(!newHtml.includes("28 October 2026"));
    assert.ok(buildCertificateHtml(original).includes("Date of Award"));
});
