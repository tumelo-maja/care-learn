import test from "node:test";
import assert from "node:assert/strict";
import { paginateBlocks, paginateTree, treeParts, treeToHtml, weightOf } from "./lessonPagination.js";
const t = (text) => ({ text });
const h = (tag, attrs, ...children) => ({ tag, attrs: attrs ?? {}, children: children.map(c => typeof c === "string" ? t(c) : c) });
const p = (s) => h("p", null, s);
const textOf = (nodes) => nodes.map(n => n.text ?? textOf(n.children)).join("");
const units = (page) => page.reduce((s, n) => s + weightOf(n), 0);

test("unheaded content stays together without splitting complete sentences", () => {
    const pages = paginateTree(Array.from({ length: 9 }, (_, i) => p(`P${i}`)));
    assert.deepEqual(pages.map(units), [9]);
});
test("nested sections split safely, retaining their original heading without a continued label", () => {
    const section = h("section", { class: "s" }, h("h2", { id: "x" }, "Care"), ...Array.from({ length: 6 }, (_, i) => p(`P${i}`)));
    const pages = paginateTree([section], 4);
    assert.equal(pages.length, 2);
    for (const page of pages) { assert.equal(page[0].tag, "section"); assert.ok(units(page) <= 4); }
    assert.match(treeToHtml(pages[1]), /<h2 data-pagination-repeat="true">Care<\/h2>/);
    assert.doesNotMatch(pages.map(treeToHtml).join(""), /\(continued\)/);
    const all = textOf(pages[0]) + textOf(pages[1]).replace(/^Care/, "");
    assert.equal(all, textOf([section]));
});
test("list items count as reading units and ordered lists keep numbering", () => {
    const list = h("ol", null, ...Array.from({ length: 6 }, (_, i) => h("li", null, `Step ${i}`)));
    const pages = paginateTree([p("Intro"), list], 4);
    assert.ok(pages.every(pg => units(pg) <= 4));
    const html = pages.map(treeToHtml);
    assert.match(html[1], /<ol start="4"><li>Step 3<\/li>/);
});
test("headings stay with the content that follows", () => {
    const pages = paginateTree([p("a"), p("b"), p("c"), p("d"), h("h3", null, "Next topic"), p("e")]);
    assert.equal(pages.length, 2);
    const secondPage = treeToHtml(pages[1]);
    assert.match(secondPage, /<h3>Next topic<\/h3><p>e<\/p>/);
    assert.doesNotMatch(treeToHtml(pages[0]), /Next topic/);
});
test("whitespace-only and half-empty content never creates empty pages", () => {
    assert.deepEqual(paginateTree([t("  \n ")]), []);
    const pages = paginateTree([p("a"), t("\n"), p("b"), t("  ")]);
    assert.equal(pages.length, 1);
});
test("images are optional, keep their position and count as a unit", () => {
    const img = h("img", { src: "https://example.org/a.png", alt: "Hand washing" });
    const pages = paginateTree([p("1"), p("2"), p("3"), img, p("4")]);
    assert.equal(pages.length, 1);
    assert.match(pages.map(treeToHtml).join(""), /<p>3<\/p><img src="https:\/\/example.org\/a.png" alt="Hand washing"><p>4<\/p>$/);
    assert.equal(paginateTree([p("No image")]).length, 1);
});
test("serialisation escapes text and attributes", () => {
    assert.equal(treeToHtml([h("p", { title: '"x"' }, "<script>")]), '<p title="&quot;x&quot;">&lt;script&gt;</p>');
});
test("interactive blocks paginate without splitting or flattening practice questions", () => {
    const parts = (html) => html ? [{ html, weight: 3 }] : [];
    const question = { id: "practice-1", prompt: "Q", options: ["a", "b"], correctOptionIndex: 1, feedback: "B is best." };
    const blocks = [
        { id: "s0", type: "teaching", title: "Intro", html: "x" },
        { id: "practice-1", type: "knowledge-check", title: "Question 1", question },
        { id: "s1", type: "explanation", title: "References", html: "y" },
    ];
    const pages = paginateBlocks(blocks, parts);
    assert.deepEqual(pages.map(pg => pg.map(b => b.id)), [["s0"], ["practice-1"], ["s1"]]);
    assert.equal(pages[1][0].question, question);
    assert.ok(!("html" in pages[1][0]));
});
test("long block parts keep original titles", () => {
    const tree = Array.from({ length: 6 }, (_, i) => p(`P${i}`));
    const parts = treeParts(tree);
    const pages = paginateBlocks([{ id: "s0", type: "teaching", title: "Rights", html: "-" }], () => parts);
    assert.deepEqual(pages.flat().map(b => b.title), ["Rights"]);
});

