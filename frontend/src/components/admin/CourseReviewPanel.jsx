import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useGetCourseReviews, useSaveCourseReview, usePublishReviewedCourse, getGetCourseReviewsQueryKey, } from "../../api/index.js";
import { useConfirmation } from "../../contexts/ConfirmationContext.jsx";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { Textarea } from "../ui/textarea.jsx";
import { Badge } from "../ui/badge.jsx";
import { Checkbox } from "../ui/checkbox.jsx";
import { Skeleton } from "../ui/skeleton.jsx";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.jsx";
import { useToast } from "../../hooks/use-toast.js";
import { errorMessage } from "../../lib/learning.js";
import { countryLabel } from "../../lib/trainingCountry.js";
const STATUS_LABEL = {
    draft: "Draft",
    pending_review: "Pending Review",
    changes_required: "Changes Required",
    approved: "Approved",
    published: "Published",
};
const CHECKS = [
    { key: "lessonsComplete", label: "All lessons are complete and accurate" },
    { key: "objectivesCovered", label: "Learning objectives are fully covered" },
    { key: "assessmentValid", label: "Assessment questions are valid and fair" },
    { key: "countryContentReviewed", label: "Track-specific content and applicable local requirements have been reviewed" },
    { key: "noCriticalIssues", label: "No critical issues remain" },
];
const NO_CHECKS = { lessonsComplete: false, objectivesCovered: false, assessmentValid: false, countryContentReviewed: false, noCriticalIssues: false };
/** Approved/published reviews whose digest no longer matches are treated as Changes Required. */
export function effectiveStatus(r) {
    if ((r.status === "approved" || r.status === "published") && !r.isCurrent)
        return "changes_required";
    return r.status;
}
export async function invalidateCourseData(qc, courseId) {
    await qc.invalidateQueries({
        predicate: (q) => {
            const k = q.queryKey[0];
            return typeof k === "string" && (k.startsWith("/api/courses") || k.startsWith(`/api/admin/courses/${courseId}`));
        },
    });
    await qc.invalidateQueries({ queryKey: getGetCourseReviewsQueryKey(courseId) });
}
const statusTone = (s) => s === "published" ? "bg-primary text-primary-foreground border-none"
    : s === "approved" ? "bg-primary/15 text-primary border-primary/30"
        : s === "changes_required" ? "bg-destructive/10 text-destructive border-destructive/30"
            : s === "pending_review" ? "bg-accent/15 text-foreground border-accent/40"
                : "bg-muted text-muted-foreground";
