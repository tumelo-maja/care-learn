import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { cn } from "../../lib/utils.js";
/**
 * Shows one page at a time. Sections scroll inside a fixed-height reading panel;
 * controls sit outside it so they stay reachable. Reports page position upward.
 */
export function LessonPager({ pages, onPageChange, panelClassName, hasCover = false }) {
    const [page, setPage] = useState(0);
    const total = Math.max(pages.length, 1);
    const current = Math.min(page, total - 1);
    const panelRef = useRef(null);
    const rootRef = useRef(null);
    const firstRender = useRef(true);
    const cbRef = useRef(onPageChange);
    cbRef.current = onPageChange;
    useEffect(() => {
        cbRef.current?.({ page: current, total, isLast: current === total - 1 });
        if (firstRender.current) { firstRender.current = false; return; }
        panelRef.current?.querySelectorAll("[data-lesson-scroll]").forEach(section => section.scrollTo?.({ top: 0 }));
        const root = rootRef.current;
        const viewport = root?.closest("[data-radix-scroll-area-viewport]");
        if (root && viewport) {
            const top = root.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - 16;
            if (top < viewport.scrollTop) viewport.scrollTo({ top });
        }
        panelRef.current?.focus({ preventScroll: true });
    }, [current, total]);
    return (<div ref={rootRef} data-testid="lesson-pager">
      <div ref={panelRef} tabIndex={-1} role="region" aria-label={`Lesson page ${current + 1} of ${total}`} data-testid="lesson-reading-panel" className={cn("lesson-reading-panel", hasCover && current === 0 ? "lesson-cover-panel h-[max(68dvh,30rem)]" : "h-[58dvh]", "overflow-hidden bg-card border rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", panelClassName)}>
        {pages[current]}
      </div>
      {total > 1 && (<nav aria-label="Lesson pages" className="mt-3 md:mt-4 flex items-center justify-between gap-2 rounded-2xl border bg-card px-3 py-2 shadow-sm">
          <Button type="button" variant="outline" size="sm" className="h-11 w-11 shrink-0 px-0 md:h-9 md:w-auto md:px-3" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} data-testid="button-prev-page">
            <ChevronLeft className="h-5 w-5 md:hidden" aria-hidden="true"/>
            <span className="hidden md:inline">Previous page</span>
          </Button>
          <p className="whitespace-nowrap text-center text-sm font-medium tabular-nums text-muted-foreground" aria-live="polite" data-testid="text-page-position">
            Page {current + 1} of {total}
          </p>
          <Button type="button" size="sm" className="h-11 w-11 shrink-0 px-0 md:h-9 md:w-auto md:px-3" aria-label="Next page" disabled={current === total - 1} onClick={() => setPage(current + 1)} data-testid="button-next-page">
            <span className="hidden md:inline">Next page</span>
            <ChevronRight className="h-5 w-5 md:hidden" aria-hidden="true"/>
          </Button>
        </nav>)}
    </div>);
}
