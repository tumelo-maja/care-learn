import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { Badge } from "../ui/badge.jsx";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card.jsx";
export function CourseCard({ course }) {
    // Format audience string for display
    const audienceLabel = course.targetAudience.replace('_', ' ');
    return (<Link href={`/courses/${course.id}`} className="group h-full block">
      <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {course.thumbnailUrl ? (<img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 text-primary/40">
              <BookOpen className="w-12 h-12 mb-2 opacity-50"/>
            </div>)}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="default" className="bg-primary/90 hover:bg-primary backdrop-blur-sm border-none shadow-sm shadow-black/10">
              <span className="capitalize">{course.courseType}</span>
            </Badge>
          </div>
        </div>
        
        <CardHeader className="p-5 pb-3">
          <h3 className="font-serif font-semibold text-xl line-clamp-2 group-hover:text-primary transition-colors text-foreground">
            {course.title}
          </h3>
        </CardHeader>
        
        <CardContent className="p-5 pt-0 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </CardContent>
        
        <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between text-xs font-medium text-muted-foreground border-t border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-1.5 mt-4">
            <span>{course.estimatedMinutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 capitalize">
            <span>{audienceLabel}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>);
}
