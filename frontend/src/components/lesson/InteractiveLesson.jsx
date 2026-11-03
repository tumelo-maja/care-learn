import { useState } from "react";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { Label } from "../ui/label.jsx";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group.jsx";
import { cn } from "../../lib/utils.js";
import { parseInteractiveLesson, safeLessonUrl } from "../../lib/lessonPresentation.js";
import { SafeLessonHtml } from "./SafeLessonHtml";
const prose = "lesson-content prose prose-slate dark:prose-invert max-w-none";
function BlockShell({ id, title, children, className }) {
    const headingId = `${id}-heading`;
    return (<section aria-labelledby={title ? headingId : undefined} data-testid={`lesson-block-${id}`} className={cn("bg-card border rounded-2xl p-5 md:p-8 shadow-sm", className)}>
      {title && (<h2 id={headingId} className="flex items-center gap-2 font-serif text-xl md:text-2xl text-primary mb-4" data-testid={`heading-${id}`}>
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
export function ExpandableExplanation({ id, title, html, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = `${id}-panel`;
    return (<section className="bg-card border rounded-2xl shadow-sm" data-testid={`lesson-block-${id}`}>
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
    return (<BlockShell id={id} title={title} className="border-l-4 border-l-primary">
      <SafeLessonHtml html={html} className={prose}/>
    </BlockShell>);
}
export function PracticeQuestionBlock({ title, question, scenario = false }) {
    const [choice, setChoice] = useState("");
    const chosen = choice === "" ? null : Number(choice);
    const correct = chosen === question.correctOptionIndex;
    const headingId = `${question.id}-heading`;
    const promptId = `${question.id}-prompt`;
    return (<section aria-labelledby={headingId} data-testid={`practice-${question.id}`} className="bg-card border border-primary/25 rounded-2xl p-5 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">{scenario ? "Scenario practice" : "Knowledge check"}</span>
        <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5" data-testid={`text-practice-note-${question.id}`}>
          Practice only. Not graded or saved.
        </span>
      </div>
      <h2 id={headingId} className="flex items-center gap-2 font-serif text-xl text-foreground mb-3">
        {title}
      </h2>
      <p id={promptId} className={cn("mb-4 leading-relaxed", scenario && "border-l-4 border-accent bg-accent/10 rounded-lg p-3")}>{question.prompt}</p>
      <RadioGroup value={choice} onValueChange={setChoice} aria-labelledby={promptId} className="gap-2">
        {question.options.map((option, i) => {
            const isChosen = chosen === i;
            const inputId = `${question.id}-option-${i}`;
            return (<div key={i} className={cn("flex items-start gap-3 rounded-xl border p-3 transition-colors", isChosen && (correct ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"))}>
              <RadioGroupItem value={String(i)} id={inputId} className="mt-0.5" data-testid={`radio-${question.id}-${i}`}/>
              <Label htmlFor={inputId} className="flex-1 font-normal leading-relaxed cursor-pointer">
                <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>{option}
              </Label>
            </div>);
        })}
      </RadioGroup>
      <div aria-live="polite">
        {chosen !== null && (<div data-testid={`practice-feedback-${question.id}`} className={cn("mt-4 rounded-xl border-l-4 p-4", correct ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10")}>
            <p className="flex items-center gap-2 font-semibold mb-1" data-testid={`status-practice-${question.id}`}>
              {correct ? <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true"/> : <XCircle className="w-5 h-5 text-destructive" aria-hidden="true"/>}
              Option {String.fromCharCode(65 + chosen)} is {correct ? "appropriate" : "not the most appropriate choice"}.
            </p>
            <p className="leading-relaxed">{question.feedback}</p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setChoice("")} data-testid={`button-reset-${question.id}`}>
              Try again
            </Button>
          </div>)}
      </div>
    </section>);
}
function renderBlock(block) {
    if (block.type === "knowledge-check" || block.type === "scenario") {
        return <PracticeQuestionBlock key={`${block.id}:${block.question.prompt}`} title={block.title} question={block.question} scenario={block.type === "scenario"}/>;
    }
    if (block.type === "explanation")
        return <ExpandableExplanation key={block.id} {...block} defaultOpen={block.title === "Reviewer notes"}/>;
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
function Blocks({ html }) {
    const [blocks] = useState(() => parseInteractiveLesson(html));
    return <div className="space-y-5 md:space-y-6" data-testid="interactive-lesson">{blocks.map(renderBlock)}</div>;
}
/** Interactive presentation of stored lesson HTML; local state resets whenever html changes. */
export function InteractiveLesson({ html }) {
    return <Blocks key={html} html={html}/>;
}
