import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Award, Loader2 } from "lucide-react";
import { useGetCourse, getGetCourseQueryKey, useGetCourseAssessment, getGetCourseAssessmentQueryKey, useStartCourseAssessment, useSubmitCourseAssessment, useCompleteCourse, } from "../api/index.js";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.jsx";
import { useToast } from "../hooks/use-toast.js";
import { QuestionList } from "../components/assessment/QuestionList.jsx";
import { RetakeCourseButton, RetakeAssessmentButton } from "../components/RetakeButtons.jsx";
import { AssessmentReview } from "../components/AssessmentReview.jsx";
import { clearAnswers, errorMessage, loadAnswers, refreshLearning, saveFeedback, storeAnswers, } from "../lib/learning.js";
export default function Assessment() {
    const { id } = useParams();
    const courseId = parseInt(id || "0", 10);
    const [, setLocation] = useLocation();
    const qc = useQueryClient();
    const { toast } = useToast();
    const courseQuery = useGetCourse(courseId, undefined, {
        query: { queryKey: getGetCourseQueryKey(courseId), enabled: !!courseId },
    });
    const courseData = courseQuery.data;
    const stateQuery = useGetCourseAssessment(courseId, {
        query: { queryKey: getGetCourseAssessmentQueryKey(courseId), enabled: !!courseId },
    });
    const state = stateQuery.data;
    const [answers, setAnswers] = useState({});
    const [showMissing, setShowMissing] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const loadedFor = useRef(null);
    const attemptId = state?.attemptId ?? null;
    useEffect(() => {
        if (attemptId && loadedFor.current !== attemptId) {
            loadedFor.current = attemptId;
            setAnswers(loadAnswers(attemptId));
            setShowMissing(false);
            setSubmitError(null);
        }
    }, [attemptId]);
    const start = useStartCourseAssessment({
        mutation: {
            onSuccess: (s) => qc.setQueryData(getGetCourseAssessmentQueryKey(courseId), s),
        },
    });
    const submit = useSubmitCourseAssessment();
    const complete = useCompleteCourse();
    const questions = state?.questions ?? [];
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const missing = questions.filter((q) => !answers[q.id]);
    const choose = (questionId, optionId) => {
        if (!attemptId)
            return;
        const next = { ...answers, [questionId]: optionId };
        setAnswers(next);
        storeAnswers(attemptId, next);
    };
    const handleSubmit = async () => {
        if (!attemptId)
            return;
        if (missing.length > 0) {
            setShowMissing(true);
            document.getElementById(`question-${missing[0].id}`)?.focus();
            return;
        }
        setSubmitError(null);
        try {
            const result = await submit.mutateAsync({
                attemptId,
                data: { answers: questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })) },
            });
            clearAnswers(attemptId);
            if (result.passed) {
                await refreshLearning(qc, courseId);
                toast({ title: "Assessment passed", description: `You scored ${result.score}%. You can now complete the course.` });
                window.scrollTo({ top: 0 });
            }
            else {
                saveFeedback(courseId, {
                    score: result.score,
                    correctCount: result.correctCount,
                    total: result.total,
                    reviewTopics: result.reviewTopics,
                });
                await refreshLearning(qc, courseId);
                setLocation(`/courses/${courseId}`);
            }
        }
        catch (err) {
            setSubmitError(errorMessage(err, "We could not submit your answers. Your choices are saved; please try again."));
        }
    };
    const handleComplete = async () => {
        try {
            await complete.mutateAsync({ courseId });
            await refreshLearning(qc, courseId, { certificates: true });
            toast({ title: "Course complete", description: "Your certificate is available." });
            setLocation("/certificates");
        }
        catch (err) {
            toast({ title: "Could not complete course", description: errorMessage(err), variant: "destructive" });
        }
    };
    const title = courseData?.course.title ?? "Course";
    let body;
    if (courseQuery.error?.status === 403) {
        body = (<Alert data-testid="status-assessment-paused-review">
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Assessment paused for review</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorMessage(courseQuery.error)}</p>
          <p>Your saved progress, assessment records and certificates are retained.</p>
          <Link href="/certificates" className="underline">My certificates</Link>
        </AlertDescription>
      </Alert>);
    }
    else if (stateQuery.isLoading) {
        body = (<div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-2/3"/>
        <Skeleton className="h-40 w-full rounded-2xl"/>
        <Skeleton className="h-40 w-full rounded-2xl"/>
      </div>);
    }
    else if (stateQuery.isError || !state) {
        body = (<Alert variant="destructive" data-testid="status-assessment-error">
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Could not load the assessment</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorMessage(stateQuery.error)}</p>
          <Button variant="outline" size="sm" onClick={() => stateQuery.refetch()} data-testid="button-retry-load">
            Try again
          </Button>
        </AlertDescription>
      </Alert>);
    }
    else if ((state.passed || state.completed) && !attemptId) {
        body = (<div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm text-center" data-testid="status-assessment-passed">
        <Award className="w-12 h-12 text-accent mx-auto mb-4"/>
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">{state.completed ? "Course complete" : "Knowledge check passed"}</h2>
        <p className="text-muted-foreground mb-8">
          {state.latestScore !== null ? `Latest score: ${state.latestScore}%. ` : ""}
          {state.latestPassed === false && "This attempt did not pass; your previous pass is retained. "}
          {state.completed ? "This course is complete and your certificate is available." : state.certificateEarned ? "Finish this course retake. Your previously earned certificate stays valid." : "Complete the course to receive your certificate."}
        </p>
        {state.completed ? (<Button asChild size="lg"><Link href="/certificates" data-testid="link-certificates">View certificates</Link></Button>) : (<Button size="lg" className="w-full sm:w-auto px-10" onClick={handleComplete} disabled={complete.isPending} data-testid="button-complete-course">
            {complete.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Issuing certificate…</> : "Complete course"}
          </Button>)}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <RetakeAssessmentButton courseId={courseId} disabled={!state.eligible}/>
          <RetakeCourseButton courseId={courseId}/>
        </div>
      </div>);
    }
    else if (!state.eligible) {
        body = (<div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm" data-testid="status-assessment-ineligible">
        <h2 className="text-2xl font-serif font-bold mb-2">Finish every lesson first</h2>
        <p className="text-muted-foreground mb-6">The knowledge check opens once all lessons in this course are marked complete.</p>
        <Button asChild><Link href={`/courses/${courseId}`}>Back to course</Link></Button>
      </div>);
    }
    else if (!attemptId || questions.length === 0) {
        body = (<div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">Final knowledge check</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {questions.length || 10} questions drawn from across the course. You need {state.passMark}% to pass. Each attempt uses a fresh set of questions, so take a moment to review if you need to.
        </p>
        {state.latestScore !== null && (<p className="mb-6 text-sm font-medium" data-testid="text-latest-score">Previous score: {state.latestScore}%</p>)}
        {state.topics.length > 0 && (<div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Topics covered</h3>
            <ul className="flex flex-wrap gap-2">
              {state.topics.map((t) => <li key={t}><Badge variant="secondary">{t}</Badge></li>)}
            </ul>
          </div>)}
        {start.isError && (<Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>Could not start</AlertTitle>
            <AlertDescription>{errorMessage(start.error)}</AlertDescription>
          </Alert>)}
        <Button size="lg" className="w-full sm:w-auto px-10" onClick={() => start.mutate({ courseId })} disabled={start.isPending} data-testid="button-start-assessment">
          {start.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Preparing questions…</> : state.latestScore !== null ? "Start a new attempt" : "Start assessment"}
        </Button>
      </div>);
    }
    else {
        body = (<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
        <div className="sticky top-16 z-10 -mx-4 px-4 py-3 mb-6 bg-background/95 backdrop-blur border-b">
          <div className="flex justify-between text-sm font-medium mb-1.5">
            <span>Answered</span>
            <span data-testid="text-answered-count">{answeredCount} of {questions.length}</span>
          </div>
          <div role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-transform origin-left" style={{ transform: `scaleX(${questions.length ? answeredCount / questions.length : 0})` }}/>
          </div>
        </div>

        {state.topics.length > 0 && (<p className="text-sm text-muted-foreground mb-6">Topics: {state.topics.join(", ")}</p>)}

        <QuestionList questions={questions} answers={answers} showMissing={showMissing} onChoose={choose}/>

        <div className="mt-8 space-y-4">
          {showMissing && missing.length > 0 && (<Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Answer every question</AlertTitle>
              <AlertDescription>{missing.length} question{missing.length === 1 ? "" : "s"} still need an answer.</AlertDescription>
            </Alert>)}
          {submitError && (<Alert variant="destructive" role="alert" data-testid="status-submit-error">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Submission failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>)}
          <Button type="submit" size="lg" className="w-full sm:w-auto px-10" disabled={submit.isPending} data-testid="button-submit-assessment">
            {submit.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Marking your answers…</> : "Submit answers"}
          </Button>
        </div>
      </form>);
    }
    return (<AppLayout>
      <div className="bg-primary/5 border-b py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mb-3" data-testid="link-back-course">
            Back to course
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
            Assessment
          </h1>
          <p className="text-muted-foreground mt-2">{title}</p>
          {state?.certificateEarned && <p className="text-sm text-muted-foreground mt-2">Your earned certificate remains valid, regardless of this assessment's result.</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-3xl py-8 md:py-12">
        {body}
        {!attemptId && <AssessmentReview feedback={state?.feedback} score={state?.latestScore}/>}
      </div>
    </AppLayout>);
}
