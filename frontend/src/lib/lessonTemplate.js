/**
 * CL-004 standard lesson structure. Stored in the existing lesson `content` HTML string;
 * title and duration come from the existing lesson fields. Placeholders only, no educational content.
 */
const d = (text) => `<p class="lesson-draft">DRAFT placeholder: ${text}</p>`;
export const STANDARD_LESSON_TEMPLATE = [
    `<p class="lesson-draft-banner"><strong>DRAFT TEMPLATE</strong> Replace every placeholder before publishing. Not reviewed educational content.</p>`,
    `<section aria-label="Introduction"><h2>Introduction</h2>${d("why this lesson matters for home-based carers.")}</section>`,
    `<section aria-label="Learning objectives"><h2>Learning objectives</h2><ul><li>DRAFT placeholder: objective 1</li><li>DRAFT placeholder: objective 2</li><li>DRAFT placeholder: objective 3</li></ul></section>`,
    `<section aria-label="Detailed educational content"><h2>Detailed educational content</h2>${d("main teaching content, short paragraphs and subheadings.")}<aside class="lesson-panel lesson-info" aria-label="Information"><p class="lesson-panel-label">Information</p>${d("supporting information or local guidance.")}</aside><aside class="lesson-panel lesson-safety" role="note" aria-label="Important safety warning"><p class="lesson-panel-label">Important safety warning</p>${d("safety point requiring clinical review.")}</aside></section>`,
    `<section aria-label="Key concepts and definitions"><h2>Key concepts and definitions</h2><dl><dt>DRAFT term</dt><dd>DRAFT placeholder: definition.</dd></dl></section>`,
    `<section aria-label="Practical examples"><h2>Practical examples</h2>${d("realistic example from daily care.")}</section>`,
    `<section aria-label="Home-based care case study"><h2>Home-based care case study</h2><aside class="lesson-panel lesson-case" aria-label="Case study"><p class="lesson-panel-label">Case study</p>${d("scenario, questions to consider and suggested response.")}</aside></section>`,
    `<section aria-label="Key learning points"><h2>Key learning points</h2><aside class="lesson-panel lesson-takeaway" aria-label="Key takeaways"><p class="lesson-panel-label">Key takeaways</p><ul><li>DRAFT placeholder: takeaway 1</li><li>DRAFT placeholder: takeaway 2</li></ul></aside></section>`,
    `<section aria-label="Lesson summary"><h2>Lesson summary</h2>${d("brief recap.")}</section>`,
    `<section aria-label="References"><h2>References</h2>${d("cite sources where applicable, or remove this section.")}</section>`,
].join("\n");
