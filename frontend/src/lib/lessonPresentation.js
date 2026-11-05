import { websiteText } from "./websiteText.js";

export function isHbc001Prototype(code, title, index) {
    return code === "HBC001" && index === 0 && title === "Introduction to Professional Home-Based Care";
}
/** Opt-in visual lesson styling: original HBC001 pilot marker or the generic balanced-format marker. */
export function usesBalancedLessonFormat(html) {
    return typeof html === "string" && (html.includes('data-visual-pilot="hbc001-v1"') || /data-visual-format=["']balanced["']/.test(html));
}
/** Explicit author-written answer letters only; never infer an answer from prose. */
export function feedbackAnswerIndex(feedback, optionCount) {
    const match = feedback.trim().match(/^([A-Z]) is (?:best|correct)\b/);
    const index = match ? match[1].charCodeAt(0) - 65 : -1;
    return index >= 0 && index < optionCount ? index : null;
}
export function safeLessonUrl(value, image = false) {
    if (!value || /[\u0000-\u001f\u007f]/.test(value))
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    try {
        const url = new URL(trimmed, "https://lesson.invalid/");
        if (url.protocol === "https:" || url.protocol === "http:" || (!image && url.protocol === "mailto:"))
            return trimmed;
    }
    catch { /* Invalid URLs are deliberately not made clickable. */ }
    return undefined;
}
/** Template contents are inert: no script execution or eager embedded-media loads. */
export function lessonFragment(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    // Decode HTML entities first, then normalise only readable text/labels.
    // Source HTML, links, asset URLs and data attributes remain untouched.
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
        walker.currentNode.nodeValue = websiteText(walker.currentNode.nodeValue);
    for (const element of template.content.querySelectorAll("[alt], [title], [aria-label], [data-feedback]"))
        for (const attribute of ["alt", "title", "aria-label", "data-feedback"])
            if (element.hasAttribute(attribute))
                element.setAttribute(attribute, websiteText(element.getAttribute(attribute)));
    // Editorial notices remain in stored content/the editor, not lesson pages.
    template.content.querySelectorAll(".lesson-draft-banner").forEach(notice => notice.remove());
    return template.content;
}
const htmlOf = (nodes) => nodes.map(node => node.nodeType === 1 ? node.outerHTML : node.textContent?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "").join("");
const HIDDEN_SECTIONS = new Set(["references", "reviewer notes"]);
export function isHiddenSectionTitle(title) {
    return HIDDEN_SECTIONS.has(title.trim().replace(/\s+/g, " ").replace(/:$/, "").toLowerCase());
}
/** Wrap top-level H2 runs (until the next H2 or section) in a virtual section so both markups parse alike. */
function groupTopLevelHeadings(fragment) {
    const out = [];
    let current = null;
    for (const node of Array.from(fragment.childNodes)) {
        const el = node.nodeType === 1 ? node : null;
        if (el?.tagName === "H2") {
            current = fragment.ownerDocument.createElement("section");
            current.appendChild(el.cloneNode(true));
            out.push(current);
        }
        else if (el?.tagName === "SECTION")
            { current = null; out.push(node); }
        else if (current)
            current.appendChild(node.cloneNode(true));
        else
            out.push(node);
    }
    return out;
}
/** Never expose a shared answer key or an unselected option's explanation. */
export function practiceFeedback(question, chosen) {
    const correct = chosen === question.correctOptionIndex;
    const selected = question.options[chosen];
    const reason = question.optionFeedback?.[chosen]?.trim();
    const acknowledgment = `${correct ? "Well done. " : ""}Your selection of “${selected}” is ${correct ? "correct" : "incorrect"}`;
    return {
        correct,
        title: correct ? "Correct answer" : "Incorrect answer",
        text: reason
            ? `${acknowledgment} because ${reason}`
            : `${acknowledgment}. ${correct ? "" : "Revisit the lesson and reflect on how this choice fits the question."}`.trim(),
    };
}
/** Presentation adapter for existing standard sections; no writes or new teaching. */
export function parseInteractiveLesson(html) {
    const blocks = [];
    const add = (block) => blocks.push({ ...block, id: `section-${blocks.length}` });
    let pending = [];
    const flushPending = () => {
        if (pending.length) add({ type: "notice", title: "", html: htmlOf(pending) });
        pending = [];
    };
    const summaries = [];
    for (const node of groupTopLevelHeadings(lessonFragment(html))) {
        if (node.nodeType === 3 && !node.textContent?.trim())
            continue;
        const section = node.nodeType === 1 ? node : null;
        const heading = section?.tagName === "SECTION" ? section.querySelector(":scope > h2") : null;
        if (!section || !heading) {
            pending.push(node);
            continue;
        }
        flushPending();
        const title = heading.textContent?.trim() || "Lesson section";
        // Editorial sections stay in source/editor data but never reach learners.
        if (isHiddenSectionTitle(title))
            continue;
        const body = Array.from(section.childNodes).filter(child => child !== heading);
        if (title === "Detailed educational content") {
            let subTitle = title;
            let startNewPage = false;
            let group = [];
            const flush = () => {
                if (group.some(child => child.nodeType === 1 || child.textContent?.trim())) {
                    add({ type: "teaching", title: subTitle, html: htmlOf(group), startNewPage });
                }
                group = [];
            };
            for (const child of body) {
                if (child.nodeType === 1 && child.tagName === "H3") {
                    flush();
                    subTitle = child.textContent?.trim() || title;
                    startNewPage = true;
                }
                else
                    group.push(child);
            }
            flush();
        }
        else if (title === "Formative knowledge checks") {
            const questions = body.filter(child => child.nodeType === 1 && child.tagName === "DIV");
            add({ type: "teaching", title, html: htmlOf(body.filter(child => !questions.includes(child))) });
            for (const [index, question] of questions.entries()) {
                const prompt = question.querySelector(":scope > p")?.textContent?.trim() ?? "";
                const items = Array.from(question.querySelectorAll(":scope > ol > li"));
                const options = items.map(option => option.textContent?.trim() ?? "");
                const optionFeedback = items.map(option => option.getAttribute("data-feedback")?.trim() ?? "");
                const feedback = question.querySelector("details > p")?.textContent?.trim() ?? "";
                const correct = feedbackAnswerIndex(feedback, options.length);
                const questionTitle = question.querySelector(":scope > h3")?.textContent?.trim() || `Question ${index + 1}`;
                if (prompt && options.length > 1 && correct !== null && feedback) {
                    const id = `practice-${index + 1}`;
                    blocks.push({ id, type: index === 1 ? "scenario" : "knowledge-check", title: questionTitle,
                        question: { id, prompt, options, correctOptionIndex: correct, feedback,
                            ...(optionFeedback.some(Boolean) ? { optionFeedback } : {}) } });
                }
                else {
                    // Open reflection or unfamiliar question formats retain all original markup.
                    add({ type: "explanation", title: questionTitle, html: htmlOf(Array.from(question.childNodes).filter(child => !(child.nodeType === 1 && child.tagName === "H3"))) });
                }
            }
        }
        else {
            const type = title === "Key learning points" ? "takeaways" : title === "Lesson summary" ? "summary"
                : ["Key concepts and definitions", "References", "Reviewer notes"].includes(title) ? "explanation" : "teaching";
            if (type === "summary")
                summaries.push({ type, title, html: htmlOf(body) });
            else
                add({ type, title, html: htmlOf(body) });
        }
    }
    flushPending();
    // Lesson summary always closes the lesson, whatever the source order.
    for (const summary of summaries)
        add(summary);
    return blocks;
}
