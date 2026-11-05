import test from "node:test";
import assert from "node:assert/strict";
import { websiteText, websiteResponseText } from "./websiteText.js";

test("every em dash becomes a hyphen without changing other punctuation or words", () => {
    assert.equal(websiteText("Care\u2014Learn\u2014together. A–B - C"), "Care-Learn-together. A–B - C");
    assert.equal(websiteText("Already plain - text"), "Already plain - text");
    assert.equal(websiteText(null), null);
});
test("nested display fields and answer text are normalised without changing source data", () => {
    const original = {
        courseTitle: "Care\u2014learning",
        modules: [{ title: "Skills\u2014practice", content: '<p>Original\u2014source &mdash; text</p>' }],
        options: [{ id: "option\u2014id", text: "Choice\u2014one" }, "Choice\u2014two"],
        optionFeedback: ["Reason\u2014explanation"],
        questionId: "question\u2014id", courseVersion: "version\u2014hash",
        verificationUrl: "https://example.org/verify/code\u2014unchanged",
        imageUrl: "/images/care\u2014image.png", certificateCode: "cert\u2014code",
        score: 90, passed: true, missing: null,
    };
    const snapshot = JSON.stringify(original);
    const updated = websiteResponseText(original);
    assert.equal(updated.courseTitle, "Care-learning");
    assert.equal(updated.modules[0].title, "Skills-practice");
    assert.deepEqual(updated.options, [{ id: "option\u2014id", text: "Choice-one" }, "Choice-two"]);
    assert.deepEqual(updated.optionFeedback, ["Reason-explanation"]);
    for (const key of ["questionId", "courseVersion", "verificationUrl", "imageUrl", "certificateCode", "score", "passed", "missing"])
        assert.equal(updated[key], original[key]);
    assert.equal(updated.modules[0].content, original.modules[0].content);
    assert.equal(JSON.stringify(original), snapshot);
});
