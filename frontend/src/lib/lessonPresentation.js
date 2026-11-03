export function isHbc001Prototype(code, title, index) {
    return code === "HBC001" && index === 0 && title === "Introduction to Professional Home-Based Care";
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
    return template.content;
}
const htmlOf = (nodes) => nodes.map(node => node.nodeType === 1 ? node.outerHTML : node.textContent?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "").join("");
/** Presentation adapter for existing standard sections; no writes or new teaching. */
export function parseInteractiveLesson(html) {
    const blocks = [];
    const add = (block) => blocks.push({ ...block, id: `section-${blocks.length}` });
    for (const node of Array.from(lessonFragment(html).childNodes)) {
        if (node.nodeType === 3 && !node.textContent?.trim())
            continue;
        const section = node.nodeType === 1 ? node : null;
        const heading = section?.tagName === "SECTION" ? section.querySelector(":scope > h2") : null;
        if (!section || !heading) {
            add({ type: "notice", title: "", html: htmlOf([node]) });
            continue;
        }
        const title = heading.textContent?.trim() || "Lesson section";
        const body = Array.from(section.childNodes).filter(child => child !== heading);
        if (title === "Detailed educational content") {
            let subTitle = title;
            let group = [];
            const flush = () => {
                if (group.some(child => child.nodeType === 1 || child.textContent?.trim())) {
                    add({ type: "teaching", title: subTitle, html: htmlOf(group) });
                }
                group = [];
            };
            for (const child of body) {
                if (child.nodeType === 1 && child.tagName === "H3") {
                    flush();
                    subTitle = child.textContent?.trim() || title;
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
                const options = Array.from(question.querySelectorAll(":scope > ol > li")).map(option => option.textContent?.trim() ?? "");
                const feedback = question.querySelector("details > p")?.textContent?.trim() ?? "";
                const correct = feedbackAnswerIndex(feedback, options.length);
                const questionTitle = question.querySelector(":scope > h3")?.textContent?.trim() || `Question ${index + 1}`;
                if (prompt && options.length > 1 && correct !== null && feedback) {
                    const id = `practice-${index + 1}`;
                    blocks.push({ id, type: index === 1 ? "scenario" : "knowledge-check", title: questionTitle,
                        question: { id, prompt, options, correctOptionIndex: correct, feedback } });
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
            add({ type, title, html: htmlOf(body) });
        }
    }
    return blocks;
}
