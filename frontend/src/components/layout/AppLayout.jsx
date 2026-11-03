import { Navbar } from "./Navbar";
export function AppLayout({ children }) {
    return (<div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="app-main flex-1 w-full flex flex-col">
        {children}
      </main>
      <footer className="border-t bg-card mt-auto py-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center text-sm leading-relaxed text-muted-foreground">
          <p>© {new Date().getFullYear()} Care Learn. Supporting home-based care across Africa.</p>
        </div>
      </footer>
    </div>);
}
