import test from "node:test";
import assert from "node:assert/strict";
import { buildCertificateHtml, formatOnlineAwardDate, ONLINE_CERTIFICATE_HEADING, ONLINE_CERTIFICATE_STATEMENT, ONLINE_CERTIFICATE_DISCLAIMER } from "./certificateTemplate.js";
const original = {
    learnerName: "Morgan Taylor", courseTitle: "Understanding Your Role as a Care Worker",
    issuedAt: "2026-10-27T12:00:00.000Z",
    verificationUrl: "https://care.example/verify/UNIT-ONLY-NOT-AN-ISSUED-AWARD",
};
const courseVersion = "abc12345".repeat(8);
test("certificate display copy uses hyphens without altering verification links or award identity", () => {
    const award = Object.freeze({ ...original, learnerName: "Morgan\u2014Taylor", courseTitle: "Care\u2014Learning",
        verificationUrl: "https://example.org/verify/test\u2014code" });
    const html = buildCertificateHtml(award);
    assert.match(html, />Morgan-Taylor<\/div>/);
    assert.match(html, />Care-Learning<\/div>/);
    assert.ok(html.includes(`href="${award.verificationUrl}"`));
    assert.equal(award.learnerName, "Morgan\u2014Taylor");
});
test("certificate uses the concise scope wording beside a larger footer logo", () => {
    const html = buildCertificateHtml({ ...original, formatVersion: 1 });
    assert.equal(ONLINE_CERTIFICATE_DISCLAIMER, "This certificate confirms online theoretical learning only.");
    assert.ok(html.includes(ONLINE_CERTIFICATE_DISCLAIMER));
    assert.doesNotMatch(html, /does not certify practical competence|regulated professional qualification/);
    assert.match(html, /<div class="mark"><svg[^>]*width="52" height="52"/);
});
test("circular seal has a centred logo without the Care Learn text label", () => {
    const html = buildCertificateHtml(original);
    const seal = html.match(/<div class="medal">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(seal);
    assert.doesNotMatch(seal, /<text\b|CARE LEARN/);
    assert.match(seal, /<circle cx="80" cy="80" r="38" fill="#fbf8f1"/);
    assert.doesNotMatch(seal, /fill="#fff"/);
    assert.match(seal, /translate\(48 48\).*width="64" height="64"/);
});
test("certificate header, seal and footer use the current heart-and-scroll logo", () => {
    const html = buildCertificateHtml(original);
    assert.match(html, /<img class="brand-logo"[^>]*src="[^"]*logo\.png"[^>]*alt="Care Learn"/);
    assert.equal((html.match(/<image href="[^"]*logo\.png"/g) ?? []).length, 2);
    assert.doesNotMatch(html, /M19 14c1\.49|M3\.22 12H9\.5/);
    assert.match(html, /@page \{ size: A4 portrait/);
});
test("new A4 document includes online-learning wording, Africa branding, date and QR without tracks", () => {
    for (const trainingCountry of ["ZM", "ZA"]) {
        const html = buildCertificateHtml({ ...original, formatVersion: 1, trainingCountry, courseVersion,
            completedAt: "2026-10-26T12:00:00.000Z" });
        for (const text of [ONLINE_CERTIFICATE_HEADING, ONLINE_CERTIFICATE_STATEMENT, ONLINE_CERTIFICATE_DISCLAIMER,
            "Care Learn", "Morgan Taylor", original.courseTitle, "26 October 2026"]) {
            assert.ok(html.includes(text), `Missing ${text}`);
        }
        assert.match(html, /size: A4 portrait/);
        assert.ok(html.includes('aria-label="Verify this certificate online"') && html.includes(original.verificationUrl));
        assert.ok(!/CPD accreditation|government approv|UK Care Certificate|Home Care Training UK/i.test(html));
        assert.ok(!html.includes("Certificate ID"));
        assert.ok(!html.includes("Course version:") && !html.includes(courseVersion));
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
test("snapshot identity and course title are escaped while course version stays hidden", () => {
    const html = buildCertificateHtml({ ...original, formatVersion: 1, trainingCountry: "ZM",
        learnerName: 'Morgan <script>alert("x")</script>', courseTitle: "<img src=x onerror=alert(1)>",
        courseVersion: '<b>not markup</b>' });
    assert.ok(!html.includes("<script>") && !html.includes("<img src=x"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!html.includes("not markup") && !html.includes("Course version:"));
});
test("course version is omitted from the shared preview/print document without changing award data", () => {
    const award = Object.freeze({ ...original, formatVersion: 1, courseVersion });
    const html = buildCertificateHtml(award);
    assert.doesNotMatch(html, /Course version:|award-meta|class="version"/);
    assert.ok(!html.includes(courseVersion));
    assert.equal(award.courseVersion, courseVersion);
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
