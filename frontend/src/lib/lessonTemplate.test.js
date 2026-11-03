import test from "node:test";
import assert from "node:assert/strict";
import { STANDARD_LESSON_TEMPLATE } from "./lessonTemplate";
import { resolveCountryLesson } from "../../../api-server/src/lib/localisation";
test("standard template has all nine content sections, semantic markup and labelled placeholders", () => {
    const headings = [...STANDARD_LESSON_TEMPLATE.matchAll(/<h2>([^<]+)<\/h2>/g)].map(match => match[1]);
    assert.deepEqual(headings, [
        "Introduction", "Learning objectives", "Detailed educational content",
        "Key concepts and definitions", "Practical examples", "Home-based care case study",
        "Key learning points", "Lesson summary", "References",
    ]);
    assert.match(STANDARD_LESSON_TEMPLATE, /DRAFT TEMPLATE/);
    assert.match(STANDARD_LESSON_TEMPLATE, /Not reviewed educational content/);
    assert.match(STANDARD_LESSON_TEMPLATE, /<dl><dt>/);
    for (const panel of ["info", "safety", "case", "takeaway"]) {
        assert.match(STANDARD_LESSON_TEMPLATE, new RegExp(`lesson-panel lesson-${panel}`));
    }
    assert.doesNotMatch(STANDARD_LESSON_TEMPLATE, /\bid=|<script|<iframe|<img|https?:|NHS|CQC|Care Act|GDPR/);
    assert.ok(Buffer.byteLength(STANDARD_LESSON_TEMPLATE) < 5000);
});
test("HTML and optional video coexist with enrolment-country selection and shared fallback", () => {
    const shared = { title: "Draft lesson", contentType: "text", content: STANDARD_LESSON_TEMPLATE, videoUrl: null };
    const overrides = [
        { country: "ZM", content: STANDARD_LESSON_TEMPLATE.replace("brief recap.", "Zambia draft recap.") },
        { country: "ZA", contentType: "video", content: STANDARD_LESSON_TEMPLATE.replace("brief recap.", "South Africa draft recap."), videoUrl: "https://video.example/embed/draft" },
    ];
    assert.deepEqual(resolveCountryLesson(shared, overrides, null), shared);
    assert.deepEqual(resolveCountryLesson(shared, [], "ZM"), shared);
    const zm = resolveCountryLesson(shared, overrides, "ZM");
    const za = resolveCountryLesson(shared, overrides, "ZA");
    assert.match(zm.content, /Zambia draft recap/);
    assert.doesNotMatch(zm.content, /South Africa draft recap/);
    assert.match(za.content, /South Africa draft recap/);
    assert.equal(za.videoUrl, "https://video.example/embed/draft");
    assert.equal(za.contentType, "video");
    assert.equal(shared.content, STANDARD_LESSON_TEMPLATE);
});