function CountryReview({ review, courseId }) {
    const c = review.country;
    const { toast } = useToast();
    const qc = useQueryClient();
    const confirm = useConfirmation();
    const stale = Boolean(review.reviewedDigest && !review.isCurrent);
    const base = effectiveStatus(review);
    const isLivePublished = review.status === "published" && review.isCurrent;
    const [status, setStatus] = useState(base === "published" ? "approved" : base);
    const [reviewerName, setReviewerName] = useState(review.reviewerName ?? "");
    const [reviewDate, setReviewDate] = useState(review.reviewDate ? review.reviewDate.slice(0, 10) : "");
    const [contentVersion, setContentVersion] = useState(review.contentVersion ?? "");
    const [comments, setComments] = useState(review.comments ?? "");
    const [criticalIssues, setCriticalIssues] = useState(review.criticalIssues ?? "");
    const [checks, setChecks] = useState(stale ? NO_CHECKS : review.checks);
    const [dirty, setDirty] = useState(stale);
    const touch = (fn) => (v) => { fn(v); setDirty(true); };
    const structural = review.validationIssues;
    const allChecks = CHECKS.every((k) => checks[k.key]);
    const approvalBlockers = useMemo(() => {
        const b = [];
        if (base !== "pending_review" && base !== "approved")
            b.push("Move the review to Pending Review and save before approving.");
        if (!allChecks)
            b.push("All five human confirmations must be ticked.");
        if (!reviewerName.trim())
            b.push("Reviewer name is required.");
        if (!reviewDate)
            b.push("Review date is required.");
        if (!contentVersion.trim())
            b.push("Content version label is required.");
        if (criticalIssues.trim())
            b.push("Critical issues must be resolved and cleared.");
        if (structural.length)
            b.push("Structural validation issues must be fixed.");
        return b;
    }, [base, allChecks, reviewerName, reviewDate, contentVersion, criticalIssues, structural.length]);
    const canApprove = approvalBlockers.length === 0;
    const save = useSaveCourseReview();
    const publish = usePublishReviewedCourse();
    const doSave = async () => {
        if (status === "approved" && !canApprove)
            return;
        if (isLivePublished && !(await confirm({ title: `Withdraw ${countryLabel(c)} publication?`, description: "Saving this review moves it out of Published. Learners will no longer be able to start this training track until it is approved and published again.", confirmLabel: "Save and withdraw", destructive: true })))
            return;
        save.mutate({
            courseId, country: c,
            data: {
                status, reviewerName: reviewerName.trim(), reviewDate: reviewDate || null,
                comments, contentVersion: contentVersion.trim(), checks, criticalIssues, expectedDigest: review.currentDigest,
            },
        }, {
            onSuccess: async () => { toast({ title: `${countryLabel(c)} review saved`, description: STATUS_LABEL[status] }); await invalidateCourseData(qc, courseId); },
            onError: async (err) => { toast({ title: "Review not saved", description: errorMessage(err), variant: "destructive" }); await qc.invalidateQueries({ queryKey: getGetCourseReviewsQueryKey(courseId) }); },
        });
    };
    const canPublish = review.status === "approved" && review.isCurrent && structural.length === 0 && !dirty;
    const doPublish = async () => {
        if (!canPublish)
            return;
        if (!(await confirm({ title: `Publish for ${countryLabel(c)}?`, description: `Learners in ${countryLabel(c)} will be able to enrol in content version "${review.contentVersion}". Any later content change will require a fresh review.`, confirmLabel: "Publish" })))
            return;
        publish.mutate({ courseId, country: c, data: { expectedDigest: review.currentDigest } }, {
            onSuccess: async () => { toast({ title: `Published for ${countryLabel(c)}` }); await invalidateCourseData(qc, courseId); },
            onError: async (err) => { toast({ title: "Not published", description: errorMessage(err), variant: "destructive" }); await qc.invalidateQueries({ queryKey: getGetCourseReviewsQueryKey(courseId) }); },
        });
    };
    return (<section className="rounded-xl border bg-card p-4 space-y-4" data-testid={`panel-review-${c}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif font-bold text-lg">{countryLabel(c)}</h4>
          <p className="text-xs text-muted-foreground">{review.lessonCount} lessons, {review.questionCount} questions</p>
        </div>
        <Badge variant="outline" className={statusTone(base)} data-testid={`status-review-${c}`}>{STATUS_LABEL[base]}</Badge>
      </header>

      {stale && (<Alert className="border-destructive/40 bg-destructive/5" data-testid={`alert-review-stale-${c}`}>
          <AlertTriangle className="h-4 w-4"/>
          <AlertTitle>Content changed since approval</AlertTitle>
          <AlertDescription>The earlier {STATUS_LABEL[review.status].toLowerCase()} review no longer matches the course. Confirmations were reset; review again before approving.</AlertDescription>
        </Alert>)}
      {structural.length > 0 && (<Alert className="border-accent/50 bg-accent/5" data-testid={`alert-review-structural-${c}`}>
          <AlertTriangle className="h-4 w-4"/>
          <AlertTitle>Structural blockers</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-0.5">{structural.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </AlertDescription>
        </Alert>)}
      <p className="text-xs text-muted-foreground">Automated checks only catch structural gaps. A qualified reviewer must still read the content and confirm each item below.</p>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1 text-sm"><span className="font-medium">Reviewer name</span>
          <Input value={reviewerName} maxLength={255} onChange={(e) => touch(setReviewerName)(e.target.value)} data-testid={`input-reviewer-${c}`}/></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Review date</span>
          <Input type="date" value={reviewDate} onChange={(e) => touch(setReviewDate)(e.target.value)} data-testid={`input-review-date-${c}`}/></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Content version</span>
          <Input value={contentVersion} maxLength={100} placeholder="e.g. v1.2 March" onChange={(e) => touch(setContentVersion)(e.target.value)} data-testid={`input-content-version-${c}`}/></label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Human confirmations</legend>
        {CHECKS.map((k) => (<label key={k.key} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={checks[k.key]} onCheckedChange={(v) => touch(setChecks)({ ...checks, [k.key]: v === true })} data-testid={`checkbox-${k.key}-${c}`}/>
            {k.label}
          </label>))}
      </fieldset>

      <label className="block space-y-1 text-sm"><span className="font-medium">Critical issues (must be empty to approve)</span>
        <Textarea value={criticalIssues} maxLength={20000} className="h-16 resize-y" onChange={(e) => touch(setCriticalIssues)(e.target.value)} data-testid={`input-critical-issues-${c}`}/></label>
      <label className="block space-y-1 text-sm"><span className="font-medium">Comments</span>
        <Textarea value={comments} maxLength={20000} className="h-16 resize-y" onChange={(e) => touch(setComments)(e.target.value)} data-testid={`input-review-comments-${c}`}/></label>

      <div className="flex flex-wrap items-end gap-3 pt-1">
        <label className="space-y-1 text-sm"><span className="font-medium">Review status</span>
          <Select value={status} onValueChange={(v) => touch(setStatus)(v)}>
            <SelectTrigger className="w-[200px]" data-testid={`select-review-status-${c}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="changes_required">Changes Required</SelectItem>
              <SelectItem value="approved" disabled={!canApprove}>Approved</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Button onClick={doSave} disabled={save.isPending || (status === "approved" && !canApprove)} data-testid={`button-save-review-${c}`}>
          {save.isPending ? "Saving..." : "Save review"}
        </Button>
        <Button variant="outline" onClick={doPublish} disabled={!canPublish || publish.isPending} className="gap-1.5" data-testid={`button-publish-review-${c}`}>
          {publish.isPending ? "Publishing..." : `Publish for ${countryLabel(c)}`}
        </Button>
      </div>
      {status === "approved" && !canApprove && (<ul className="text-xs text-destructive list-disc pl-5" data-testid={`list-approval-blockers-${c}`}>{approvalBlockers.map((b) => <li key={b}>{b}</li>)}</ul>)}
      {!canApprove && status !== "approved" && (<p className="text-xs text-muted-foreground" data-testid={`text-approval-hint-${c}`}>Approval unavailable: {approvalBlockers[0]}</p>)}
      {review.status === "approved" && review.isCurrent && dirty && <p className="text-xs text-muted-foreground">Save or discard edits before publishing.</p>}
      {isLivePublished && (<p className="flex items-center gap-1.5 text-xs text-primary" data-testid={`text-review-live-${c}`}><CheckCircle2 className="w-3.5 h-3.5"/> Live for {countryLabel(c)} learners (version {review.contentVersion}).</p>)}
    </section>);
}
export function CourseReviewPanel({ courseId }) {
    const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useGetCourseReviews(courseId, {
        query: { queryKey: getGetCourseReviewsQueryKey(courseId), refetchOnMount: "always" },
    });
    if (isLoading)
        return <div className="grid md:grid-cols-2 gap-4" data-testid="status-reviews-loading"><Skeleton className="h-96"/><Skeleton className="h-96"/></div>;
    if (isError || !data) {
        return (<Alert className="border-destructive/40" data-testid="status-reviews-error">
        <AlertTriangle className="h-4 w-4"/>
        <AlertTitle>Could not load reviews</AlertTitle>
        <AlertDescription className="space-y-2"><p>{errorMessage(error)}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5" data-testid="button-retry-reviews">Try again</Button>
        </AlertDescription>
      </Alert>);
    }
    return (<div className="space-y-3" data-testid={`panel-course-reviews-${courseId}`}>
      <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0"/>
        Each country is reviewed and published independently. The legacy global publish flag does not grant country access.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {data.reviews.map((r) => <CountryReview key={`${r.country}-${r.status}-${r.currentDigest}-${dataUpdatedAt}`} review={r} courseId={courseId}/>)}
      </div>
    </div>);
}
