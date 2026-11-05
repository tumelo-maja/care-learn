import { useState } from "react";
import { formatCourseDuration } from "../lib/courseDuration.js";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useGetCourse, useEnrolInCourse, useGetMyEnrolments, getGetCourseQueryKey, getGetMyEnrolmentsQueryKey, useGetCourseAssessment, getGetCourseAssessmentQueryKey, useCompleteCourse } from "../api/index.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { useToast } from "../hooks/use-toast.js";
import { errorMessage, orderModules, refreshLearning, resumeLesson, takeFeedback } from "../lib/learning.js";
import { RetakeCourseButton, RetakeAssessmentButton } from "../components/RetakeButtons.jsx";
import { AssessmentReview } from "../components/AssessmentReview.jsx";
export default function CourseDetail() {
    const { id } = useParams();
    const courseId = parseInt(id || "0", 10);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { isSignedIn: isAuthenticated } = useAuth();
    const [, navigate] = useLocation();
    const login = (returnTo) => navigate(`/sign-in${returnTo ? `?redirect_url=${encodeURIComponent(returnTo)}` : ""}`);
    const qc = useQueryClient();
    const [feedback, setFeedback] = useState(() => (courseId ? takeFeedback(courseId) : null));
    const { data, isLoading, error: courseError } = useGetCourse(courseId, undefined, {
        query: { queryKey: getGetCourseQueryKey(courseId), enabled: !!courseId }
    });
    const { data: enrolmentsData } = useGetMyEnrolments({
        query: { queryKey: getGetMyEnrolmentsQueryKey(), enabled: isAuthenticated }
    });
    const enrolMutation = useEnrolInCourse({
        mutation: {
            onSuccess: async () => {
                await Promise.all([
                    refreshLearning(qc, courseId),
                    qc.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId, undefined), exact: true, refetchType: "all" }),
                ]);
                toast({ title: "Enrolled successfully!", description: "You can now start learning." });
                const firstLesson = data ? resumeLesson(data.course) : null;
                if (firstLesson) {
                    setLocation(`/courses/${courseId}/lessons/${firstLesson.id}`);
                }
            },
            onError: (err) => {
                const paused = err?.status === 403;
                toast({ title: paused ? "Paused for review" : "Could not enrol", description: paused ? "This course is awaiting approval. Please check back later." : errorMessage(err), variant: "destructive" });
                if (paused)
                    qc.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
            }
        }
    });
    const course = data?.course;
    const enrolment = enrolmentsData?.enrolments.find(e => e.courseId === courseId);
    const isEnrolled = !!enrolment;
    const { data: assessment } = useGetCourseAssessment(courseId, {
        query: { queryKey: getGetCourseAssessmentQueryKey(courseId), enabled: !!courseId && isAuthenticated && isEnrolled },
    });
    const completeMutation = useCompleteCourse();
    const handleCompleteCourse = async () => {
        try {
            await completeMutation.mutateAsync({ courseId });
            await refreshLearning(qc, courseId, { certificates: true });
            toast({ title: "Course complete", description: "Your certificate is available." });
            setLocation("/certificates");
        }
        catch (err) {
            toast({ title: "Could not complete course", description: errorMessage(err), variant: "destructive" });
        }
    };
    if (isLoading) {
        return (<AppLayout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-[400px] w-full rounded-2xl mb-8"/>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4"/>
              <Skeleton className="h-4 w-full"/>
              <Skeleton className="h-4 w-full"/>
            </div>
            <Skeleton className="h-[200px] w-full"/>
          </div>
        </div>
      </AppLayout>);
    }
    if (!course && courseError?.status === 403) {
        return (<AppLayout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg" role="alert">
          <h1 className="text-2xl font-bold" data-testid="text-course-paused">Paused for review</h1>
          <p className="mt-3 text-muted-foreground">This course is being checked before it is available. Your existing progress and certificates are kept.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="outline"><Link href="/certificates" data-testid="link-paused-certificates">My certificates</Link></Button>
            <Button asChild><Link href="/courses" data-testid="link-paused-courses">Back to Courses</Link></Button>
          </div>
        </div>
      </AppLayout>);
    }
    if (!course) {
        return (<AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button asChild className="mt-4"><Link href="/courses">Back to Courses</Link></Button>
        </div>
      </AppLayout>);
    }
    const canEnrol = (course.availableCountries ?? []).length > 0;
    const modules = orderModules(course);
    const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const completedIds = new Set(enrolment?.completedLessonIds ?? []);
    const resume = resumeLesson(course, enrolment?.completedLessonIds);
    const allLessonsDone = totalLessons > 0 && modules.every((m) => m.lessons.every((l) => completedIds.has(l.id)));
    const passed = !!(enrolment?.assessmentPassed || assessment?.passed);
    const courseCompleted = !!((enrolment?.completedAt && !enrolment.retaking) || assessment?.completed);
    return (<AppLayout>
      {/* Course Hero */}
      <div className="bg-slate-900 text-slate-50 py-16 lg:py-24 relative overflow-hidden">
        {course.thumbnailUrl && (<div className="absolute inset-0 z-0">
            <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-20 mix-blend-luminosity"/>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40"/>
          </div>)}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="bg-primary text-primary-foreground border-none capitalize">{course.courseType}</Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-700 capitalize">
                {course.targetAudience.replace('_', ' ')}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">{course.title}</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              {course.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300 mb-10">
              <div>{formatCourseDuration(course.estimatedMinutes)}</div>
              <div>{totalLessons} Lessons</div>
              <div>Certificate Included</div>
            </div>

            {isEnrolled ? (<div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 max-w-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">Lessons complete</span>
                  <span className="text-primary font-bold" data-testid="text-progress">{enrolment.progressPercent}%</span>
                </div>
                <div role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={enrolment.progressPercent} className="w-full bg-slate-700 rounded-full h-3 mb-6 overflow-hidden">
                  <div className="bg-primary h-3 rounded-full transition-transform duration-500 origin-left" style={{ transform: `scaleX(${enrolment.progressPercent / 100})` }}/>
                </div>
                {courseCompleted ? (<Button asChild size="lg" className="w-full text-base">
                    <Link href="/certificates" data-testid="link-certificates">View certificate</Link>
                  </Button>) : passed ? (<Button size="lg" className="w-full text-base" onClick={handleCompleteCourse} disabled={completeMutation.isPending} data-testid="button-complete-course">
                    {completeMutation.isPending ? "Issuing certificate…" : "Complete course"}
                  </Button>) : allLessonsDone ? (<Button asChild size="lg" className="w-full text-base">
                    <Link href={`/courses/${course.id}/assessment`} data-testid="link-take-assessment">
                      {assessment?.attemptId ? "Resume assessment" : "Take assessment"}
                    </Link>
                  </Button>) : resume ? (<Button asChild size="lg" className="w-full text-base">
                    <Link href={`/courses/${course.id}/lessons/${resume.id}`} data-testid="link-resume-lesson">
                      {enrolment.progressPercent === 0 ? "Start Learning" : "Continue Learning"}
                    </Link>
                  </Button>) : (<p className="text-sm text-slate-300">Lessons for this course are being prepared.</p>)}
                {(passed || enrolment.completedAt) && (<div className="mt-4 flex flex-wrap gap-3 text-foreground">
                    <RetakeCourseButton courseId={courseId} variant="contrast"/>
                    <RetakeAssessmentButton courseId={courseId} disabled={!allLessonsDone} variant="contrast"/>
                  </div>)}
                {enrolment.retaking && <p className="mt-3 text-sm text-slate-300">Retaking this course. Your previously earned certificate stays valid. {enrolment.completedAt && <Link href="/certificates" className="underline">View certificate</Link>}</p>}
              </div>) : (<div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Button data-testid="button-enrol" size="lg" className="text-base px-8 h-14 rounded-full shadow-lg shadow-primary/20" onClick={() => {
                if (!isAuthenticated) {
                    login(`/courses/${course.id}`);
                    return;
                }
                if (!canEnrol)
                    return;
                enrolMutation.mutate({ courseId, data: {} });
            }} disabled={enrolMutation.isPending || (isAuthenticated && !canEnrol)}>
                {enrolMutation.isPending ? "Enrolling..." : isAuthenticated && !canEnrol ? "Paused for review" : "Enrol Now for Free"}
              </Button>
              {isAuthenticated && !canEnrol && (<p className="text-sm text-slate-300 max-w-xs" data-testid="text-enrol-paused">
                  New enrolment is paused while this course is reviewed.
                </p>)}
              </div>)}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <AssessmentReview key={courseId} feedback={assessment?.feedback} score={assessment?.latestScore} collapsed={courseCompleted || !!enrolment?.completedAt}/>
        {feedback && (<Alert className="mb-10 border-accent/40 bg-accent/5" role="status" data-testid="status-assessment-feedback">
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>Not passed this time: {feedback.score}% ({feedback.correctCount} of {feedback.total})</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>You need 90% to pass. Your lesson progress is kept. Review these topics, then try a fresh set of questions:</p>
              {feedback.reviewTopics.length > 0 && (<ul className="list-disc pl-5">{feedback.reviewTopics.map((t) => <li key={t}>{t}</li>)}</ul>)}
              <div className="flex flex-wrap gap-2 pt-1">
                {resume && (<Button asChild size="sm" variant="outline"><Link href={`/courses/${course.id}/lessons/${modules[0]?.lessons[0]?.id ?? resume.id}`}>Review lessons</Link></Button>)}
                <Button asChild size="sm"><Link href={`/courses/${course.id}/assessment`} data-testid="link-retry-assessment">Retry assessment</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => setFeedback(null)}>Dismiss</Button>
              </div>
            </AlertDescription>
          </Alert>)}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Syllabus */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
              Course Syllabus
            </h2>
            
            <Accordion type="multiple" defaultValue={modules[0] ? [modules[0].id.toString()] : []} className="space-y-4">
              {modules.map((module, mIdx) => (<AccordionItem key={module.id} value={module.id.toString()} className="bg-card border rounded-xl overflow-hidden shadow-sm px-2">
                  <AccordionTrigger className="hover:no-underline px-4 py-5 group">
                    <div className="flex items-center text-left">
                      <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-4 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {mIdx + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                        <p className="text-sm text-muted-foreground font-normal mt-1">{module.lessons.length} lessons</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 border-t bg-muted/30">
                    {module.description && <p className="text-sm text-muted-foreground mb-4 px-2">{module.description}</p>}
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => (<div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            {completedIds.has(lesson.id) ? (<CheckCircle2 className="w-5 h-5 text-primary" aria-label="Completed"/>) : lesson.contentType === 'video' ? (<PlayCircle className="w-5 h-5 text-primary/60"/>) : (<BookOpen className="w-5 h-5 text-primary/60"/>)}
                            <span className="font-medium text-foreground">{lesson.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{lesson.durationMinutes} min</span>
                        </div>))}
                    </div>
                  </AccordionContent>
                </AccordionItem>))}
            </Accordion>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-card rounded-2xl p-6 border shadow-sm sticky top-24">
              <h3 className="font-serif font-bold text-xl mb-4">What you'll learn</h3>
              <ul className="space-y-4 mb-8">
                {[
            "Understand key principles of home care.",
            "Apply best practices in daily scenarios.",
            "Ensure safety and compliance.",
            "Provide compassionate, person-centered care."
        ].map((item, i) => (<li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span>{item}</span>
                  </li>))}
              </ul>
              
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-foreground">Earn a Certificate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete every lesson and pass the final knowledge check (90%) to receive a personalized certificate of completion, suitable for your CPD portfolio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);
}
