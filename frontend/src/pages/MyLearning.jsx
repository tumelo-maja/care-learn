import { Link } from "wouter";
import { format } from "date-fns";
import { BookOpen, CheckCircle } from "lucide-react";
import { useGetMyEnrolments } from "@workspace/api-client-react";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card.jsx";
import { Progress } from "../components/ui/progress.jsx";
import { RetakeCourseButton, RetakeAssessmentButton } from "../components/RetakeButtons.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
export default function MyLearning() {
    const { data, isLoading, error } = useGetMyEnrolments();
    const enrolments = data?.enrolments || [];
    const inProgress = enrolments.filter(e => !e.completedAt);
    const completed = enrolments.filter(e => !!e.completedAt);
    if (error)
        return <AppLayout><p role="alert" className="p-10 text-center">Your learning could not be loaded. Please reload to try again.</p></AppLayout>;
    return (<AppLayout>
      <div className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">My Learning</h1>
          <p className="text-lg text-muted-foreground">Track your progress and access your courses.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16" data-testid={data ? "my-learning-loaded" : undefined}>
        
        {/* In Progress */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              In Progress
            </h2>
            <Badge variant="secondary" className="text-sm px-3">{inProgress.length} Courses</Badge>
          </div>

          {isLoading ? (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl"/>)}
            </div>) : inProgress.length === 0 ? (<Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No courses in progress</h3>
                <p className="text-muted-foreground mb-6">Start learning to build your care skills.</p>
                <Button asChild><Link href="/courses">Browse Course Library</Link></Button>
              </CardContent>
            </Card>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgress.map(e => (<Card key={e.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="p-5 pb-3 bg-muted/20">
                    <Badge variant="outline" className="w-fit mb-3 bg-background capitalize">{e.courseType}</Badge>
                    <h3 className="font-serif font-semibold text-lg line-clamp-2">{e.courseTitle}</h3>
                  </CardHeader>
                  <CardContent className="p-5 pt-4 flex-1">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{e.progressPercent}%</span>
                    </div>
                    <Progress value={e.progressPercent} className="h-2.5" aria-label={`${e.courseTitle} lesson progress`}/>
                    {e.progressPercent >= 100 && (<Badge variant="secondary" className="mt-3" data-testid={`status-assessment-${e.id}`}>
                        {e.assessmentPassed ? "Assessment passed, ready to complete" : "Assessment pending"}
                      </Badge>)}
                    <p className="text-xs text-muted-foreground mt-4">
                      Enrolled on {format(new Date(e.enrolledAt), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 border-t mt-auto">
                    <Button asChild className="w-full mt-4 group">
                      <Link href={e.progressPercent >= 100 && !e.assessmentPassed ? `/courses/${e.courseId}/assessment` : `/courses/${e.courseId}`} data-testid={`link-course-${e.id}`}>
                        {e.assessmentPassed ? "Complete course" : e.progressPercent >= 100 ? "Take assessment" : e.progressPercent > 0 ? "Continue Learning" : "Start Course"} 
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>))}
            </div>)}
        </section>

        {/* Completed */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              Completed
            </h2>
            <Badge variant="secondary" className="text-sm px-3 bg-accent/10 text-accent-foreground border-accent/20">{completed.length} Courses</Badge>
          </div>

          {!isLoading && completed.length === 0 ? (<p className="text-muted-foreground text-center py-8">You haven't completed any courses yet. Keep going!</p>) : (<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {completed.map(e => (<Card key={e.id} className="hover:border-primary/50 transition-colors h-full group bg-background">
                    <CardContent className="p-5">
                      <CheckCircle className="w-8 h-8 text-green-500 mb-3"/>
                      <Link href={`/courses/${e.courseId}`} className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">{e.courseTitle}</Link>
                      <p className="text-xs text-muted-foreground">
                        Completed on {e.completedAt ? format(new Date(e.completedAt), 'MMM d, yyyy') : 'Unknown'}
                      </p>
                      {e.retaking && (<div className="mt-4 space-y-2" data-testid={`status-completed-retake-${e.courseId}`}>
                          <Badge variant="secondary">Retaking course</Badge>
                          <p className="text-xs text-muted-foreground">Retake progress: {e.progressPercent}%</p>
                          <Progress value={e.progressPercent} aria-label={`${e.courseTitle} retake progress`} className="h-2"/>
                          <p className="text-xs text-muted-foreground">Your original completion and certificate are kept.</p>
                        </div>)}
                      <div className="mt-4 flex flex-col gap-2">
                        {e.retaking ? (<Button asChild variant="outline">
                            <Link href={`/courses/${e.courseId}`}>Continue retake</Link>
                          </Button>) : <RetakeCourseButton courseId={e.courseId}/>}
                        <RetakeAssessmentButton courseId={e.courseId} disabled={e.progressPercent < 100}/>
                      </div>
                    </CardContent>
                  </Card>))}
            </div>)}
        </section>

      </div>
    </AppLayout>);
}
