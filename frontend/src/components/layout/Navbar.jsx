import { Link, useLocation } from "wouter";
import { useAuth, useUser, useAccount } from "../../contexts/AuthContext.jsx";
import { useUserProfile } from "../../contexts/UserProfileContext.jsx";
import { Button } from "../ui/button.jsx";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "../ui/dropdown-menu.jsx";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../ui/sheet.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.jsx";
import { Badge } from "../ui/badge.jsx";
export function Navbar() {
    const [location] = useLocation();
    const { user } = useUser();
    const { isSignedIn: isAuthenticated } = useAuth();
    const { signOut } = useAccount();
    const [, navigate] = useLocation();
    const login = () => navigate("/sign-in");
    const logout = () => signOut({ redirectUrl: import.meta.env.BASE_URL });
    const { role, isManager, isAdmin } = useUserProfile();
    const navLinks = [
        { href: "/courses", label: "Course Library", show: true },
        { href: "/my-learning", label: "My Learning", show: isAuthenticated },
        { href: "/certificates", label: "Certificates", show: isAuthenticated },
        { href: "/manager", label: "Team Dashboard", show: isManager || isAdmin },
        { href: "/admin", label: "Admin", show: isAdmin },
    ];
    return (<header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 min-h-20 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Care Learn" className="h-10 sm:h-12 w-auto max-w-[180px] object-contain" />
          </Link>

          <nav className="hidden md:flex gap-6">
            {navLinks.filter(l => l.show).map((link) => (<Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith(link.href) ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </Link>))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (<DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" aria-label="Open account menu" className="relative h-10 w-10 rounded-full hover-elevate">
                  <Avatar className="h-10 w-10 border border-border shadow-sm">
                    <AvatarImage src={user?.imageUrl || ""} alt={user?.firstName || "User"}/>
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="capitalize text-xs font-medium">
                      {role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-learning" className="flex w-full items-center">
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>) : (<div className="hidden md:flex items-center gap-2">
              <Button variant="outline" asChild className="rounded-full"><Link href="/sign-up">Register</Link></Button>
              <Button onClick={() => login()} className="font-medium rounded-full px-6 shadow-md shadow-primary/20">
                Log in
              </Button>
            </div>)}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5"/>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Browse courses and open your learning, certificates and available dashboards.
              </SheetDescription>
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" className="flex items-center gap-2">
                  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Care Learn" className="h-12 w-auto max-w-[180px] object-contain" />
                </Link>
                <nav className="flex flex-col gap-2">
                  {navLinks.filter(l => l.show).map((link) => (<Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.startsWith(link.href)
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"}`}>
                      {link.label}
                    </Link>))}
                </nav>
                {!isAuthenticated && (<div className="space-y-2">
                    <Button onClick={() => login()} className="w-full mt-4 rounded-xl">Log in</Button>
                    <Button variant="outline" asChild className="w-full rounded-xl"><Link href="/sign-up">Register as a Careworker</Link></Button>
                  </div>)}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>);
}
