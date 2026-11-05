import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeQuestionBlock } from "./InteractiveLesson.jsx";
const question = {
    id: "practice-test", prompt: "Which action supports independence?",
    options: ["Take over every task.", "Ask about the person's preferences.", "Ignore identified risks."],
    correctOptionIndex: 1, feedback: "B is best. Support choice and provide appropriate assistance.",
};
test("practice question initially renders labelled radios without grades or feedback", () => {
    const html = renderToStaticMarkup(createElement(PracticeQuestionBlock, { title: "Question 1", question }));
    assert.match(html, /role="radiogroup"/);
    assert.equal((html.match(/role="radio"/g) ?? []).length, 3);
    assert.match(html, /aria-labelledby="practice-test-prompt"/);
    assert.match(html, /Practice only\. Not graded or saved\./);
    assert.match(html, /<section[^>]*tabindex="0"[^>]*data-lesson-scroll="true"[^>]*class="[^"]*min-h-0 flex-1 overflow-y-auto overscroll-x-contain overscroll-y-auto/);
    assert.doesNotMatch(html, /\boverscroll-contain\b|\boverscroll-y-contain\b|\btouch-none\b/);
    assert.doesNotMatch(html, /data-testid="practice-feedback-/);
    assert.doesNotMatch(html, /<form|type="submit"|data-state="checked"/);
});
test("scenario prompts and options remain escaped text rather than executable HTML", () => {
    const html = renderToStaticMarkup(createElement(PracticeQuestionBlock, {
        title: "Scenario", scenario: true,
        question: { ...question, prompt: "<script>window.attack=true</script>", options: ['<img src=x onerror="attack()">', "Safe choice"] },
    }));
    assert.match(html, /Scenario practice/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;img/);
    assert.doesNotMatch(html, /<script|<img/);
});
test("scenario question uses an unshaded prompt with separate title and option spacing", () => {
    const html = renderToStaticMarkup(createElement(PracticeQuestionBlock, {
        title: "Question 2", scenario: true, question,
    }));
    const prompt = html.match(/<p id="practice-test-prompt"[^>]*>/)?.[0];
    assert.ok(prompt);
    assert.match(prompt, /mb-6 leading-relaxed/);
    assert.doesNotMatch(prompt, /bg-|border|rounded/);
    assert.match(html, /id="practice-test-heading"[^>]*mb-5/);
    const group = html.match(/<div\b[^>]*role="radiogroup"[^>]*>/)?.[0];
    assert.ok(group);
    assert.match(group, /class="[^"]*\bgap-3\b/);
});
test("controlled practice answer (held by the paginated lesson) restores feedback after page navigation", () => {
    const html = renderToStaticMarkup(createElement(PracticeQuestionBlock, { title: "Question 1", question, value: "1", onValueChange: () => {} }));
    assert.match(html, /data-testid="practice-feedback-practice-test"/);
    assert.match(html, /Correct answer/);
});
test("selected option shows green Correct answer or red Incorrect answer with its own rationale", () => {
    const q2 = { ...question, optionFeedback: ["doing everything removes independence.", "asking supports choice.", "ignoring risks leaves harm unresolved."] };
    const wrong = renderToStaticMarkup(createElement(PracticeQuestionBlock, { title: "Q", question: q2, value: "0" }));
    assert.match(wrong, /Incorrect answer/);
    assert.match(wrong, /doing everything removes independence\./);
    assert.doesNotMatch(wrong, /asking supports choice|B is best|The best answer is/);
    assert.match(wrong, /border-red-600/);
    const right = renderToStaticMarkup(createElement(PracticeQuestionBlock, { title: "Q", question: q2, value: "1" }));
    assert.match(right, /Correct answer/);
    assert.match(right, /Well done\./);
    assert.match(right, /border-emerald-600/);
    assert.doesNotMatch(right, /border-primary bg-primary/);
});
