import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonCover } from "./LessonCover.jsx";

test("lesson cover contains the exact title, course image and a section-owned scrollbar", () => {
    const html = renderToStaticMarkup(createElement(LessonCover, {
        title: "Understanding Your Role",
        courseTitle: "Foundation in Home-Based Care",
        imageUrl: "https://example.com/care.jpg",
    }));
    assert.match(html, /<section[^>]*data-lesson-scroll="true"/);
    assert.match(html, /h-full min-h-0 overflow-y-auto overscroll-contain/);
    assert.match(html, /<h1[^>]*>Understanding Your Role<\/h1>/);
    assert.match(html, /src="https:\/\/example.com\/care.jpg"/);
    assert.match(html, /Foundation in Home-Based Care/);
});

test("lesson covers use the local image for missing or unsafe image URLs and escape titles", () => {
    for (const imageUrl of [undefined, "javascript:alert(1)", "data:image/svg+xml,test"]) {
        const html = renderToStaticMarkup(createElement(LessonCover, { title: "<script>unsafe</script>", imageUrl }));
        assert.match(html, /src="\/images\/hero-caring.png"/);
        assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
        assert.doesNotMatch(html, /<script|src="javascript:|src="data:/);
    }
});
