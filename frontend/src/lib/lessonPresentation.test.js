import test from "node:test";
import assert from "node:assert/strict";
import { feedbackAnswerIndex, isHbc001Prototype, safeLessonUrl } from "./lessonPresentation.js";
test("interactive prototype applies only to HBC001 first lesson", () => {
    const title = "Introduction to Professional Home-Based Care";
    assert.equal(isHbc001Prototype("HBC001", title, 0), true);
    for (const [code, lessonTitle, index] of [["HBC003", title, 0], ["HBC001", title, 1], ["HBC001", "Other lesson", 0]]) {
        assert.equal(isHbc001Prototype(code, lessonTitle, index), false);
    }
});
test("practice answers require an explicit in-range author-written answer letter", () => {
    assert.equal(feedbackAnswerIndex("B is best. Existing explanation.", 3), 1);
    assert.equal(feedbackAnswerIndex("C is correct. Existing explanation.", 3), 2);
    for (const feedback of ["Choose safely.", "D is correct.", "B may be correct."]) {
        assert.equal(feedbackAnswerIndex(feedback, 3), null);
    }
});
test("lesson media and links reject executable, data and obfuscated schemes", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,test", "vbscript:msgbox(1)", "java\nscript:alert(1)"]) {
        assert.equal(safeLessonUrl(url), undefined);
        assert.equal(safeLessonUrl(url, true), undefined);
    }
    assert.equal(safeLessonUrl("/images/example.png", true), "/images/example.png");
    assert.equal(safeLessonUrl("https://www.who.int/example"), "https://www.who.int/example");
    assert.equal(safeLessonUrl("mailto:help@example.com", true), undefined);
});
import { isHiddenSectionTitle, practiceFeedback } from "./lessonPresentation.js";
const q = { correctOptionIndex: 1, feedback: "B is correct. Ask first.", options: ["a", "b", "c"] };
test("option-specific feedback explains the selected choice", () => {
    const withOpts = { ...q, optionFeedback: ["taking over removes choice.", "asking respects preferences.", "ignoring risks leaves harm unresolved."] };
    assert.deepEqual(practiceFeedback(withOpts, 0), { correct: false, title: "Incorrect answer", text: "Your selection of “a” is incorrect because taking over removes choice." });
    assert.deepEqual(practiceFeedback(withOpts, 1), { correct: true, title: "Correct answer", text: "Well done. Your selection of “b” is correct because asking respects preferences." });
    assert.doesNotMatch(practiceFeedback(withOpts, 0).text, /asking respects|Ask first|“b”|B is/);
});
test("legacy feedback never exposes the answer key or shared explanation", () => {
    assert.equal(practiceFeedback(q, 1).text, "Well done. Your selection of “b” is correct.");
    const wrong = practiceFeedback(q, 2);
    assert.equal(wrong.title, "Incorrect answer");
    assert.match(wrong.text, /^Your selection of “c” is incorrect\./);
    assert.doesNotMatch(wrong.text, /best answer|B is|Ask first|“b”/);
});
test("references and reviewer notes are hidden from learner output", () => {
    for (const t of ["References", "Reviewer notes", " reviewer  Notes: "]) assert.equal(isHiddenSectionTitle(t), true);
    assert.equal(isHiddenSectionTitle("Lesson summary"), false);
});
import { usesBalancedLessonFormat } from "./lessonPresentation.js";
test("balanced visual format applies only to marked lessons", () => {
    assert.equal(usesBalancedLessonFormat('<div data-visual-pilot="hbc001-v1"></div>'), true);
    assert.equal(usesBalancedLessonFormat('<div data-visual-format="balanced"></div>'), true);
    assert.equal(usesBalancedLessonFormat("<div data-visual-format='balanced'></div>"), true);
    for (const html of ["<p>Plain lesson</p>", '<div data-visual-format="dense"></div>', '<div data-visual-pilot="other"></div>', "", null, undefined])
        assert.equal(usesBalancedLessonFormat(html), false);
});
