import { useMemo, useState } from "react";
import { Button } from "../ui/button.jsx";
import { cn } from "../../lib/utils.js";
import { paginateHtml } from "../../lib/lessonPagination.js";
import { usesBalancedLessonFormat } from "../../lib/lessonPresentation.js";
import { InteractiveLesson } from "./InteractiveLesson.jsx";
import { LessonPager } from "./LessonPager.jsx";
import { SafeLessonHtml } from "./SafeLessonHtml.jsx";
import { LessonCover } from "./LessonCover.jsx";
const card = "h-full min-h-0 overflow-y-auto overscroll-contain lesson-content prose prose-slate md:prose-lg dark:prose-invert max-w-none bg-card p-5 md:p-10 rounded-2xl border shadow-sm";
function PagedHtml({ html, className, emptyText, onPageChange, openingPage }) {
    const pages = useMemo(() => paginateHtml(html), [html]);
    const views = pages.length
        ? pages.map((page, i) => <section key={i} tabIndex={0} data-lesson-scroll aria-label="Lesson content" className={card}><SafeLessonHtml html={page}/></section>)
        : [<section key="empty" tabIndex={0} data-lesson-scroll aria-label="Lesson content" className={card}><p>{emptyText}</p></section>];
    if (openingPage) views.unshift(openingPage);
    return <div className={className}><LessonPager pages={views} onPageChange={onPageChange} hasCover={!!openingPage}/></div>;
}
/** Shared safe, paginated renderer; learner and admin-preview views opt in to interactive practice. */
export function LessonContent({ html, className, emptyText = "No content provided.", interactive = false, onPageChange, lessonTitle, courseTitle, coverImageUrl }) {
    const openingPage = lessonTitle ? <LessonCover key="cover" title={lessonTitle} courseTitle={courseTitle} imageUrl={coverImageUrl}/> : null;
    if (interactive && html)
        return <div className={className}><InteractiveLesson html={html} className={usesBalancedLessonFormat(html) ? "visual-pilot" : undefined} openingPage={openingPage} onPageChange={onPageChange}/></div>;
    return <PagedHtml key={html ?? ""} html={html ?? ""} className={className} emptyText={emptyText} openingPage={openingPage} onPageChange={onPageChange}/>;
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
