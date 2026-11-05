import { createElement } from "react";
import { lessonFragment, safeLessonUrl } from "../../lib/lessonPresentation.js";
const allowed = new Set("a abbr article aside b blockquote br caption code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img li mark ol p pre section small span strong sub summary sup table tbody td th thead tr u ul".split(" "));
const discard = new Set("script style iframe object embed svg math template link meta base form input button textarea select video audio source".split(" "));
function renderNode(node, key) {
    if (node.nodeType === 3)
        return node.textContent;
    if (node.nodeType !== 1)
        return null;
    const element = node;
    const tag = element.tagName.toLowerCase();
    if (discard.has(tag))
        return null;
    const children = Array.from(element.childNodes).map(renderNode);
    if (!allowed.has(tag))
        return children;
    const props = { key };
    for (const attribute of ["class", "title", "aria-label", "id"]) {
        const value = element.getAttribute(attribute);
        if (value)
            props[attribute === "class" ? "className" : attribute] = value;
    }
    if (tag === "a") {
        props.href = safeLessonUrl(element.getAttribute("href"));
        if (element.getAttribute("target") === "_blank") {
            props.target = "_blank";
            props.rel = "noopener noreferrer";
        }
    }
    if (tag === "ol" && /^[aAiI1]$/.test(element.getAttribute("type") ?? ""))
        props.type = element.getAttribute("type");
    if (tag === "ol" && /^\d+$/.test(element.getAttribute("start") ?? ""))
        props.start = Number(element.getAttribute("start"));
    if (["td", "th"].includes(tag)) {
        for (const attribute of ["colspan", "rowspan"]) {
            const value = Number(element.getAttribute(attribute));
            if (Number.isInteger(value) && value > 0 && value <= 1000)
                props[attribute === "colspan" ? "colSpan" : "rowSpan"] = value;
        }
    }
    if (tag === "details" && element.hasAttribute("open"))
        props.open = true;
    if (element.getAttribute("role") === "note")
        props.role = "note";
    if (tag === "th" && ["row", "col"].includes(element.getAttribute("scope") ?? ""))
        props.scope = element.getAttribute("scope");
    if (tag === "img") {
        const src = safeLessonUrl(element.getAttribute("src"), true);
        if (!src)
            return null;
        return createElement("img", { ...props, src, alt: element.getAttribute("alt") ?? "", loading: "lazy", decoding: "async",
            referrerPolicy: "no-referrer", className: "block max-w-full w-auto h-auto max-h-64 md:max-h-80 object-contain mx-auto my-4 rounded-xl bg-muted" });
    }
    if (["br", "hr"].includes(tag))
        return createElement(tag, props);
    return createElement(tag, props, children);
}
/** HTML becomes allowlisted React elements, never executable stored markup. */
export function SafeLessonHtml({ html, className }) {
    return <div className={className}>{Array.from(lessonFragment(html).childNodes).map(renderNode)}</div>;
}
