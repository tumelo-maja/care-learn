import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button.jsx";
test("contrast buttons have an explicit light surface and dark text, including hover", () => {
    const html = renderToStaticMarkup(createElement(Button, { variant: "contrast" }, "Retake course"));
    for (const name of ["bg-white", "text-slate-950", "border-slate-300", "hover:bg-slate-100", "hover:text-slate-950"])
        assert.ok(html.includes(name));
});
test("contrast buttons retain disabled behaviour and readable disabled styling", () => {
    const html = renderToStaticMarkup(createElement(Button, { variant: "contrast", disabled: true }, "Retake assessment"));
    assert.match(html, /disabled=""/);
    assert.ok(html.includes("disabled:opacity-70"));
});
