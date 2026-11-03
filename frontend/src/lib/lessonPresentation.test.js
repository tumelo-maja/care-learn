import test from "node:test";
import assert from "node:assert/strict";
import { feedbackAnswerIndex, isHbc001Prototype, safeLessonUrl } from "./lessonPresentation";
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
