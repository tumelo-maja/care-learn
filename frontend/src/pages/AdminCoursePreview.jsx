import { useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { AlertCircle, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FileText, Loader2, Menu, PlayCircle, XCircle } from "lucide-react";
import { useGetAdminCoursePreview, getGetAdminCoursePreviewQueryKey, useStartAdminPreviewAssessment, useSubmitAdminPreviewAssessment, } from "@workspace/api-client-react";
import { LessonContent, LessonVideo } from "../components/lesson/LessonContent.jsx";
import { isHbc001Prototype } from "../lib/lessonPresentation.js";
import { QuestionList } from "../components/assessment/QuestionList.jsx";
import { AssessmentReview } from "../components/AssessmentReview.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { ScrollArea } from "../components/ui/scroll-area.jsx";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../components/ui/sheet.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { cn } from "../lib/utils.js";
import { errorMessage, orderModules } from "../lib/learning.js";
import { TRAINING_COUNTRIES, countryLabel } from "../lib/trainingCountry.js";
/** Persistent banner: preview state lives in React memory only; nothing is saved. */
function PreviewBanner({ country, onCountry, locked }) {
    return (<div role="region" aria-label="Admin preview notice" className="shrink-0 border-b-2 border-amber-500/60 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-950 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-amber-50" data-testid="badge-admin-preview">
          ADMIN PREVIEW
        </span>
        <p className="text-xs sm:text-sm flex-1 min-w-[12rem]">
          Nothing is saved: no enrolment, progress, attempt or certificate. Reloading or leaving this page clears all preview progress, answers and results.
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="preview-country" className="text-xs font-semibold">Training track</label>
          <Select value={country} onValueChange={(v) => onCountry(v)} disabled={locked}>
            <SelectTrigger id="preview-country" className="h-8 w-40 bg-background text-foreground" data-testid="select-preview-country"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRAINING_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {locked && <span className="sr-only" role="status">Country locked while the preview assessment request is in progress.</span>}
          <Button asChild size="sm" variant="outline" className="h-8 bg-background text-foreground">
            <Link href="/admin" data-testid="link-exit-preview">Exit preview</Link>
          </Button>
        </div>
      </div>
    </div>);
}
export default function AdminCoursePreview() {
    const { id } = useParams();
    const courseId = parseInt(id || "0", 10);
    const [country, setCountry] = useState("ZM");
    const [mode, setMode] = useState({ kind: "lesson", lessonId: null });
    const [viewed, setViewed] = useState(new Set());
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showMissing, setShowMissing] = useState(false);
    const [result, setResult] = useState(null);
    const [lastToken, setLastToken] = useState(undefined);
    const [navOpen, setNavOpen] = useState(false);
    // Bumped on every country change; responses from an older context are discarded.
    const contextRef = useRef(0);
    const params = { country };
    const query = useGetAdminCoursePreview(courseId, params, {
        query: { queryKey: getGetAdminCoursePreviewQueryKey(courseId, params), enabled: !!courseId },
    });
    const start = useStartAdminPreviewAssessment();
    const submit = useSubmitAdminPreviewAssessment();
    const resetTemporary = () => {
        setViewed(new Set());
        setAttempt(null);
        setAnswers({});
        setShowMissing(false);
        setResult(null);
        setLastToken(undefined);
        start.reset();
        submit.reset();
    };
    const changeCountry = (c) => {
        if (c === country)
            return;
        if (start.isPending || submit.isPending)
            return;
        contextRef.current += 1;
        resetTemporary();
        setCountry(c);
        setMode({ kind: "lesson", lessonId: null });
    };
    const banner = <PreviewBanner country={country} onCountry={changeCountry} locked={start.isPending || submit.isPending}/>;
    const stale = !!query.data && query.data.country !== country;
    if (!query.isError && (query.isLoading || stale)) {
        return (<div className="flex min-h-[100dvh] flex-col bg-background">
        {banner}
        <div className="flex-1 p-8 space-y-4 max-w-4xl mx-auto w-full" aria-busy="true">
          <Skeleton className="h-8 w-1/3"/><Skeleton className="h-12 w-2/3"/><Skeleton className="h-64 w-full rounded-2xl"/>
        </div>
      </div>);
    }
    if (query.isError || !query.data) {
        return (<div className="flex min-h-[100dvh] flex-col bg-background">
        {banner}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
          <p className="font-semibold">Could not load the course preview.</p>
          <p className="text-sm text-muted-foreground">{errorMessage(query.error)}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => query.refetch()}>Try again</Button>
            <Button asChild><Link href="/admin">Back to admin</Link></Button>
          </div>
        </div>
      </div>);
    }
    const course = query.data.course;
    const modules = orderModules(course);
    const allLessons = modules.flatMap((m) => m.lessons);
    const currentLessonId = mode.kind === "lesson" ? (mode.lessonId ?? allLessons[0]?.id ?? null) : null;
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
    const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : undefined;
    const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
    const percent = allLessons.length ? Math.round((allLessons.filter((l) => viewed.has(l.id)).length / allLessons.length) * 100) : 0;
    const scrollToTop = () => document.getElementById("preview-main")
        ?.closest("[data-radix-scroll-area-viewport]")?.scrollTo({ top: 0 });
    const goLesson = (lessonId) => { setMode({ kind: "lesson", lessonId }); setNavOpen(false); scrollToTop(); };
    const goAssessment = () => { setMode({ kind: "assessment" }); setNavOpen(false); scrollToTop(); };
    const markViewed = () => {
        if (!currentLesson)
            return;
        setViewed((prev) => new Set(prev).add(currentLesson.id));
        if (nextLesson)
            goLesson(nextLesson.id);
        else
            goAssessment();
    };
    const startAttempt = async () => {
        setResult(null);
        setAnswers({});
        setShowMissing(false);
        submit.reset();
        const ctx = contextRef.current;
        try {
            const a = await start.mutateAsync({ courseId, data: { country, ...(lastToken ? { previousToken: lastToken } : {}) } });
            if (ctx !== contextRef.current || a.country !== country)
                return;
            setAttempt(a);
            setLastToken(a.attemptToken);
            scrollToTop();
        }
        catch {
            /* surfaced via start.error */
        }
    };
    const questions = attempt?.questions ?? [];
    const missing = questions.filter((q) => !answers[q.id]);
    const answered = questions.length - missing.length;
    const handleSubmit = async () => {
        if (!attempt)
            return;
        if (missing.length) {
            setShowMissing(true);
            document.getElementById(`preview-question-${missing[0].id}`)?.focus();
            return;
        }
        const ctx = contextRef.current;
        try {
            const r = await submit.mutateAsync({
                courseId,
                data: { attemptToken: attempt.attemptToken, answers: questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })) },
            });
            if (ctx !== contextRef.current)
                return;
            setResult(r);
            setAttempt(null);
            scrollToTop();
        }
        catch {
            /* surfaced via submit.error */
        }
    };
    const sidebar = (<div className="flex flex-col h-full bg-muted/40">
      <div className="p-4 md:p-6 border-b bg-background shrink-0">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary mb-3 flex items-center transition-colors">
          Back to admin
        </Link>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="outline" className="border-amber-600 text-amber-800 dark:text-amber-200">ADMIN PREVIEW</Badge>
          <Badge variant={course.isPublished ? "secondary" : "outline"}>{course.isPublished ? "Published" : "Unpublished"}</Badge>
        </div>
        <h2 className="font-serif font-bold text-xl line-clamp-2">{course.title}</h2>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span>Temporary progress (not saved)</span><span className="text-primary">{percent}%</span>
          </div>
          <div role="progressbar" aria-label="Temporary preview progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-transform origin-left" style={{ transform: `scaleX(${percent / 100})` }}/>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-6" aria-label="Preview course lessons">
          {modules.length === 0 && <p className="text-sm text-muted-foreground px-2">This course has no modules yet.</p>}
          {modules.map((module, mIdx) => (<div key={module.id} className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground px-2">Module {mIdx + 1}: {module.title}</h3>
              <div className="space-y-1">
                {module.lessons.length === 0 && <p className="text-xs text-muted-foreground italic px-2">No lessons.</p>}
                {module.lessons.map((lesson) => {
                const active = lesson.id === currentLessonId;
                const done = viewed.has(lesson.id);
                const Icon = done ? CheckCircle2 : lesson.contentType === "video" ? PlayCircle : lesson.contentType === "pdf" ? FileText : BookOpen;
                return (<button type="button" key={lesson.id} onClick={() => goLesson(lesson.id)} aria-current={active ? "page" : undefined} data-testid={`preview-lesson-${lesson.id}`} className={cn("w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-primary/10 text-primary font-medium" : "hover:bg-background text-muted-foreground hover:text-foreground")}>
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", done && "text-primary")} aria-hidden/>
                      <span className="text-sm flex-1 leading-snug">{lesson.title}{done && <span className="sr-only"> (viewed in preview)</span>}</span>
                    </button>);
            })}
              </div>
            </div>))}
          <button type="button" onClick={goAssessment} aria-current={mode.kind === "assessment" ? "page" : undefined} className={cn("w-full flex items-center gap-3 p-3 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", mode.kind === "assessment" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-background hover:text-foreground")} data-testid="preview-link-assessment">
            Final assessment
          </button>
        </nav>
      </ScrollArea>
    </div>);
    const lessonBody = !currentLesson ? (<div className="p-8 bg-card border rounded-2xl">
      <p className="mb-4">{allLessons.length ? "This lesson could not be found." : "This course has no lessons to preview yet."}</p>
      <Button asChild><Link href="/admin">Back to admin</Link></Button>
    </div>) : (<>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">
          {currentLesson.contentType} Lesson
          <span className="normal-case tracking-normal font-medium">· {currentIndex + 1} of {allLessons.length}</span>
        </div>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground mb-4" data-testid="text-preview-country">
          Previewing for {countryLabel(country)}
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{currentLesson.title}</h1>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          About {currentLesson.durationMinutes} min
        </p>
      </div>
      {currentLesson.videoUrl && <LessonVideo key={`${country}-${currentLesson.id}`} url={currentLesson.videoUrl} title={currentLesson.title}/>}
      {(currentLesson.contentType !== "video" || !!currentLesson.content) && (<LessonContent key={`${country}-${currentLesson.id}-c`} html={currentLesson.content} className="mb-12" interactive={isHbc001Prototype(course.code, currentLesson.title, currentIndex)}/>)}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between p-6 bg-card border border-dashed border-amber-500/60 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="font-semibold text-lg">{nextLesson ? "Preview: finished this lesson?" : "Preview: last lesson"}</h2>
          <p className="text-sm text-muted-foreground">Marks it viewed in this preview only. No learner progress is recorded.</p>
        </div>
        <Button size="lg" className="w-full sm:w-auto px-8 rounded-xl" onClick={markViewed} data-testid="button-preview-complete-lesson">
          {nextLesson ? "Mark viewed and continue" : "Go to assessment preview"}
        </Button>
      </div>
    </>);
    let assessmentBody;
    if (attempt && questions.length) {
        assessmentBody = (<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 mb-6 bg-background/95 backdrop-blur border-b">
          <div className="flex justify-between text-sm font-medium mb-1.5">
            <span>Answered <span className="text-amber-700 dark:text-amber-300">(preview, not saved)</span></span>
            <span>{answered} of {questions.length}</span>
          </div>
          <div role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered} className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-transform origin-left" style={{ transform: `scaleX(${answered / questions.length})` }}/>
          </div>
        </div>
        <QuestionList idPrefix="preview-" questions={questions} answers={answers} showMissing={showMissing} onChoose={(qid, oid) => setAnswers((prev) => ({ ...prev, [qid]: oid }))}/>
        <div className="mt-8 space-y-4">
          {showMissing && missing.length > 0 && (<Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4"/><AlertTitle>Answer every question</AlertTitle>
              <AlertDescription>{missing.length} question{missing.length === 1 ? "" : "s"} still need an answer.</AlertDescription>
            </Alert>)}
          {submit.isError && (<Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4"/><AlertTitle>Preview submission failed</AlertTitle>
              <AlertDescription>{errorMessage(submit.error)} Your answers are still held in this page.</AlertDescription>
            </Alert>)}
          <Button type="submit" size="lg" className="w-full sm:w-auto px-10" disabled={submit.isPending} data-testid="button-preview-submit">
            {submit.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Marking preview…</> : "Submit preview answers"}
          </Button>
        </div>
      </form>);
    }
    else {
        assessmentBody = (<div className="space-y-6">
        {result && (<div className={cn("rounded-2xl border p-6 md:p-8", result.passed ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5")} role="status" data-testid="preview-result">
            <div className="flex items-center gap-3 mb-2">
              {result.passed ? <CheckCircle2 className="w-7 h-7 text-primary" aria-hidden/> : <XCircle className="w-7 h-7 text-destructive" aria-hidden/>}
              <h2 className="text-2xl font-serif font-bold">{result.passed ? "Would pass" : "Would not pass"}: {result.score}%</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.correctCount} of {result.total} correct. Pass mark {lastPassMark(start.data)}%. Preview result only: no attempt, score or certificate was recorded.
            </p>
            {result.reviewTopics.length > 0 && (<div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Topics to review</p>
                <ul className="flex flex-wrap gap-2">{result.reviewTopics.map((t) => <li key={t}><Badge variant="secondary">{t}</Badge></li>)}</ul>
              </div>)}
          </div>)}
        {result && <AssessmentReview feedback={result.feedback} score={result.score}/>}
        <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">{result ? "Retake the preview" : "Final knowledge check preview"}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            When this course's question bank is ready, each preview draws 10 questions for {countryLabel(country)}. Learners need {start.data?.passMark ?? 90}% to pass. Lesson completion is not required in preview{percent < 100 ? ` (temporary progress: ${percent}%)` : ""}.
            {lastToken && " A retake draws a different set of ten questions; individual questions may recur."}
          </p>
          {start.isError && (<Alert variant="destructive" className="mb-6" role="alert">
              <AlertCircle className="h-4 w-4"/><AlertTitle>Could not start the preview assessment</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{errorMessage(start.error)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={startAttempt}>Try again</Button>
                  <Button size="sm" variant="outline" onClick={() => goLesson(allLessons[0]?.id ?? 0)} disabled={!allLessons.length}>Back to lessons</Button>
                </div>
              </AlertDescription>
            </Alert>)}
          <Button size="lg" className="w-full sm:w-auto px-10" onClick={startAttempt} disabled={start.isPending} data-testid="button-preview-start">
            {start.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Preparing questions…</> : result ? "Retake preview" : "Start preview assessment"}
          </Button>
        </div>
      </div>);
    }
    return (<div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden">
      {banner}
      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-80 shrink-0 h-full border-r">{sidebar}</aside>
        <main className="flex-1 flex flex-col h-full min-w-0">
          <header className="border-b bg-background shrink-0 shadow-sm z-10">
            <div className="h-14 flex items-center justify-between px-4 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Sheet open={navOpen} onOpenChange={setNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open lesson list"><Menu className="w-5 h-5"/></Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80">
                    <SheetTitle className="sr-only">Preview lessons</SheetTitle>
                    <SheetDescription className="sr-only">Navigate modules, lessons and the final assessment. Preview progress is temporary and is not saved.</SheetDescription>
                    {sidebar}
                  </SheetContent>
                </Sheet>
                <p className="font-semibold text-base md:text-lg line-clamp-1">
                  <span className="text-amber-700 dark:text-amber-300 text-xs font-bold tracking-widest mr-2">ADMIN PREVIEW</span>
                  {mode.kind === "assessment" ? "Final assessment" : currentLesson?.title}
                </p>
              </div>
              {mode.kind === "lesson" && (<div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" disabled={!prevLesson} aria-label="Previous lesson" onClick={() => prevLesson && goLesson(prevLesson.id)}>
                    <ChevronLeft className="w-4 h-4 md:hidden"/><span className="hidden md:inline">Previous</span>
                  </Button>
                  <Button variant="outline" size="sm" disabled={!nextLesson} aria-label="Next lesson" onClick={() => nextLesson && goLesson(nextLesson.id)}>
                    <span className="hidden md:inline">Next</span><ChevronRight className="w-4 h-4 md:hidden"/>
                  </Button>
                </div>)}
            </div>
          </header>
          <ScrollArea className="flex-1 bg-muted/20">
            <div id="preview-main" className="max-w-4xl mx-auto px-4 py-8 md:py-12">
              {mode.kind === "lesson" ? lessonBody : (<>
                  <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
                      Assessment
                    </h1>
                    <p className="text-muted-foreground mt-2">{course.title} · Previewing for {countryLabel(country)}</p>
                  </div>
                  {assessmentBody}
                </>)}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>);
}
function lastPassMark(a) {
    return a?.passMark ?? 90;
}
