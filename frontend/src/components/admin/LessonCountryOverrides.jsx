import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateLesson, getGetCourseQueryKey, } from "../../api/index.js";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import { Input } from "../ui/input.jsx";
import { Label } from "../ui/label.jsx";
import { Textarea } from "../ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.jsx";
import { useToast } from "../../hooks/use-toast.js";
import { errorMessage } from "../../lib/learning.js";
import { TRAINING_COUNTRIES } from "../../lib/trainingCountry.js";
import { LessonContent } from "../lesson/LessonContent.jsx";
import { STANDARD_LESSON_TEMPLATE } from "../../lib/lessonTemplate.js";
function toDraft(o, sharedType) {
    return {
        title: o?.title ?? "",
        contentType: (o?.contentType ?? sharedType),
        content: o?.content ?? "",
        videoUrl: o?.videoUrl ?? "",
    };
}
/**
 * Edits per-country overrides for one lesson. Each save sends the FULL override set
 * (the API replaces it atomically), so the other country's saved row is preserved.
 * Only overrides are sent; unsaved edits in the separate shared form are untouched.
 */
export function LessonCountryOverrides({ lessonId, courseId, shared, initialOverrides, }) {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [saved, setSaved] = useState(initialOverrides);
    const [showPreview, setShowPreview] = useState(false);
    const [active, setActive] = useState("ZM");
    const [drafts, setDrafts] = useState(() => ({
        ZM: toDraft(initialOverrides.find((o) => o.country === "ZM"), shared.contentType),
        ZA: toDraft(initialOverrides.find((o) => o.country === "ZA"), shared.contentType),
    }));
    const mutation = useUpdateLesson();
    const hasOverride = (c) => saved.some((o) => o.country === c);
    const draft = drafts[active];
    const setDraft = (patch) => setDrafts((d) => ({ ...d, [active]: { ...d[active], ...patch } }));
    function persist(next, message) {
        mutation.mutate({ lessonId, data: { countryOverrides: next } }, {
            onSuccess: () => {
                setSaved(next);
                qc.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
                toast({ title: message });
            },
            onError: (err) => toast({ title: "Could not save track content", description: errorMessage(err), variant: "destructive" }),
        });
    }
    function save() {
        if (draft.videoUrl.trim() && !/^https?:\/\//i.test(draft.videoUrl.trim())) {
            toast({ title: "Video URL must start with http:// or https://", variant: "destructive" });
            return;
        }
        const row = {
            country: active,
            title: draft.title.trim() || null,
            contentType: draft.contentType,
            content: draft.content || null,
            videoUrl: draft.videoUrl.trim() || null,
        };
        persist([...saved.filter((o) => o.country !== active), row], `${label(active)} version saved`);
    }
    function reset() {
        persist(saved.filter((o) => o.country !== active), `${label(active)} now uses shared content`);
        setDrafts((d) => ({ ...d, [active]: toDraft(undefined, shared.contentType) }));
    }
    return (<section className="rounded-xl border bg-muted/30 p-4 space-y-4" aria-labelledby={`country-${lessonId}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`country-${lessonId}`} className="flex items-center gap-2 text-sm font-semibold">
          Training-track versions
        </h3>
        <div className="inline-flex rounded-lg border bg-background p-0.5" role="tablist">
          {TRAINING_COUNTRIES.map((c) => (<button key={c.code} type="button" role="tab" aria-selected={active === c.code} onClick={() => setActive(c.code)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${active === c.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} data-testid={`tab-country-${c.code}`}>
              {c.label}
            </button>))}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Shared content above is shown to everyone without a track-specific version. {label(active)} learners currently see{" "}
        <Badge variant={hasOverride(active) ? "default" : "secondary"} className="text-[10px] align-middle" data-testid="status-country-scope">
          {hasOverride(active) ? `${label(active)} version` : "Shared content"}
        </Badge>
        . Leave the title blank to inherit the shared title.
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="ov-title" className="text-xs">{label(active)} title (optional)</Label>
          <Input id="ov-title" value={draft.title} placeholder={shared.title} onChange={(e) => setDraft({ title: e.target.value })} data-testid="input-override-title"/>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Content type</Label>
          <Select value={draft.contentType ?? "text"} onValueChange={(v) => setDraft({ contentType: v })}>
            <SelectTrigger data-testid="select-override-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text / HTML</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ov-video" className="text-xs">{label(active)} video embed URL{draft.contentType === "video" ? "" : " (optional)"}</Label>
        <Input id="ov-video" value={draft.videoUrl} placeholder="https://www.youtube.com/embed/..." onChange={(e) => setDraft({ videoUrl: e.target.value })} data-testid="input-override-video"/>
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="ov-content" className="text-xs">{label(active)} content (HTML supported)</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={!!draft.content.trim()} onClick={() => { setDraft({ content: STANDARD_LESSON_TEMPLATE }); setShowPreview(true); }} data-testid="button-insert-override-template">
              Insert standard template
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview} data-testid="button-toggle-override-preview">
              {showPreview ? "Hide preview" : "Preview"}
            </Button>
          </div>
        </div>
        <Textarea id="ov-content" value={draft.content} className="resize-y h-32 font-mono text-sm" onChange={(e) => setDraft({ content: e.target.value })} data-testid="input-override-content"/>
        {showPreview && <LessonContent html={draft.content} emptyText="Nothing to preview yet." className="mt-2 max-h-96 overflow-y-auto p-4 md:p-6 text-base"/>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!hasOverride(active) || mutation.isPending} onClick={reset} data-testid="button-reset-override">
          Reset to shared
        </Button>
        <Button type="button" size="sm" disabled={mutation.isPending} onClick={save} data-testid="button-save-override">
          {mutation.isPending ? "Saving..." : `Save ${label(active)} version`}
        </Button>
      </div>
    </section>);
}
function label(c) {
    return TRAINING_COUNTRIES.find((x) => x.code === c)?.label ?? c;
}
