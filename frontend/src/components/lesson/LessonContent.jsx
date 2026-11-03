import { useState } from "react";
import { Button } from "../ui/button.jsx";
import { cn } from "../../lib/utils.js";
import { InteractiveLesson } from "./InteractiveLesson";
import { SafeLessonHtml } from "./SafeLessonHtml";
/** Shared safe renderer; enhanced practice presentation is explicitly opt-in. */
export function LessonContent({ html, className, emptyText = "No content provided.", interactive = false }) {
    if (interactive && html)
        return <div className={className}><InteractiveLesson html={html}/></div>;
    return (<div className={cn("lesson-content prose prose-slate prose-lg dark:prose-invert max-w-none bg-card p-5 md:p-12 rounded-2xl border shadow-sm", className)}>
      {html ? <SafeLessonHtml html={html}/> : <p>{emptyText}</p>}
    </div>);
}
/** Optional video. No network request until the learner clicks Load. Never autoplays. */
export function LessonVideo({ url, title }) {
    const [loaded, setLoaded] = useState(false);
    return (<div className="aspect-video w-full rounded-2xl overflow-hidden border bg-muted/50 mb-8" data-testid="lesson-video">
      {loaded ? (<iframe src={url} title={`Lesson video: ${title}`} loading="lazy" className="w-full h-full" allow="clipboard-write; encrypted-media; picture-in-picture" allowFullScreen/>) : (<div className="h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm text-muted-foreground">Optional video. Loading uses mobile data.</p>
          <Button type="button" onClick={() => setLoaded(true)} data-testid="button-load-video">
            Load video
          </Button>
        </div>)}
    </div>);
}
