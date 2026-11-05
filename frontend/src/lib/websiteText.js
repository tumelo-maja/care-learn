/** Presentation-only typography; never rewrite stored content, identifiers or URLs. */
export function websiteText(value) {
    return typeof value === "string" ? value.replace(/\u2014/g, "-") : value;
}

const displayFields = new Set([
    "title", "name", "description", "shortdescription", "summary", "topic",
    "prompt", "text", "explanation", "feedback", "optionfeedback", "options",
    "selectedanswer", "correctanswer", "username", "learnername", "firstname",
    "lastname", "fullname", "coursetitle", "moduletitle", "lessontitle",
    "categoryname", "message", "error", "reviewername", "reviewcomments",
    "comments", "notes", "reason", "label", "question", "rationale",
    "alt", "imagealt", "caption",
]);
/** Project human-readable RPC fields without changing raw lesson HTML or opaque values. */
export function websiteResponseText(value, field = "") {
    if (typeof value === "string")
        return displayFields.has(field.replace(/_/g, "").toLowerCase()) ? websiteText(value) : value;
    if (Array.isArray(value))
        return value.map(item => websiteResponseText(item, field));
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, websiteResponseText(item, key)]));
    return value;
}
