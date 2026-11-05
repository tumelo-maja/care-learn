/**
 * Presentation-only lesson pagination. Works on a small plain tree
 * ({ tag, attrs, children } | { text }) so it is testable without a DOM.
 * Teaching is not removed or reworded: every node lands on one page, in order.
 * The browser adapter excludes editorial draft banners before pagination.
 */
import { lessonFragment } from "./lessonPresentation.js";

export const MAX_UNITS = 4;
const UNIT_TAGS = new Set(["p", "li", "dt", "dd", "pre", "table", "figure", "img", "blockquote", "details", "h4", "h5", "h6"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3"]);
const SPLITTABLE = new Set(["section", "div", "article", "aside", "ul", "ol", "dl", "li", "blockquote"]);
const VOID = new Set(["br", "hr", "img"]);

export const isText = (n) => typeof n.text === "string";
const hasText = (n) => isText(n) && n.text.trim() !== "";
const isHeading = (n) => !isText(n) && HEADING_TAGS.has(n.tag);
const blockChildren = (n) => n.children.some(c => !isText(c) && (SPLITTABLE.has(c.tag) || UNIT_TAGS.has(c.tag)));
const discarded = new Set("script style iframe object embed svg math template link meta base form input button textarea select video audio source".split(" "));
function readable(node) {
    if (isText(node)) return hasText(node);
    if (discarded.has(node.tag)) return false;
    return node.tag === "img" || node.children.some(readable);
}

/** Reading units: paragraphs, list items, images and similar chunks each count as one. */
export function weightOf(node) {
    if (isText(node)) return hasText(node) ? 1 : 0;
    if (isHeading(node) || node.tag === "br" || node.tag === "hr") return 0;
    if (node.tag === "li" || node.tag === "blockquote") {
        if (!blockChildren(node)) return 1;
        const own = node.children.some(c => hasText(c) || (!isText(c) && !SPLITTABLE.has(c.tag) && !UNIT_TAGS.has(c.tag))) ? 1 : 0;
        return own + node.children.reduce((s, c) => s + (isText(c) ? 0 : weightOf(c)), 0) || 1;
    }
    if (UNIT_TAGS.has(node.tag)) return 1;
    if (SPLITTABLE.has(node.tag)) return node.children.reduce((s, c) => s + weightOf(c), 0);
    return node.children.some(hasText) || node.children.some(c => !isText(c)) ? 1 : 0;
}

/** Generic packer: items { weight, sticky } -> pages of at most `max` units. Sticky items (headings) travel with what follows. */
export function packWeighted(items, max = MAX_UNITS) {
    const pages = [];
    let cur = [];
    let count = 0;
    for (const item of items) {
        if (item.breakBefore && count > 0) {
            pages.push(cur);
            cur = [];
            count = 0;
        }
        if (item.weight > 0 && count > 0 && count + item.weight > max) {
            let cut = cur.length;
            while (cut > 0 && cur[cut - 1].weight === 0) cut--;
            const carry = cur.slice(cut);
            if (cut > 0) { pages.push(cur.slice(0, cut)); cur = carry; count = 0; }
        }
        cur.push(item);
        count += item.weight;
    }
    if (cur.length) {
        if (count === 0 && pages.length) pages[pages.length - 1].push(...cur);
        else pages.push(cur);
    }
    // Avoid a one-unit tail when the preceding page can share its content.
    // Move the final reading unit together with its leading heading, never reorder.
    for (let i = pages.length - 1; i > 0; i--) {
        const sum = page => page.reduce((n, item) => n + item.weight, 0);
        const previous = pages[i - 1];
        const next = pages[i];
        if (next.some(item => item.breakBefore)) continue;
        while (sum(next) < Math.min(2, max) && sum(previous) > 2) {
            let end = previous.length - 1;
            while (end >= 0 && previous[end].weight === 0) end--;
            if (end < 0) break;
            let start = end;
            while (start > 0 && previous[start - 1].weight === 0) start--;
            const moved = previous.slice(start);
            if (moved.some(item => item.breakBefore)) break;
            const weight = sum(moved);
            if (weight + sum(next) > max || sum(previous) - weight < 2) break;
            previous.splice(start);
            next.unshift(...moved);
        }
    }
    return pages;
}

function flatten(nodes, anc, out, max) {
    for (const node of nodes) {
        if (!readable(node)) continue;
        const w = weightOf(node);
        if (!isText(node) && SPLITTABLE.has(node.tag) && (w > max || !["li", "blockquote"].includes(node.tag)))
            flatten(node.children, [...anc, node], out, max);
        else out.push({ node, anc, weight: w, sticky: isHeading(node), breakBefore: !isText(node) && ["h2", "h3"].includes(node.tag) });
    }
    return out;
}

function shallow(orig, firstChild) {
    const attrs = { ...orig.attrs };
    if (orig.tag === "ol" && firstChild) {
        const lis = orig.children.filter(c => !isText(c) && c.tag === "li");
        const idx = lis.indexOf(firstChild);
        if (idx > 0) attrs.start = String((parseInt(orig.attrs.start ?? "1", 10) || 1) + idx);
    }
    return { tag: orig.tag, attrs, children: [] };
}

const withoutId = ({ id: _id, ...rest }) => rest;
/** Rebuilds wrapped ancestors so a split section/list keeps its structure on every page. */
function rebuild(items) {
    const roots = [];
    let stack = []; // [{ orig, clone }]
    for (const { node, anc } of items) {
        let depth = 0;
        while (depth < stack.length && depth < anc.length && stack[depth].orig === anc[depth]) depth++;
        stack = stack.slice(0, depth);
        for (let d = depth; d < anc.length; d++) {
            const firstChild = d + 1 < anc.length ? anc[d + 1] : node;
            const clone = shallow(anc[d], firstChild);
            const firstIndex = anc[d].children.indexOf(firstChild);
            const heading = anc[d].children.slice(0, firstIndex).filter(isHeading).at(-1);
            if (heading && !isHeading(firstChild))
                clone.children.push({ tag: heading.tag, attrs: { ...withoutId(heading.attrs), "data-pagination-repeat": "true" }, children: heading.children });
            (d === 0 ? roots : stack[d - 1].clone.children).push(clone);
            stack.push({ orig: anc[d], clone });
        }
        (stack.length ? stack[stack.length - 1].clone.children : roots).push(node);
    }
    return roots;
}

/** Keep complete H2/H3 sections together; longer sections scroll rather than fragmenting. */
export function paginateTree(nodes, max = Infinity) {
    const items = flatten(nodes, [], [], max);
    if (!items.some(i => i.weight > 0)) return [];
    return packWeighted(items, max).map(rebuild);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
export function treeToHtml(nodes) {
    return nodes.map(n => {
        if (isText(n)) return esc(n.text);
        const attrs = Object.entries(n.attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join("");
        return VOID.has(n.tag) ? `<${n.tag}${attrs}>` : `<${n.tag}${attrs}>${treeToHtml(n.children)}</${n.tag}>`;
    }).join("");
}

/** Browser adapter: DOM nodes -> plain tree (comments dropped; sanitising happens at render). */
export function domToTree(nodes) {
    const out = [];
    for (const node of nodes) {
        if (node.nodeType === 3) out.push({ text: node.textContent ?? "" });
        else if (node.nodeType === 1) {
            const attrs = {};
            for (const a of Array.from(node.attributes)) attrs[a.name] = a.value;
            out.push({ tag: node.tagName.toLowerCase(), attrs, children: domToTree(Array.from(node.childNodes)) });
        }
    }
    return out;
}

/** HTML string -> plain tree (browser only). */
export function htmlToTree(html) {
    return domToTree(Array.from(lessonFragment(html ?? "").childNodes));
}

/** HTML string -> page HTML strings. */
export function paginateHtml(html, max = Infinity) {
    return paginateTree(htmlToTree(html), max).map(treeToHtml);
}

/** Tree pages with their unit weight. */
export function treeParts(nodes, max = Infinity) {
    const hasSubsection = nodes => nodes.some(node => !isText(node) && (
        (["h2", "h3"].includes(node.tag) && !node.attrs["data-pagination-repeat"]) || hasSubsection(node.children)
    ));
    return paginateTree(nodes, max).map(page => ({ html: treeToHtml(page), weight: page.reduce((s, n) => s + weightOf(n), 0), breakBefore: hasSubsection(page) }));
}

/**
 * Paginate interactive blocks. Subsections start new pages, without changing their titles.
 * Practice questions get their own page so feedback has space, and are never split or flattened.
 * `parts(html)` returns [{ html, weight }].
 */
export function paginateBlocks(blocks, parts) {
    const pages = [];
    for (const block of blocks) {
        if (block.question) { pages.push([block]); continue; }
        const split = parts(block.html ?? "");
        if (!split.length) continue;
        for (const [i, part] of split.entries()) {
            const view = { ...block, id: i ? `${block.id}-part-${i + 1}` : block.id, html: part.html };
            const previous = pages.at(-1)?.[0];
            // Unstructured introductory paragraphs remain one coherent chunk.
            if (!block.title && !part.breakBefore && previous?.type === "notice" && !previous.title && !previous.hasHeading) {
                previous.html += view.html;
            } else pages.push([{ ...view, hasHeading: !!part.breakBefore }]);
        }
    }
    return pages;
}
