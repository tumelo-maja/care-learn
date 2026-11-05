import { formatCourseDuration } from "../lib/courseDuration.js";
import { Fragment, useMemo, useState } from "react";
import { useConfirmation } from "../contexts/ConfirmationContext.jsx";
import { Link } from "wouter";
import { Edit, Trash2, ChevronDown, ChevronRight, BookOpen, FileText, Video } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, useGetCourse, useCreateModule, useUpdateModule, useDeleteModule, useCreateLesson, useUpdateLesson, getGetCourseQueryKey, useDeleteLesson, } from "../api/index.js";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Textarea } from "../components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form.jsx";
import { Switch } from "../components/ui/switch.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible.jsx";
import { useToast } from "../hooks/use-toast.js";
import { useQueryClient } from "@tanstack/react-query";
import { CourseReviewPanel, invalidateCourseData } from "../components/admin/CourseReviewPanel.jsx";
import { DialogDescription } from "../components/ui/dialog.jsx";
import { countryLabel } from "../lib/trainingCountry.js";
import { LessonCountryOverrides } from "../components/admin/LessonCountryOverrides.jsx";
import { LessonContent } from "../components/lesson/LessonContent.jsx";
import { errorMessage } from "../lib/learning.js";
import { STANDARD_LESSON_TEMPLATE } from "../lib/lessonTemplate.js";
const courseSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    courseType: z.enum(["induction", "refresher", "guide"]),
    targetAudience: z.enum(["care_worker", "family_carer", "manager", "all"]),
    thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    estimatedMinutes: z.coerce.number().min(1, "Must be at least 1 minute"),
    isPublished: z.boolean().default(false),
    code: z.string().trim().max(32, "Code is too long").optional(),
    programme: z.string().trim().max(255).optional(),
    objectivesText: z.string().optional().refine((v) => {
        const n = parseObjectives(v).length;
        return n === 0 || (n >= 3 && n <= 5);
    }, "Enter 3 to 5 objectives, one per line, or leave blank"),
});
function parseObjectives(text) {
    return (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}
const UNGROUPED = "__ungrouped__";
const ALL = "__all__";
const moduleSchema = z.object({
    title: z.string().min(2, "Title is required"),
    description: z.string().optional(),
    orderIndex: z.coerce.number().min(0).default(0),
});
const lessonSchema = z.object({
    title: z.string().min(2, "Title is required"),
    contentType: z.enum(["text", "video", "pdf"]),
    content: z.string().optional(),
    videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    orderIndex: z.coerce.number().min(0).default(0),
    durationMinutes: z.coerce.number().min(1).default(5),
    outline: z.string().max(2000).optional(),
});
const EDIT_PARAMS = { includeCountryOverrides: true };
function CourseDetailPanel({ courseId }) {
    const confirm = useConfirmation();
    const { data, refetch } = useGetCourse(courseId, EDIT_PARAMS, {
        query: { queryKey: getGetCourseQueryKey(courseId, EDIT_PARAMS) },
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [moduleDialog, setModuleDialog] = useState({ mode: "closed" });
    const [lessonDialog, setLessonDialog] = useState({ mode: "closed" });
    const [showPreview, setShowPreview] = useState(false);
    const [collapsedModules, setCollapsedModules] = useState(new Set());
    const createModuleMutation = useCreateModule({
        mutation: {
            onSuccess: () => { toast({ title: "Module created" }); setModuleDialog({ mode: "closed" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to create module", variant: "destructive" }); },
        },
    });
    const updateModuleMutation = useUpdateModule({
        mutation: {
            onSuccess: () => { toast({ title: "Module updated" }); setModuleDialog({ mode: "closed" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to update module", variant: "destructive" }); },
        },
    });
    const deleteModuleMutation = useDeleteModule({
        mutation: {
            onSuccess: () => { toast({ title: "Module deleted" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to delete module", variant: "destructive" }); },
        },
    });
    const createLessonMutation = useCreateLesson({
        mutation: {
            onSuccess: () => { toast({ title: "Lesson created" }); setLessonDialog({ mode: "closed" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to create lesson", variant: "destructive" }); },
        },
    });
    const updateLessonMutation = useUpdateLesson({
        mutation: {
            onSuccess: () => { toast({ title: "Lesson updated" }); setLessonDialog({ mode: "closed" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to update lesson", variant: "destructive" }); },
        },
    });
    const deleteLessonMutation = useDeleteLesson({
        mutation: {
            onSuccess: () => { toast({ title: "Lesson deleted" }); refetch(); queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) }); },
            onError: () => { toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" }); },
        },
    });
    const moduleForm = useForm({
        resolver: zodResolver(moduleSchema),
        defaultValues: { title: "", description: "", orderIndex: 0 },
    });
    const lessonForm = useForm({
        resolver: zodResolver(lessonSchema),
        defaultValues: { title: "", contentType: "text", content: "", videoUrl: "", orderIndex: 0, durationMinutes: 5, outline: "" },
    });
    function openCreateModule(cId) {
        moduleForm.reset({ title: "", description: "", orderIndex: 0 });
        setModuleDialog({ mode: "create", courseId: cId });
    }
    function openEditModule(mod) {
        const defaults = { title: mod.title, description: mod.description ?? "", orderIndex: mod.orderIndex };
        moduleForm.reset(defaults);
        setModuleDialog({ mode: "edit", moduleId: mod.id, courseId: mod.courseId, defaults });
    }
    function openCreateLesson(moduleId, cId) {
        lessonForm.reset({ title: "", contentType: "text", content: "", videoUrl: "", orderIndex: 0, durationMinutes: 5, outline: "" });
        setShowPreview(false);
        setLessonDialog({ mode: "create", moduleId, courseId: cId });
    }
    function openEditLesson(lesson) {
        const defaults = {
            title: lesson.title,
            contentType: lesson.contentType,
            content: lesson.content ?? "",
            videoUrl: lesson.videoUrl ?? "",
            orderIndex: lesson.orderIndex,
            durationMinutes: lesson.durationMinutes,
            outline: lesson.outline ?? "",
        };
        lessonForm.reset(defaults);
        setShowPreview(false);
        setLessonDialog({ mode: "edit", lessonId: lesson.id, moduleId: lesson.moduleId, courseId: lesson.courseId, defaults, overrides: lesson.countryOverrides ?? [] });
    }
    function handleModuleSubmit(values) {
        const body = { title: values.title, description: values.description || null, orderIndex: values.orderIndex };
        if (moduleDialog.mode === "create") {
            createModuleMutation.mutate({ courseId: moduleDialog.courseId, data: body });
        }
        else if (moduleDialog.mode === "edit") {
            updateModuleMutation.mutate({ moduleId: moduleDialog.moduleId, data: body });
        }
    }
    function handleLessonSubmit(values) {
        const body = {
            title: values.title,
            contentType: values.contentType,
            content: values.content || null,
            videoUrl: values.videoUrl || null,
            orderIndex: values.orderIndex,
            durationMinutes: values.durationMinutes,
            outline: values.outline?.trim() || null,
        };
        if (lessonDialog.mode === "create") {
            createLessonMutation.mutate({ moduleId: lessonDialog.moduleId, data: body });
        }
        else if (lessonDialog.mode === "edit") {
            updateLessonMutation.mutate({ lessonId: lessonDialog.lessonId, data: body });
        }
    }
    const course = data?.course;
    if (!course)
        return <div className="p-4 text-sm text-muted-foreground">Loading modules...</div>;
    const sortedModules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const contentTypeIcon = (ct) => {
        if (ct === "video")
            return <Video className="w-3.5 h-3.5"/>;
        if (ct === "pdf")
            return <FileText className="w-3.5 h-3.5"/>;
        return <BookOpen className="w-3.5 h-3.5"/>;
    };
    const objectives = course.learningObjectives ?? [];
    return (<div className="p-4 space-y-3 bg-muted/10 border-t">
      {(course.code || course.programme || objectives.length > 0) && (<div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.code && <Badge variant="outline" className="font-mono">{course.code}</Badge>}
            {course.programme && <span className="text-muted-foreground">{course.programme}</span>}
            {!course.isPublished && <span className="text-muted-foreground">· Draft, {formatCourseDuration(course.estimatedMinutes)} provisional estimate</span>}
          </div>
          <p className="text-sm text-muted-foreground">{course.description}</p>
          {objectives.length > 0 && (<div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Learning objectives</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm" data-testid={`list-objectives-${course.id}`}>
                {objectives.map((o, i) => <li key={i}>{o}</li>)}
              </ol>
            </div>)}
        </div>)}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Modules & Lessons</span>
        <Button size="sm" variant="outline" onClick={() => openCreateModule(courseId)} className="gap-1.5 h-7 text-xs">
          Add Module
        </Button>
      </div>

      {sortedModules.length === 0 ? (<p className="text-sm text-muted-foreground italic">No modules yet. Add a module to get started.</p>) : (sortedModules.map((mod) => {
            const isExpanded = !collapsedModules.has(mod.id);
            const sortedLessons = [...mod.lessons].sort((a, b) => a.orderIndex - b.orderIndex);
            return (<div key={mod.id} className="border rounded-lg bg-card overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={(open) => {
                    setCollapsedModules(prev => {
                        const next = new Set(prev);
                        if (open)
                            next.delete(mod.id);
                        else
                            next.add(mod.id);
                        return next;
                    });
                }}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0"/> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0"/>}
                      <span className="font-medium text-sm truncate">{mod.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{sortedLessons.length} lesson{sortedLessons.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => openEditModule({ ...mod, courseId })}>
                        <Edit className="w-3.5 h-3.5"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={async () => {
                    if (await confirm({ title: "Delete module?", description: `Delete "${mod.title}" and all its lessons? This cannot be undone.`, confirmLabel: "Delete module", destructive: true }))
                        deleteModuleMutation.mutate({ moduleId: mod.id });
                }}>
                        <Trash2 className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 py-3 space-y-2">
                    {sortedLessons.length === 0 ? (<p className="text-xs text-muted-foreground italic">No lessons yet.</p>) : (sortedLessons.map((lesson) => (<div key={lesson.id} className="flex items-start justify-between gap-2 py-1.5 px-3 rounded-lg hover:bg-muted/20 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-muted-foreground shrink-0">{contentTypeIcon(lesson.contentType)}</span>
                              <span className="text-sm truncate">{lesson.title}</span>
                              <Badge variant="secondary" className="text-xs shrink-0 capitalize">{lesson.contentType}</Badge>
                            </div>
                            {lesson.outline && (<p className="mt-1 pl-5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line" data-testid={`text-lesson-outline-${lesson.id}`}>{lesson.outline}</p>)}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => openEditLesson({ ...lesson, moduleId: mod.id, courseId })}>
                              <Edit className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={async () => {
                        if (await confirm({ title: "Delete lesson?", description: `Delete "${lesson.title}"? This cannot be undone.`, confirmLabel: "Delete lesson", destructive: true }))
                            deleteLessonMutation.mutate({ lessonId: lesson.id });
                    }}>
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </div>
                        </div>)))}
                    <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs w-full justify-start text-primary hover:bg-primary/10 hover:text-primary mt-1" onClick={() => openCreateLesson(mod.id, courseId)}>
                      Add Lesson
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>);
        }))}

      <Dialog open={moduleDialog.mode !== "closed"} onOpenChange={(open) => { if (!open)
        setModuleDialog({ mode: "closed" }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{moduleDialog.mode === "edit" ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(handleModuleSubmit)} className="space-y-4 py-2">
              <FormField control={moduleForm.control} name="title" render={({ field }) => (<FormItem>
                  <FormLabel>Module Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Introduction to Care" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={moduleForm.control} name="description" render={({ field }) => (<FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Brief overview..." className="resize-none h-20" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={moduleForm.control} name="orderIndex" render={({ field }) => (<FormItem>
                  <FormLabel>Order (0 = first)</FormLabel>
                  <FormControl><Input type="number" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModuleDialog({ mode: "closed" })}>Cancel</Button>
                <Button type="submit" disabled={createModuleMutation.isPending || updateModuleMutation.isPending}>
                  {(createModuleMutation.isPending || updateModuleMutation.isPending) ? "Saving..." : "Save Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialog.mode !== "closed"} onOpenChange={(open) => { if (!open)
        setLessonDialog({ mode: "closed" }); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lessonDialog.mode === "edit" ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
            {lessonDialog.mode === "edit" && <p className="text-xs text-muted-foreground">Shared content: shown to all learners unless a track-specific version exists.</p>}
          </DialogHeader>
          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(handleLessonSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={lessonForm.control} name="title" render={({ field }) => (<FormItem className="col-span-2">
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl><Input placeholder="e.g. What is Person-Centred Care?" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={lessonForm.control} name="contentType" render={({ field }) => (<FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text / HTML</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={lessonForm.control} name="durationMinutes" render={({ field }) => (<FormItem>
                    <FormLabel>Duration (mins)</FormLabel>
                    <FormControl><Input type="number" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>)}/>
              </div>
              <FormField control={lessonForm.control} name="videoUrl" render={({ field }) => (<FormItem>
                  <FormLabel>Video Embed URL {lessonForm.watch("contentType") === "video" ? "" : "(optional)"}</FormLabel>
                  <FormControl><Input placeholder="https://www.youtube.com/embed/..." data-testid="input-lesson-video" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={lessonForm.control} name="content" render={({ field }) => (<FormItem>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={!!field.value?.trim()} title={field.value?.trim() ? "Clear the content first to insert the template" : undefined} onClick={() => { field.onChange(STANDARD_LESSON_TEMPLATE); setShowPreview(true); }} data-testid="button-insert-template">
                        Insert standard template
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview} data-testid="button-toggle-preview">
                        {showPreview ? "Hide preview" : "Preview"}
                      </Button>
                    </div>
                  </div>
                  <FormControl><Textarea placeholder="<h2>Learning Objectives</h2><p>...</p>" className="resize-y h-40 font-mono text-sm" {...field}/></FormControl>
                  <FormMessage />
                  {showPreview && <LessonContent html={field.value} emptyText="Nothing to preview yet." className="mt-2 max-h-96 overflow-y-auto p-4 md:p-6 text-base"/>}
                </FormItem>)}/>
              <FormField control={lessonForm.control} name="outline" render={({ field }) => (<FormItem>
                  <FormLabel>Brief Outline (admin planning, not lesson content)</FormLabel>
                  <FormControl><Textarea placeholder="Key topics this lesson will cover..." className="resize-none h-20 text-sm" data-testid="input-lesson-outline" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={lessonForm.control} name="orderIndex" render={({ field }) => (<FormItem>
                  <FormLabel>Order (0 = first)</FormLabel>
                  <FormControl><Input type="number" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLessonDialog({ mode: "closed" })}>Cancel</Button>
                <Button type="submit" data-testid="button-save-shared-lesson" disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>
                  {(createLessonMutation.isPending || updateLessonMutation.isPending) ? "Saving..." : "Save Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          {lessonDialog.mode === "edit" && (<LessonCountryOverrides key={lessonDialog.lessonId} lessonId={lessonDialog.lessonId} courseId={lessonDialog.courseId} initialOverrides={lessonDialog.overrides} shared={{
                title: lessonDialog.defaults.title,
                contentType: lessonDialog.defaults.contentType,
                content: lessonDialog.defaults.content || null,
                videoUrl: lessonDialog.defaults.videoUrl || null,
                orderIndex: lessonDialog.defaults.orderIndex,
                durationMinutes: lessonDialog.defaults.durationMinutes,
                outline: lessonDialog.defaults.outline?.trim() || null,
            }}/>)}
        </DialogContent>
      </Dialog>
    </div>);
}
export default function AdminDashboard() {
    const confirm = useConfirmation();
    const [courseDialog, setCourseDialog] = useState({ mode: "closed" });
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const [reviewDialog, setReviewDialog] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useListCourses({ includeUnpublished: true });
    const courseForm = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: { title: "", description: "", courseType: "induction", targetAudience: "all", thumbnailUrl: "", estimatedMinutes: 30, isPublished: false, code: "", programme: "", objectivesText: "" },
    });
    const createMutation = useCreateCourse({
        mutation: {
            onSuccess: () => {
                toast({ title: "Course created" });
                setCourseDialog({ mode: "closed" });
                courseForm.reset();
                refetch();
                queryClient.invalidateQueries({ queryKey: ["listCourses"] });
            },
            onError: () => { toast({ title: "Error", description: "Failed to create course", variant: "destructive" }); },
        },
    });
    const updateMutation = useUpdateCourse({
        mutation: {
            onSuccess: () => {
                toast({ title: "Course updated" });
                setCourseDialog({ mode: "closed" });
                refetch();
                if (courseDialog.mode === "edit")
                    invalidateCourseData(queryClient, courseDialog.courseId);
            },
            onError: (err) => { toast({ title: "Error", description: errorMessage(err, "Failed to update course"), variant: "destructive" }); },
        },
    });
    const deleteMutation = useDeleteCourse({
        mutation: {
            onSuccess: () => { toast({ title: "Course deleted" }); refetch(); queryClient.invalidateQueries({ queryKey: ["listCourses"] }); },
            onError: () => { toast({ title: "Error", description: "Failed to delete course", variant: "destructive" }); },
        },
    });
    function openCreateCourse() {
        courseForm.reset({ title: "", description: "", courseType: "induction", targetAudience: "all", thumbnailUrl: "", estimatedMinutes: 30, isPublished: false, code: "", programme: "", objectivesText: "" });
        setCourseDialog({ mode: "create" });
    }
    function openEditCourse(course) {
        const defaults = {
            title: course.title,
            description: course.description,
            courseType: course.courseType,
            targetAudience: course.targetAudience,
            thumbnailUrl: course.thumbnailUrl ?? "",
            estimatedMinutes: course.estimatedMinutes,
            isPublished: course.isPublished,
            code: course.code ?? "",
            programme: course.programme ?? "",
            objectivesText: (course.learningObjectives ?? []).join("\n"),
        };
        courseForm.reset(defaults);
        setCourseDialog({ mode: "edit", courseId: course.id, code: course.code ?? null, defaults });
    }
    function handleCourseSubmit(values) {
        const body = {
            title: values.title,
            description: values.description,
            courseType: values.courseType,
            targetAudience: values.targetAudience,
            thumbnailUrl: values.thumbnailUrl || null,
            estimatedMinutes: values.estimatedMinutes,
            programme: values.programme?.trim() || null,
            learningObjectives: parseObjectives(values.objectivesText).length ? parseObjectives(values.objectivesText) : null,
        };
        if (courseDialog.mode === "create") {
            // Code is only ever sent on create; edits never include it (immutable).
            // New courses always start as drafts; publication happens only via country review.
            createMutation.mutate({ data: { ...body, isPublished: false, code: values.code?.trim() || null } });
        }
        else if (courseDialog.mode === "edit") {
            // Only send isPublished when globally unpublishing; generic publishing is rejected by the API.
            const unpublish = courseDialog.defaults.isPublished && !values.isPublished;
            updateMutation.mutate({ courseId: courseDialog.courseId, data: unpublish ? { ...body, isPublished: false } : body });
        }
    }
    const isMutating = createMutation.isPending || updateMutation.isPending;
    const [programmeFilter, setProgrammeFilter] = useState(ALL);
    const programmes = useMemo(() => Array.from(new Set((data?.courses ?? []).map((c) => c.programme).filter((p) => !!p))).sort(), [data?.courses]);
    const visibleCourses = useMemo(() => {
        const list = (data?.courses ?? []).filter((c) => programmeFilter === ALL ? true : programmeFilter === UNGROUPED ? !c.programme : c.programme === programmeFilter);
        return [...list].sort((a, b) => {
            const pa = a.programme ?? "\uffff", pb = b.programme ?? "\uffff";
            if (pa !== pb)
                return pa.localeCompare(pb);
            return (a.code ?? "").localeCompare(b.code ?? "") || a.id - b.id;
        });
    }, [data?.courses, programmeFilter]);
    return (<AppLayout>
      <div className="bg-slate-900 py-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
              Admin Console
            </h1>
            <p className="text-slate-400 mt-2">Manage courses, modules, lessons, and system settings.</p>
          </div>
          <Button onClick={openCreateCourse} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            New Course
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm font-medium text-muted-foreground">Programme</span>
          <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
            <SelectTrigger className="w-[280px] bg-card" data-testid="select-programme-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All courses</SelectItem>
              {programmes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              <SelectItem value={UNGROUPED}>No programme</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground" data-testid="text-course-count">{visibleCourses.length} course{visibleCourses.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[90px]">Code</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center py-8">Loading courses...</TableCell></TableRow>) : visibleCourses.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No courses found.</TableCell></TableRow>) : (visibleCourses.map((course) => (<Fragment key={course.id}>
                    <TableRow className="hover:bg-muted/10 cursor-pointer" onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}>
                      <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-course-code-${course.id}`}>{course.code ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expandedCourseId === course.id ? <ChevronDown className="w-4 h-4 text-muted-foreground"/> : <ChevronRight className="w-4 h-4 text-muted-foreground"/>}
                          <div className="min-w-0">
                            <span className="font-medium">{course.title}</span>
                            {course.programme && <p className="text-xs text-muted-foreground">{course.programme}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{course.courseType}</Badge></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground capitalize">{course.targetAudience.replace("_", " ")}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="outline" className={course.isPublished ? "border-primary/40 text-primary" : "text-muted-foreground"} title="Legacy global flag. It does not grant training-track access." data-testid={`status-global-flag-${course.id}`}>
                            Global flag: {course.isPublished ? "on" : "off"}
                          </Badge>
                          <span className="text-xs text-muted-foreground" data-testid={`text-available-countries-${course.id}`}>
                            {(course.availableCountries ?? []).length ? `Published: ${(course.availableCountries ?? []).map((c) => countryLabel(c)).join(", ")}` : "No training track published"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10 hover:text-primary">
                            <Link href={`/admin/courses/${course.id}/preview`} aria-label={`Preview Course: ${course.title}`} title="Preview Course" data-testid={`button-preview-course-${course.id}`}>
                              Preview Course
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setReviewDialog({ courseId: course.id, title: course.title })} data-testid={`button-review-course-${course.id}`}>
                            Review
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => openEditCourse(course)} data-testid={`button-edit-course-${course.id}`}>
                            <Edit className="w-4 h-4"/>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={async () => { if (await confirm({ title: "Delete course?", description: `Delete "${course.title}"? This will remove all modules, lessons, progress data and certificates for this course. This cannot be undone.`, confirmLabel: "Delete course", destructive: true }))
            deleteMutation.mutate({ courseId: course.id }); }}>
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedCourseId === course.id && (<TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <CourseDetailPanel courseId={course.id}/>
                        </TableCell>
                      </TableRow>)}
                  </Fragment>)))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={courseDialog.mode !== "closed"} onOpenChange={(open) => { if (!open)
        setCourseDialog({ mode: "closed" }); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{courseDialog.mode === "edit" ? "Edit Course" : "Create New Course"}</DialogTitle>
          </DialogHeader>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(handleCourseSubmit)} className="space-y-6 py-4">
              <FormField control={courseForm.control} name="title" render={({ field }) => (<FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Infection Control Basics" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={courseForm.control} name="description" render={({ field }) => (<FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Course overview..." className="resize-none h-24" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={courseForm.control} name="courseType" render={({ field }) => (<FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="induction">Induction</SelectItem>
                        <SelectItem value="refresher">Refresher</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={courseForm.control} name="targetAudience" render={({ field }) => (<FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select audience"/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="care_worker">Care Workers</SelectItem>
                        <SelectItem value="family_carer">Family Carers</SelectItem>
                        <SelectItem value="manager">Managers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={courseForm.control} name="thumbnailUrl" render={({ field }) => (<FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={courseForm.control} name="estimatedMinutes" render={({ field }) => (<FormItem>
                    <FormLabel>Duration (Mins)</FormLabel>
                    <FormControl><Input type="number" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {courseDialog.mode === "edit" ? (<div className="space-y-2">
                    <p className="text-sm font-medium">Course Code</p>
                    <p className="h-10 flex items-center px-3 rounded-md border bg-muted/30 font-mono text-sm text-muted-foreground" data-testid="text-course-code-readonly">
                      {courseDialog.code ?? "None"}
                    </p>
                    <p className="text-xs text-muted-foreground">Codes can't be changed after creation.</p>
                  </div>) : (<FormField control={courseForm.control} name="code" render={({ field }) => (<FormItem>
                      <FormLabel>Course Code (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g. HBC017" className="font-mono" data-testid="input-course-code" {...field}/></FormControl>
                      <FormMessage />
                    </FormItem>)}/>)}
                <FormField control={courseForm.control} name="programme" render={({ field }) => (<FormItem>
                    <FormLabel>Programme (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Foundation in Home-Based Care" data-testid="input-course-programme" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>)}/>
              </div>
              <FormField control={courseForm.control} name="objectivesText" render={({ field }) => (<FormItem>
                  <FormLabel>Learning Objectives (Optional, 3 to 5, one per line)</FormLabel>
                  <FormControl><Textarea className="resize-none h-28 text-sm" data-testid="input-course-objectives" {...field}/></FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={courseForm.control} name="isPublished" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Legacy global publish flag</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {courseDialog.mode === "edit" && courseDialog.defaults.isPublished
                ? "You can switch this off to unpublish everywhere. Learner access is granted per training track through Review."
                : "Off. Courses are published per training track via the Review action, never from here."}
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} data-testid="switch-course-published" disabled={!(courseDialog.mode === "edit" && courseDialog.defaults.isPublished)} onCheckedChange={(v) => { if (!v || (courseDialog.mode === "edit" && courseDialog.defaults.isPublished))
            field.onChange(v); }}/>
                  </FormControl>
                </FormItem>)}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCourseDialog({ mode: "closed" })}>Cancel</Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Saving..." : courseDialog.mode === "edit" ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open)
        setReviewDialog(null); }}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto" data-testid="dialog-course-review">
          <DialogHeader>
            <DialogTitle>Country review: {reviewDialog?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Review each training track's current content version against applicable local requirements. Approval and publication are separate administrator actions.
            </DialogDescription>
          </DialogHeader>
          {reviewDialog && <CourseReviewPanel courseId={reviewDialog.courseId}/>}
        </DialogContent>
      </Dialog>
    </AppLayout>);
}
