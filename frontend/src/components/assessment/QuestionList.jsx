import { RadioGroup, RadioGroupItem } from "../ui/radio-group.jsx";
import { cn } from "../../lib/utils.js";
/** Presentational question list shared by the learner assessment and the admin preview. Never receives answer keys. */
export function QuestionList({ questions, answers, showMissing, onChoose, idPrefix = "" }) {
    return (<ol className="space-y-5">
      {questions.map((q, i) => {
            const isMissing = showMissing && !answers[q.id];
            const labelId = `${idPrefix}question-label-${q.id}`;
            return (<li key={q.id}>
            <fieldset id={`${idPrefix}question-${q.id}`} tabIndex={-1} className={cn("bg-card border rounded-2xl p-5 md:p-6 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", isMissing && "border-destructive")} aria-invalid={isMissing || undefined} aria-describedby={isMissing ? `${idPrefix}question-error-${q.id}` : undefined} data-testid={`card-question-${q.id}`}>
              <legend className="sr-only">Question {i + 1}</legend>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Question {i + 1} · {q.topic}
              </div>
              <p id={labelId} className="font-semibold text-lg leading-snug mb-4">{q.prompt}</p>
              <RadioGroup aria-labelledby={labelId} value={answers[q.id] ?? ""} onValueChange={(v) => onChoose(q.id, v)} className="gap-2">
                {q.options.map((o) => {
                    const optId = `${idPrefix}q${q.id}-${o.id}`;
                    const checked = answers[q.id] === o.id;
                    return (<label key={o.id} htmlFor={optId} className={cn("flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors min-h-12", checked ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                      <RadioGroupItem id={optId} value={o.id} className="mt-0.5" data-testid={`radio-option-${q.id}-${o.id}`}/>
                      <span className="text-base leading-snug">{o.text}</span>
                    </label>);
                })}
              </RadioGroup>
              {isMissing && (<p id={`${idPrefix}question-error-${q.id}`} className="text-sm text-destructive mt-3 font-medium">Please choose an answer.</p>)}
            </fieldset>
          </li>);
        })}
    </ol>);
}
