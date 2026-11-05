import { useState } from "react";
import { safeLessonUrl } from "../../lib/lessonPresentation.js";

const fallbackSrc = () => `${import.meta.env.BASE_URL ?? "/"}images/hero-caring.png`;

/** First lesson page: cover image plus the exact lesson title. Title renders even if the image fails. */
export function LessonCover({ title, courseTitle, imageUrl }) {
    const fallback = fallbackSrc();
    const initial = safeLessonUrl(imageUrl, true) ?? fallback;
    const [src, setSrc] = useState(initial);
    const [hidden, setHidden] = useState(false);
    const onError = () => {
        if (src !== fallback) setSrc(fallback);
        else setHidden(true);
    };
    return (<section tabIndex={0} data-lesson-scroll aria-labelledby="lesson-cover-title" data-testid="lesson-cover" className="h-full min-h-0 overflow-y-auto overscroll-contain flex flex-col rounded-2xl border bg-card shadow-sm">
      {!hidden && (<div className="w-full min-h-0 shrink aspect-[16/9] max-h-[60%] overflow-hidden bg-muted">
          <img src={src} alt="" onError={onError} decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-cover" data-testid="img-lesson-cover"/>
        </div>)}
      <div className="shrink-0 p-5 md:p-10">
        {courseTitle && (<p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-primary mb-2" data-testid="text-lesson-cover-course">
            {courseTitle}
          </p>)}
        <h1 id="lesson-cover-title" className="font-serif text-2xl md:text-4xl leading-tight text-foreground break-words" data-testid="text-lesson-cover-title">
          {title}
        </h1>
      </div>
    </section>);
}
