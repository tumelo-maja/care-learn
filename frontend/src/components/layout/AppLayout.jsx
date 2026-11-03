import { Navbar } from "./Navbar";
export function AppLayout({ children }) {
    return (<div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      <footer className="border-t bg-card mt-auto py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Care Learn. Supporting home-based care across Africa.</p>
        </div>
      </footer>
    </div>);
}
