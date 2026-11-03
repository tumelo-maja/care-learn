import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "./components/ui/toaster.jsx";
import { TooltipProvider } from "./components/ui/tooltip.jsx";
import { UserProfileProvider, useUserProfile } from "./contexts/UserProfileContext.jsx";
import { useAuth, useAccount, Show } from "./contexts/AuthContext.jsx";
import { SupabaseProvider, SignInPage, SignUpPage, ResetPasswordPage, UpdatePasswordPage } from "./components/auth/SupabaseSetup.jsx";
import { ConfirmationProvider } from "./contexts/ConfirmationContext.jsx";
import Home from "./pages/Home.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import LessonPlayer from "./pages/LessonPlayer.jsx";
import Assessment from "./pages/Assessment.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import Certificates from "./pages/Certificates.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminCoursePreview from "./pages/AdminCoursePreview.jsx";
import VerifyCertificate from "./pages/VerifyCertificate.jsx";
import NotFound from "./pages/not-found.jsx";
function ProtectedRouteLoading() {
    return (<div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status" aria-live="polite">
      Checking your sign-in…
    </div>);
}
function RequireAuth({ children }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { isLoading, error } = useUserProfile();
    if (!isLoaded)
        return <ProtectedRouteLoading />;
    if (!isSignedIn) {
        return <Redirect to="/sign-in"/>;
    }
    if (isLoading)
        return <ProtectedRouteLoading />;
    if (error)
        return <AccessDenied />;
    return <>{children}</>;
}
function AccessDenied() {
    const { signOut } = useAccount();
    return <div role="alert" className="p-10 text-center space-y-4">
    <p>Unable to access this page. Please reload or sign out and try again.</p>
    <button className="underline" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}>Sign out</button>
  </div>;
}
function RequireManager({ children }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { isManager, isLoading, error } = useUserProfile();
    if (!isLoaded)
        return <ProtectedRouteLoading />;
    if (!isSignedIn)
        return <Redirect to="/sign-in"/>;
    if (isLoading)
        return <ProtectedRouteLoading />;
    if (error || !isManager)
        return <AccessDenied />;
    return <>{children}</>;
}
function RequireAdmin({ children }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { isAdmin, isLoading, error } = useUserProfile();
    if (!isLoaded)
        return <ProtectedRouteLoading />;
    if (!isSignedIn)
        return <Redirect to="/sign-in"/>;
    if (isLoading)
        return <ProtectedRouteLoading />;
    if (error || !isAdmin)
        return <AccessDenied />;
    return <>{children}</>;
}
function Router() {
    return (<Switch>
      <Route path="/">{() => <><Show when="signed-in"><Redirect to="/my-learning"/></Show><Show when="signed-out"><Home /></Show></>}</Route>
      <Route path="/sign-in/*?" component={SignInPage}/>
      <Route path="/sign-up/*?" component={SignUpPage}/>
      <Route path="/reset-password" component={ResetPasswordPage}/>
      <Route path="/update-password" component={UpdatePasswordPage}/>
      <Route path="/auth/callback">{() => <RequireAuth><Redirect to="/my-learning"/></RequireAuth>}</Route>
      <Route path="/verify/:code" component={VerifyCertificate}/>
      <Route path="/courses" component={Courses}/>
      <Route path="/courses/:id" component={CourseDetail}/>
      <Route path="/courses/:id/assessment">
        {() => (<RequireAuth>
            <Assessment />
          </RequireAuth>)}
      </Route>
      <Route path="/courses/:id/lessons/:lessonId">
        {() => (<RequireAuth>
            <LessonPlayer />
          </RequireAuth>)}
      </Route>
      <Route path="/my-learning">
        {() => (<RequireAuth>
            <MyLearning />
          </RequireAuth>)}
      </Route>
      <Route path="/certificates">
        {() => (<RequireAuth>
            <Certificates />
          </RequireAuth>)}
      </Route>
      <Route path="/manager">
        {() => (<RequireManager>
            <ManagerDashboard />
          </RequireManager>)}
      </Route>
      <Route path="/admin/courses/:id/preview">
        {() => (<RequireAdmin>
            <AdminCoursePreview />
          </RequireAdmin>)}
      </Route>
      <Route path="/admin">
        {() => (<RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>)}
      </Route>
      <Route component={NotFound}/>
    </Switch>);
}
function App() {
    return (<WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <SupabaseProvider>
      <TooltipProvider>
          <UserProfileProvider>
            <ConfirmationProvider>
              <Router />
            </ConfirmationProvider>
          </UserProfileProvider>
        <Toaster />
      </TooltipProvider>
      </SupabaseProvider>
    </WouterRouter>);
}
export default App;
