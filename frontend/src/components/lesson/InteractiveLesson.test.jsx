import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeQuestionBlock } from "./InteractiveLesson";
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
