import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssessmentReview } from "./AssessmentReview.jsx";
const feedback = [{ questionId: "sample", prompt: "Which action supports choice?", topic: "Participation",
    isCorrect: true, selectedAnswer: "Ask about preferences.", correctAnswer: "Ask about preferences.", explanation: "Asking supports individual choice." }];
const render = props => renderToStaticMarkup(createElement(AssessmentReview, { feedback, score: 100, ...props }));
test("completed course review starts collapsed with a keyboard-accessible title", () => {
    const html = render({ collapsed: true });
    const disclosure = html.match(/<details\b[^>]*data-testid="assessment-review-disclosure"[^>]*>/)?.[0];
    assert.ok(disclosure);
    assert.doesNotMatch(disclosure, /\bopen=/);
    assert.match(html, /<summary[^>]*>.*?<h2[^>]*>Latest submitted assessment review<\/h2>/s);
    for (const text of ["Score: 100%", feedback[0].prompt, feedback[0].explanation])
        assert.ok(html.includes(text));
});
test("other submitted reviews retain their expanded default", () => {
    assert.match(render({}), /<details open="" data-testid="assessment-review-disclosure"/);
});
test("missing feedback renders no review", () => {
    assert.equal(render({ feedback: [] }), "");
});
test("review text is escaped and individual answer disclosures remain available", () => {
    const html = render({ feedback: [{ ...feedback[0], prompt: "<script>unsafe()</script>" }] });
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /data-testid="feedback-sample"/);
});
