import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../lib/utils.js";
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (<ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (<ScrollAreaPrimitive.ScrollAreaScrollbar ref={ref} orientation={orientation} className={cn("care-scrollbar flex touch-none select-none rounded-full bg-muted p-[2px] transition-colors motion-reduce:transition-none", orientation === "vertical" &&
        "h-full w-3", orientation === "horizontal" &&
        "h-3 flex-col", className)} {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="care-scrollbar-thumb relative flex-1 rounded-full bg-primary cursor-grab active:cursor-grabbing"/>
  </ScrollAreaPrimitive.ScrollAreaScrollbar>));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
export { ScrollArea, ScrollBar };
