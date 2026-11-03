import { Link } from "wouter";
import { HeartPulse } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
export default function NotFound() {
    return (<AppLayout>
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 border shadow-sm text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-10 h-10 text-primary opacity-80"/>
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">404</h1>
          <h2 className="text-xl font-semibold mb-2">Page not found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    </AppLayout>);
}
