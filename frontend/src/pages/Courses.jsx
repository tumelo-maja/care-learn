import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { useListCourses } from "@workspace/api-client-react";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { CourseCard } from "../components/course/CourseCard.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
export default function Courses() {
    const [search, setSearch] = useState("");
    const [courseType, setCourseType] = useState("all");
    const [targetAudience, setTargetAudience] = useState("all");
    const { data, isLoading, isError } = useListCourses({
        courseType: courseType !== "all" ? courseType : undefined,
        targetAudience: targetAudience !== "all" ? targetAudience : undefined,
        search: search || undefined
    });
    return (<AppLayout>
      <div className="bg-primary/5 border-b border-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Course Library</h1>
            <p className="text-lg text-muted-foreground">
              Explore home-based care training for care workers and family carers across Africa.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div className="bg-card p-5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 font-semibold mb-5 pb-3 border-b">
              Filters
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input id="search" placeholder="Search courses..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)}/>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Course Type</Label>
                <Select value={courseType} onValueChange={(v) => setCourseType(v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Types"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="induction">Induction</SelectItem>
                    <SelectItem value="refresher">Refresher</SelectItem>
                    <SelectItem value="guide">Reference Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Everyone"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="care_worker">Care Workers</SelectItem>
                    <SelectItem value="family_carer">Family Carers</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl"/>
                  <Skeleton className="h-6 w-3/4"/>
                  <Skeleton className="h-4 w-full"/>
                  <Skeleton className="h-4 w-1/2"/>
                </div>))}
            </div>) : isError ? (<div className="text-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive">
              <p>Failed to load courses. Please try again.</p>
            </div>) : data?.courses.length === 0 ? (<div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed flex flex-col items-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4"/>
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>) : (<>
              <div className="mb-6 text-sm text-muted-foreground">
                Showing {data?.courses.length} course{data?.courses.length !== 1 ? 's' : ''}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.courses.map((course) => (<CourseCard key={course.id} course={course}/>))}
              </div>
            </>)}
        </div>
      </div>
    </AppLayout>);
}
