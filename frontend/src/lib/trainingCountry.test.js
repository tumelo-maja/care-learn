import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { TRAINING_COUNTRIES, countryLabel } from "./trainingCountry.js";

test("neutral track labels preserve existing regional keys and unknown history", () => {
    assert.deepEqual(TRAINING_COUNTRIES, [
        { code: "ZM", label: "Track A" },
        { code: "ZA", label: "Track B" },
    ]);
    assert.equal(countryLabel("ZM"), "Track A");
    assert.equal(countryLabel("ZA"), "Track B");
    assert.equal(countryLabel(null), null);
    assert.equal(countryLabel("unsupported"), null);
});

test("all application screens and metadata omit named-country branding", async () => {
    const forbidden = /\b(?:UK|United Kingdom|British|England|Zambia|Zambian|South Africa|South African)\b/i;
    async function scan(directory) {
        for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
            const file = new URL(entry.name, directory);
            if (entry.isDirectory()) await scan(new URL(`${entry.name}/`, directory));
            else if (/\.(jsx?|css)$/.test(entry.name) && !entry.name.includes(".test.")) {
                assert.doesNotMatch(await fs.readFile(file, "utf8"), forbidden, `Named-country wording in ${file.pathname}`);
            }
        }
    }
    await scan(new URL("../", import.meta.url));
    const html = await fs.readFile(new URL("../../index.html", import.meta.url), "utf8");
    assert.doesNotMatch(html, forbidden);
    assert.match(html, /Home-Based Care Learning for Africa/);
});