test("empty containers, empty paragraphs, discarded widgets and heading-only lessons create no blank pages", () => {
    assert.deepEqual(paginateTree([h("div", null, p(" "), h("br", null)), h("script", null, "ignored")]), []);
    assert.deepEqual(paginateTree([h("h2", null, "Heading only")]), []);
    const pages = paginateTree([p("a"), h("div", null, h("p", null)), p("b")]);
    assert.equal(pages.length, 1);
    assert.equal(textOf(pages[0]), "ab");
});

test("H2 sections remain self-contained rather than mixing unrelated topics", () => {
    const sections = Array.from({ length: 5 }, (_, i) => h("section", null, h("h2", null, `Topic ${i}`), p(`Text ${i}`)));
    const pages = paginateTree(sections);
    assert.deepEqual(pages.map(units), [1, 1, 1, 1, 1]);
    assert.equal(pages.map(textOf).join(""), textOf(sections));
});

test("interactive empty blocks are skipped and full section content stays on one page", () => {
    const blocks = [
        { id: "empty", type: "teaching", title: "Empty", html: "" },
        { id: "teaching", type: "teaching", title: "Care", html: "content" },
    ];
    const section = Array.from({ length: 5 }, (_, i) => p(String(i)));
    const pages = paginateBlocks(blocks, html => html ? treeParts(section) : []);
    assert.equal(pages.length, 1);
    assert.deepEqual(pages.map(page => page.length), [1]);
    assert.equal(pages[0][0].title, "Care");
    assert.equal(pages.flat().map(block => block.html).join(""), "<p>0</p><p>1</p><p>2</p><p>3</p><p>4</p>");
});

test("an H2 with two long H3 subsections yields complete independent chunks", () => {
    const paragraphs = name => Array.from({ length: 7 }, (_, i) => p(`${name} sentence ${i}. Another complete sentence.`));
    const first = paragraphs("First");
    const second = paragraphs("Second");
    const tree = [h("section", null, h("h2", null, "Responsibilities"),
        h("h3", null, "Supporting choice"), ...first, h("h3", null, "Recognising risk"), ...second)];
    const pages = paginateTree(tree);
    assert.equal(pages.length, 2);
    const html = pages.map(treeToHtml);
    assert.match(html[0], /Supporting choice/);
    assert.doesNotMatch(html[0], /Recognising risk/);
    assert.match(html[1], /Recognising risk/);
    assert.doesNotMatch(html[1], /Supporting choice/);
    for (const paragraph of first) assert.ok(html[0].includes(treeToHtml([paragraph])));
    for (const paragraph of second) assert.ok(html[1].includes(treeToHtml([paragraph])));
    assert.doesNotMatch(html.join(""), /continued/i);
});

test("a heading without body is carried forward with the next content, not made into an empty page", () => {
    const pages = paginateTree([h("h2", null, "Overview"), h("h3", null, "Daily care"), p("Full sentence.")]);
    assert.equal(pages.length, 1);
    assert.match(treeToHtml(pages[0]), /<h2>Overview<\/h2><h3>Daily care<\/h3><p>Full sentence\.<\/p>/);
});

test("consecutive unstructured introductory blocks share a view", () => {
    const blocks = ["First full sentence.", "Second full sentence."].map((html, i) => ({ id: String(i), type: "notice", title: "", html }));
    const pages = paginateBlocks(blocks, html => [{ html: `<p>${html}</p>`, weight: 1 }]);
    assert.equal(pages.length, 1);
    assert.equal(pages[0][0].html, "<p>First full sentence.</p><p>Second full sentence.</p>");
});

test("each H3 subsection starts a fresh view even when the preceding page has room", () => {
    const pages = paginateTree([h("section", null, h("h3", null, "First"), p("One"),
        h("h3", null, "Second"), p("Two"), h("h3", null, "Third"), p("Three"))]);
    assert.equal(pages.length, 3);
    assert.match(treeToHtml(pages[1]), /<h3>Second<\/h3><p>Two<\/p>/);
    assert.doesNotMatch(treeToHtml(pages[1]), /One|Three/);
});

test("interactive subsection boundaries are not merged or rebalanced across topics", () => {
    const blocks = [
        { id: "a", title: "First", html: "one", startNewPage: true },
        { id: "b", title: "Second", html: "two", startNewPage: true },
    ];
    const pages = paginateBlocks(blocks, html => [{ html, weight: 1 }]);
    assert.deepEqual(pages.map(page => page.map(block => block.title)), [["First"], ["Second"]]);
});
