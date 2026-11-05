import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CertificateDevelopmentNotice } from "./CertificateDevelopmentNotice.jsx";
test("certificate development warning is visible only to confirmed administrators in development", () => {
    const render = props => renderToStaticMarkup(createElement(CertificateDevelopmentNotice, props));
    assert.match(render({ isAdmin: true, developmentBuild: true }), /text-dev-qr-warning/);
    for (const isAdmin of [false, undefined, null, "admin"])
        assert.equal(render({ isAdmin, developmentBuild: true }), "");
    assert.equal(render({ isAdmin: true, developmentBuild: false }), "");
});
