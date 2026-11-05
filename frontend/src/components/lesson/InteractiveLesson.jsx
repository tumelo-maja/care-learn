import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { Label } from "../ui/label.jsx";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group.jsx";
import { cn } from "../../lib/utils.js";
import { parseInteractiveLesson, practiceFeedback, safeLessonUrl } from "../../lib/lessonPresentation.js";
import { htmlToTree, paginateBlocks, treeParts } from "../../lib/lessonPagination.js";
import { LessonPager } from "./LessonPager.jsx";
import { SafeLessonHtml } from "./SafeLessonHtml.jsx";
import "./visual-pilot.css";
const prose = "lesson-content prose prose-slate dark:prose-invert max-w-none";
function BlockShell({ id, title, children, className }) {
    const headingId = `${id}-heading`;
    return (<section tabIndex={0} data-lesson-scroll aria-labelledby={title ? headingId : undefined} data-testid={`lesson-block-${id}`} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-x-contain overscroll-y-auto bg-card border rounded-2xl p-5 md:p-8 shadow-sm", className)}>
      {title && (<h2 id={headingId} className="flex items-center gap-2 font-serif text-xl md:text-2xl text-primary mb-6" data-testid={`heading-${id}`}>
          {title}
        </h2>)}
      {children}
    </section>);
}
export function TeachingSection({ id, title, html, image }) {
    const src = image ? safeLessonUrl(image.src, true) : undefined;
    return (<BlockShell id={id} title={title}>
      {src && image?.alt.trim() && (<img src={src} alt={image.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="max-w-full h-auto max-h-80 object-contain rounded-xl mb-5 bg-muted" data-testid={`img-${id}`}/>)}
      {image && (!src || !image.alt.trim()) && <p role="note" className="text-sm text-muted-foreground">Optional image not shown: a safe image URL and alternative text are required.</p>}
      <SafeLessonHtml html={html} className={prose}/>
    </BlockShell>);
}
export function ExpandableExplanation({ id, title, html, defaultOpen = false, open: openProp, onOpenChange }) {
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const open = openProp ?? localOpen;
    const setOpen = (fn) => { const next = fn(open); setLocalOpen(next); onOpenChange?.(next); };
    const panelId = `${id}-panel`;
    return (<section tabIndex={0} data-lesson-scroll aria-label={title} className="min-h-0 flex-1 overflow-y-auto overscroll-x-contain overscroll-y-auto bg-card border rounded-2xl shadow-sm" data-testid={`lesson-block-${id}`}>
      <h2 className="m-0">
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(o => !o)} data-testid={`button-toggle-${id}`} className="w-full flex items-center gap-2 text-left p-5 md:px-8 font-serif text-lg md:text-xl text-primary rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex-1">{title || "More information"}</span>
          <ChevronDown className={cn("w-5 h-5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true"/>
        </button>
      </h2>
      <div id={panelId} hidden={!open} className="px-5 md:px-8 pb-6">
        <SafeLessonHtml html={html} className={prose}/>
      </div>
    </section>);
}
export function KeyTakeaways({ id, title, html }) {
    return (<BlockShell id={id} title={title} className="bg-secondary/50 border-primary/20">
      <SafeLessonHtml html={html} className={prose}/>
    </BlockShell>);
}
export function LessonSummary({ id, title, html }) {
    return (<BlockShell id={id} title={title}>
      <SafeLessonHtml html={html} className={prose}/>
    </BlockShell>);
}
export function PracticeQuestionBlock({ title, question, scenario = false, value, onValueChange }) {
    const [localChoice, setLocalChoice] = useState("");
    const choice = value ?? localChoice;
    const setChoice = (next) => { setLocalChoice(next); onValueChange?.(next); };
    const chosen = choice === "" ? null : Number(choice);
    const result = chosen === null ? null : practiceFeedback(question, chosen);
    const correct = !!result?.correct;
    const headingId = `${question.id}-heading`;
    const promptId = `${question.id}-prompt`;
    return (<section tabIndex={0} data-lesson-scroll aria-labelledby={headingId} data-testid={`practice-${question.id}`} className="min-h-0 flex-1 overflow-y-auto overscroll-x-contain overscroll-y-auto bg-card border border-primary/25 rounded-2xl p-5 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">{scenario ? "Scenario practice" : "Knowledge check"}</span>
        <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5" data-testid={`text-practice-note-${question.id}`}>
          Practice only. Not graded or saved.
        </span>
      </div>
      <h2 id={headingId} className="flex items-center gap-2 font-serif text-xl text-foreground mb-5">
        {title}
      </h2>
      <p id={promptId} className="mb-6 leading-relaxed">{question.prompt}</p>
      <RadioGroup value={choice} onValueChange={setChoice} aria-labelledby={promptId} className="gap-3">
        {question.options.map((option, i) => {
            const isChosen = chosen === i;
            const inputId = `${question.id}-option-${i}`;
            return (<div key={i} className={cn("flex items-start gap-3 rounded-xl border p-4 transition-colors", isChosen && (correct ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "border-red-600 bg-red-50 dark:bg-red-950/40"))}>
              <RadioGroupItem value={String(i)} id={inputId} className="mt-0.5" data-testid={`radio-${question.id}-${i}`}/>
              <Label htmlFor={inputId} className="flex-1 font-normal leading-relaxed cursor-pointer">
                <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>{option}
              </Label>
            </div>);
        })}
      </RadioGroup>
      <div aria-live="polite">
        {chosen !== null && (<div data-testid={`practice-feedback-${question.id}`} className={cn("mt-6 rounded-xl border p-4", correct ? "border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50" : "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-50")} data-result={correct ? "correct" : "incorrect"}>
            <p className={cn("flex items-center gap-2 font-semibold mb-1", correct ? "text-emerald-800 dark:text-emerald-300" : "text-red-700 dark:text-red-300")} data-testid={`status-practice-${question.id}`}>
              {correct ? <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true"/> : <XCircle className="w-5 h-5 text-red-600" aria-hidden="true"/>}
              {result.title}
            </p>
            <p className="leading-relaxed" data-testid={`text-practice-explanation-${question.id}`}>{result.text}</p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setChoice("")} data-testid={`button-reset-${question.id}`}>
              Try again
            </Button>
          </div>)}
      </div>
    </section>);
}
function renderBlock(block, state) {
    if (block.type === "knowledge-check" || block.type === "scenario") {
        return <PracticeQuestionBlock key={`${block.id}:${block.question.prompt}`} title={block.title} question={block.question} scenario={block.type === "scenario"} value={state.answers[block.question.id] ?? ""} onValueChange={(v) => state.setAnswers(a => ({ ...a, [block.question.id]: v }))}/>;
    }
    if (block.type === "explanation")
        return <ExpandableExplanation key={block.id} id={block.id} title={block.title} html={block.html} open={state.open[block.id] ?? true} onOpenChange={(o) => state.setOpen(m => ({ ...m, [block.id]: o }))}/>;
    if (block.type === "takeaways")
        return <KeyTakeaways key={block.id} {...block}/>;
    if (block.type === "summary")
        return <LessonSummary key={block.id} {...block}/>;
    if (block.type === "notice")
        return (<div key={block.id} data-testid={`lesson-block-${block.id}`} className="rounded-2xl border border-dashed border-accent/60 bg-accent/5 p-4">
      <SafeLessonHtml html={block.html} className={prose}/>
    </div>);
    return <TeachingSection key={block.id} id={block.id} title={block.title} html={block.html}/>;
}
function Blocks({ html, onPageChange, openingPage, className }) {
    const pages = useMemo(() => paginateBlocks(parseInteractiveLesson(html), h => treeParts(htmlToTree(h))), [html]);
    // Lifted so answers and open panels survive moving between pages.
    const [answers, setAnswers] = useState({});
    const [open, setOpen] = useState({});
    const state = { answers, setAnswers, open, setOpen };
    // Constrain sections to the view so their own overflow scrolls, not the pager.
    const views = pages.map((page, i) => <div key={i} className={cn("h-full min-h-0 flex flex-col gap-5 md:gap-6", className)} data-testid="interactive-lesson">{page.map(b => renderBlock(b, state))}</div>);
    if (!views.length) views.push(<section key="empty" tabIndex={0} data-lesson-scroll aria-label="Lesson content" className="h-full overflow-y-auto overscroll-x-contain overscroll-y-auto p-5"><p>No content provided.</p></section>);
    if (openingPage) views.unshift(openingPage);
    return <LessonPager pages={views} onPageChange={onPageChange} hasCover={!!openingPage}/>;
}
/** Interactive presentation of stored lesson HTML; local state resets whenever html changes. */
export function InteractiveLesson({ html, onPageChange, openingPage, className }) {
    return <Blocks key={html} html={html} openingPage={openingPage} onPageChange={onPageChange} className={className}/>;
}
