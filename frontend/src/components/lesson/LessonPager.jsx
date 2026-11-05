import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button.jsx";
import { cn } from "../../lib/utils.js";
/**
 * Shows one page at a time. Sections scroll inside a fixed-height reading panel;
 * controls sit outside it so they stay reachable. Reports page position upward.
 */
export function LessonPager({ pages, onPageChange, panelClassName }) {
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
      <div ref={panelRef} tabIndex={-1} role="region" aria-label={`Lesson page ${current + 1} of ${total}`} data-testid="lesson-reading-panel" className={cn("h-[58dvh] overflow-hidden bg-card border rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", panelClassName)}>
        {pages[current]}
      </div>
      {total > 1 && (<nav aria-label="Lesson pages" className="mt-4 flex items-center justify-between gap-3 rounded-2xl border bg-card px-3 py-2 shadow-sm">
          <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)} data-testid="button-prev-page">
            Previous page
          </Button>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite" data-testid="text-page-position">
            Page {current + 1} of {total}
          </p>
          <Button type="button" size="sm" disabled={current === total - 1} onClick={() => setPage(current + 1)} data-testid="button-next-page">
            Next page
          </Button>
        </nav>)}
    </div>);
}
