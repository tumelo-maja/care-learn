/** Course lesson position, independent of the reading-page counter. */
export function LessonPosition({ index, total }) {
    return Number.isInteger(index) && index >= 0 && index < total
        ? `Lesson ${index + 1} of ${total}`
        : "Lesson";
}

/** Keep the phone navigation bar compact; the full title remains in the lesson. */
export function LessonHeaderTitle({ title, index, total }) {
    return (<>
      <span className="whitespace-nowrap md:hidden" aria-live="polite" aria-atomic="true" data-testid="text-mobile-lesson-position">
        <LessonPosition index={index} total={total}/>
      </span>
      <span className="hidden md:inline">{title}</span>
    </>);
}
