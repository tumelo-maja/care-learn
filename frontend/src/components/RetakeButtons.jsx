import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useRetakeCourse, useRetakeCourseAssessment, getGetCourseAssessmentQueryKey } from "../api/index.js";
import { Button } from "./ui/button.jsx";
import { useToast } from "../hooks/use-toast.js";
import { errorMessage, refreshLearning } from "../lib/learning.js";
import { useConfirmation } from "../contexts/ConfirmationContext.jsx";
export function RetakeCourseButton({ courseId }) {
    const mutation = useRetakeCourse();
    const qc = useQueryClient();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [busy, setBusy] = useState(false);
    const confirm = useConfirmation();
    async function retake() {
        if (!await confirm({
            title: "Retake this course?",
            description: "Your lesson progress will restart from zero. This course will stay in Completed courses, and your earned certificate and previous assessment results will be kept.",
            confirmLabel: "Retake course",
        }))
            return;
        setBusy(true);
        try {
            await mutation.mutateAsync({ courseId });
            await refreshLearning(qc, courseId);
            navigate(`/courses/${courseId}`);
            toast({ title: "Course restarted", description: "Your certificate is safe. You can work through the lessons again." });
        }
        catch (error) {
            toast({ title: "Could not restart course", description: errorMessage(error), variant: "destructive" });
        }
        finally {
            setBusy(false);
        }
    }
    return <Button variant="outline" onClick={retake} disabled={busy} data-testid="button-retake-course">{busy ? "Restarting…" : "Retake course"}</Button>;
}
export function RetakeAssessmentButton({ courseId, disabled = false }) {
    const mutation = useRetakeCourseAssessment();
    const qc = useQueryClient();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    async function retake() {
        try {
            const state = await mutation.mutateAsync({ courseId });
            qc.setQueryData(getGetCourseAssessmentQueryKey(courseId), state);
            navigate(`/courses/${courseId}/assessment`);
            window.scrollTo({ top: 0 });
        }
        catch (error) {
            toast({ title: "Could not start assessment", description: errorMessage(error), variant: "destructive" });
        }
    }
    return <Button variant="outline" onClick={retake} disabled={disabled || mutation.isPending} data-testid="button-retake-assessment">{mutation.isPending ? "Preparing questions…" : "Retake assessment"}</Button>;
}
