import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonCover } from "./LessonCover.jsx";
import { LessonPager } from "./LessonPager.jsx";

test("lesson cover contains the exact title, course image and a section-owned scrollbar", () => {
    const html = renderToStaticMarkup(createElement(LessonCover, {
        title: "Understanding Your Role",
        courseTitle: "Foundation in Home-Based Care",
        imageUrl: "https://example.com/care.jpg",
    }));
    assert.match(html, /<section[^>]*data-lesson-scroll="true"/);
    assert.match(html, /h-full min-h-0 overflow-y-auto overscroll-x-contain overscroll-y-auto/);
    assert.doesNotMatch(html, /\boverscroll-contain\b|\boverscroll-y-contain\b|\btouch-none\b/);
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

test("cover reserves space for the complete title and allows the image to shrink", () => {
    const html = renderToStaticMarkup(createElement(LessonCover, { title: "Supporting Choice and Independence" }));
    assert.match(html, /flex flex-col/);
    assert.match(html, /min-h-0 shrink aspect-/);
    assert.match(html, /class="shrink-0 p-5 md:p-10"/);
    assert.doesNotMatch(html, /line-clamp|truncate/);
});

test("opening covers get a taller panel without enlarging normal lesson pages", () => {
    const pages = [createElement("section", { key: "cover" }, "Cover")];
    const cover = renderToStaticMarkup(createElement(LessonPager, { pages, hasCover: true }));
    const normal = renderToStaticMarkup(createElement(LessonPager, { pages }));
    assert.ok(cover.includes("h-[max(68dvh,30rem)]"));
    assert.ok(!cover.includes("h-[58dvh]"));
    assert.ok(normal.includes("h-[58dvh]"));
});

test("pagination has accessible mobile arrows, generous touch targets and an unbroken counter", () => {
    const pages = Array.from({ length: 17 }, (_, i) => createElement("section", { key: i }, "Teaching"));
    const html = renderToStaticMarkup(createElement(LessonPager, { pages }));
    for (const [id, label] of [["prev", "Previous page"], ["next", "Next page"]]) {
        const button = html.match(new RegExp(`<button\\b[^>]*data-testid="button-${id}-page"[^>]*>`))?.[0];
        assert.ok(button);
        assert.ok(button.includes(`aria-label="${label}"`));
        assert.ok(button.includes("h-11 w-11"));
        assert.ok(html.includes(`<span class="hidden md:inline">${label}</span>`));
    }
    assert.equal((html.match(/class="[^"]*\bh-5 w-5 md:hidden"/g) ?? []).length, 2);
    assert.match(html, /whitespace-nowrap text-center/);
    assert.match(html, /Page 1 of 17/);
});
