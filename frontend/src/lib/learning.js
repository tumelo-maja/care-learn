import { getGetMyEnrolmentsQueryKey, getGetCourseAssessmentQueryKey, getGetMyCertificatesQueryKey, } from "../api/index.js";
/** Copies modules/lessons sorted by orderIndex without mutating cached data. */
export function orderModules(course) {
    return [...course.modules]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((m) => ({ ...m, lessons: [...m.lessons].sort((a, b) => a.orderIndex - b.orderIndex) }));
}
export function orderedLessons(course) {
    return orderModules(course).flatMap((m) => m.lessons);
}
/** First lesson not yet completed; falls back to first lesson; null when there are none. */
export function resumeLesson(course, completedIds = []) {
    const lessons = orderedLessons(course);
    if (lessons.length === 0)
        return null;
    const done = new Set(completedIds);
    return lessons.find((l) => !done.has(l.id)) ?? lessons[0];
}
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
    if (err && typeof err === "object" && "message" in err) {
        const m = err.message;
        if (typeof m === "string" && m.trim())
            return m;
    }
    if (typeof err === "string" && err.trim())
        return err;
    return fallback;
}
/** Awaits an authoritative refetch of enrolments and refreshes assessment state. */
export async function refreshLearning(qc, courseId, opts = {}) {
    await Promise.all([
        qc.invalidateQueries({ queryKey: getGetMyEnrolmentsQueryKey(), refetchType: "all" }),
        qc.invalidateQueries({ queryKey: getGetCourseAssessmentQueryKey(courseId), refetchType: "all" }),
        opts.certificates
            ? qc.invalidateQueries({ queryKey: getGetMyCertificatesQueryKey(), refetchType: "all" })
            : Promise.resolve(),
    ]);
    return qc.getQueryData(getGetMyEnrolmentsQueryKey());
}
const feedbackKey = (courseId) => `care-learn:assessment-feedback:${courseId}`;
export const answersKey = (attemptId) => `care-learn:assessment-answers:${attemptId}`;
export function saveFeedback(courseId, fb) {
    try {
        sessionStorage.setItem(feedbackKey(courseId), JSON.stringify(fb));
    }
    catch { /* storage unavailable */ }
}
/** Reads and clears transient failure feedback. */
export function takeFeedback(courseId) {
    try {
        const raw = sessionStorage.getItem(feedbackKey(courseId));
        if (!raw)
            return null;
        sessionStorage.removeItem(feedbackKey(courseId));
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function loadAnswers(attemptId) {
    try {
        const raw = sessionStorage.getItem(answersKey(attemptId));
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
export function storeAnswers(attemptId, answers) {
    try {
        sessionStorage.setItem(answersKey(attemptId), JSON.stringify(answers));
    }
    catch { /* ignore */ }
}
export function clearAnswers(attemptId) {
    try {
        sessionStorage.removeItem(answersKey(attemptId));
    }
    catch { /* ignore */ }
}
