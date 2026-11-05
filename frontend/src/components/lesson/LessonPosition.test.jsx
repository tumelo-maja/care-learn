import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonHeaderTitle, LessonPosition } from "./LessonPosition.jsx";
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

test("lesson labels show the actual first, middle and last course positions", () => {
    for (const index of [0, 2, 4])
        assert.equal(render(LessonPosition, { index, total: 5 }), `Lesson ${index + 1} of 5`);
});
test("unavailable lessons never display a misleading zero position", () => {
    for (const index of [-1, undefined, 5])
        assert.equal(render(LessonPosition, { index, total: 5 }), "Lesson");
    assert.equal(render(LessonPosition, { index: 0, total: 0 }), "Lesson");
});
test("phone headers use the counter and desktop headers retain the full escaped title", () => {
    const html = render(LessonHeaderTitle, { title: "<Intro> to Professional Care", index: 1, total: 15 });
    assert.match(html, /class="whitespace-nowrap md:hidden"[^>]*aria-live="polite"[^>]*>Lesson 2 of 15<\/span>/);
    assert.match(html, /<span class="hidden md:inline">&lt;Intro&gt; to Professional Care<\/span>/);
    assert.doesNotMatch(html, /text Lesson|·|<Intro>/);
});
