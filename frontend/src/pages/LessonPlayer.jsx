import { useParams, Link, useLocation } from "wouter";
import { countryLabel } from "../lib/trainingCountry.js";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Menu, PlayCircle } from "lucide-react";
import { LessonContent, LessonVideo } from "../components/lesson/LessonContent.jsx";
import { useGetCourse, useMarkLessonComplete, useGetMyEnrolments, getGetCourseQueryKey, getGetMyEnrolmentsQueryKey, } from "@workspace/api-client-react";
import { Button } from "../components/ui/button.jsx";
import { ScrollArea } from "../components/ui/scroll-area.jsx";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../components/ui/sheet.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { useToast } from "../hooks/use-toast.js";
import { cn } from "../lib/utils.js";
import { errorMessage, orderModules, refreshLearning } from "../lib/learning.js";
import { isHbc001Prototype } from "../lib/lessonPresentation.js";
function ProgressBar({ percent, className }) {
    return (<div className={className}>
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span>Lessons complete</span>
        <span className="text-primary">{percent}%</span>
      </div>
      <div role="progressbar" aria-label="Course lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-transform origin-left" style={{ transform: `scaleX(${percent / 100})` }}/>
      </div>
    </div>);
}
export default function LessonPlayer() {
    const { id, lessonId: lessonIdParam } = useParams();
    const courseId = parseInt(id || "0", 10);
    const currentLessonId = parseInt(lessonIdParam || "0", 10);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const qc = useQueryClient();
    const { data: courseData, isLoading, isError, error, refetch } = useGetCourse(courseId, undefined, {
        query: { queryKey: getGetCourseQueryKey(courseId), enabled: !!courseId },
    });
    const { data: enrolmentsData } = useGetMyEnrolments({ query: { queryKey: getGetMyEnrolmentsQueryKey() } });
    const completeMutation = useMarkLessonComplete();
    if (isLoading) {
        return (<div className="min-h-[100dvh] w-full flex items-center justify-center bg-background" aria-busy="true">
        <Skeleton className="w-16 h-16 rounded-full"/>
      </div>);
    }
    if (isError || !courseData) {
        return (<div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        {error?.status === 403 ? (<>
            <p className="font-semibold" data-testid="text-lesson-paused">This lesson is paused for review.</p>
            <p className="text-sm text-muted-foreground max-w-md">The course content is being checked before it is available for your training track. Your progress and any certificates are kept.</p>
          </>) : (<>
            <p className="font-semibold">Could not load this lesson.</p>
            <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
          </>)}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-retry-lesson">Try again</Button>
          <Button asChild><Link href={`/courses/${courseId}`}>Back to course</Link></Button>
        </div>
      </div>);
    }
    const course = courseData.course;
    const modules = orderModules(course);
    const allLessons = modules.flatMap((m) => m.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
    const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : undefined;
    const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
    const isLast = !!currentLesson && !nextLesson;
    const enrolment = enrolmentsData?.enrolments.find((e) => e.courseId === courseId);
    const completedIds = new Set(enrolment?.completedLessonIds ?? []);
    const isCurrentDone = currentLesson ? completedIds.has(currentLesson.id) : false;
    const handleComplete = async () => {
        if (!currentLesson)
            return;
        try {
            if (!isCurrentDone)
                await completeMutation.mutateAsync({ lessonId: currentLesson.id });
            const fresh = await refreshLearning(qc, courseId);
            const freshEnrolment = fresh?.enrolments.find((e) => e.courseId === courseId);
            const done = new Set(freshEnrolment?.completedLessonIds ?? []);
            if (nextLesson) {
                if (!isCurrentDone)
                    toast({ title: "Lesson complete", description: `${freshEnrolment?.progressPercent ?? 0}% of lessons done.` });
                setLocation(`/courses/${courseId}/lessons/${nextLesson.id}`);
                return;
            }
            const outstanding = allLessons.find((l) => !done.has(l.id));
            if (outstanding) {
                toast({ title: "A few lessons to go", description: `Finish "${outstanding.title}" before the assessment.` });
                setLocation(`/courses/${courseId}/lessons/${outstanding.id}`);
                return;
            }
            setLocation(`/courses/${courseId}/assessment`);
        }
        catch (err) {
            toast({ title: "Could not save progress", description: errorMessage(err), variant: "destructive" });
        }
    };
    const pending = completeMutation.isPending;
    const actionLabel = isLast ? "Take assessment" : isCurrentDone ? "Next lesson" : "Mark as complete";
    const renderContent = () => {
        if (!currentLesson) {
            return (<div className="p-8 bg-card border rounded-2xl">
          <p className="mb-4">This lesson could not be found.</p>
          <Button asChild><Link href={`/courses/${courseId}`}>Back to course</Link></Button>
        </div>);
        }
        const showText = currentLesson.contentType !== "video" || !!currentLesson.content;
        return (<>
        {currentLesson.videoUrl && <LessonVideo key={currentLesson.id} url={currentLesson.videoUrl} title={currentLesson.title}/>}
        {showText && <LessonContent key={`${currentLesson.id}-${enrolment?.country ?? "shared"}`} html={currentLesson.content} className="mb-12" interactive={isHbc001Prototype(course.code, currentLesson.title, currentIndex)}/>}
      </>);
    };
    const SidebarContent = () => (<div className="flex flex-col h-full bg-muted/40 border-r">
      <div className="p-4 md:p-6 border-b bg-background shrink-0">
        <Link href={`/courses/${course.id}`} className="text-sm text-muted-foreground hover:text-primary mb-3 flex items-center transition-colors" data-testid="link-back-course">
          Back to Course
        </Link>
        <h2 className="font-serif font-bold text-xl line-clamp-2">{course.title}</h2>
        {enrolment && <ProgressBar percent={enrolment.progressPercent} className="mt-4"/>}
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-6" aria-label="Course lessons">
          {modules.map((module, mIdx) => (<div key={module.id} className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground px-2">
                Module {mIdx + 1}: {module.title}
              </h3>
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                const isActive = lesson.id === currentLessonId;
                const done = completedIds.has(lesson.id);
                return (<Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`} aria-current={isActive ? "page" : undefined} data-testid={`link-lesson-${lesson.id}`} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors relative", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-background text-muted-foreground hover:text-foreground")}>
                      {done ? (<CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-label="Completed"/>) : lesson.contentType === "video" ? (<PlayCircle className="w-4 h-4 mt-0.5 shrink-0"/>) : (<BookOpen className="w-4 h-4 mt-0.5 shrink-0"/>)}
                      <span className="text-sm flex-1 leading-snug">{lesson.title}</span>
                    </Link>);
            })}
              </div>
            </div>))}
          <Link href={`/courses/${courseId}/assessment`} className="flex items-center gap-3 p-3 rounded-xl text-sm text-muted-foreground hover:bg-background hover:text-foreground" data-testid="link-assessment">
            Final assessment
          </Link>
        </nav>
      </ScrollArea>
    </div>);
    return (<div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <aside className="hidden lg:block w-80 shrink-0 h-full border-r">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="border-b bg-background shrink-0 shadow-sm z-10">
          <div className="h-16 flex items-center justify-between px-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open lesson list" data-testid="button-open-lessons">
                    <Menu className="w-5 h-5"/>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <SheetTitle className="sr-only">Lessons</SheetTitle>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <p className="font-semibold text-lg line-clamp-1">{currentLesson?.title}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" disabled={!prevLesson} aria-label="Previous lesson" data-testid="button-prev-lesson" onClick={() => prevLesson && setLocation(`/courses/${courseId}/lessons/${prevLesson.id}`)}>
                <ChevronLeft className="w-4 h-4 md:hidden"/>
                <span className="hidden md:inline">Previous</span>
              </Button>
              <Button variant="outline" size="sm" disabled={!nextLesson} aria-label="Next lesson (does not mark complete)" data-testid="button-next-lesson" onClick={() => nextLesson && setLocation(`/courses/${courseId}/lessons/${nextLesson.id}`)}>
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="w-4 h-4 md:hidden"/>
              </Button>
            </div>
          </div>
          {enrolment && <ProgressBar percent={enrolment.progressPercent} className="lg:hidden px-4 pb-3"/>}
        </header>

        <ScrollArea className="flex-1 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">
                {currentLesson?.contentType} Lesson
                {currentLesson && <span className="normal-case tracking-normal font-medium">· {currentIndex + 1} of {allLessons.length}</span>}
              </div>
              {countryLabel(enrolment?.country) && (<span className="ml-2 inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground mb-4" data-testid="text-training-country">Training for {countryLabel(enrolment?.country)}</span>)}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{currentLesson?.title}</h1>
              {isCurrentDone && (<p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary" data-testid="status-lesson-complete">
                  <CheckCircle2 className="w-4 h-4"/> Completed
                </p>)}
              {currentLesson && (<p className="mt-3 ml-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-lesson-duration">
                  About {currentLesson.durationMinutes} min
                </p>)}
            </div>

            {renderContent()}

            {currentLesson && (<div className="mt-12 flex flex-col sm:flex-row items-center justify-between p-6 bg-card border rounded-2xl shadow-sm gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{isLast ? "Last lesson" : isCurrentDone ? "Lesson complete" : "Finished this lesson?"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isLast ? "We'll mark it complete, then take you to the final knowledge check." : isCurrentDone ? "Carry on with the next lesson." : "Mark it complete to update your progress."}
                  </p>
                </div>
                <Button size="lg" className="w-full sm:w-auto px-8 rounded-xl" onClick={handleComplete} disabled={pending} data-testid="button-complete-lesson">
                  {pending ? "Saving…" : actionLabel}
                </Button>
              </div>)}
          </div>
        </ScrollArea>
      </main>
    </div>);
}
