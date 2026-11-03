import { useState } from "react";
import { Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "../../api/index.js";
import { queryClient } from "../../lib/queryClient.js";
import { AuthProvider } from "../../contexts/AuthContext.jsx";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { Label } from "../ui/label.jsx";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export function SupabaseProvider({ children }) {
  return <QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider>;
}

function AuthForm({ mode }) {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [needsConfirmation, setConfirmation] = useState(false);
  const signup = mode === "signup";
  const reset = mode === "reset";
  const update = mode === "update";
  const title = signup ? "Create your careworker account" : reset ? "Reset your password" : update ? "Choose a new password" : "Welcome back";
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (needsConfirmation) {
        const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "signup" });
        if (error) throw error;
        navigate("/my-learning"); return;
      }
      if (reset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${basePath}/update-password` });
        if (error) throw error;
        setMessage("If an account exists, a password reset email has been sent.");return;
      }
      if (update) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        navigate("/my-learning");return;
      }
      if (signup) {
        if (!firstName.trim() || !lastName.trim()) throw new Error("Enter your first and last name.");
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() }, emailRedirectTo: `${window.location.origin}${basePath}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) { setConfirmation(true);setMessage("Check your email to confirm your account. Use the confirmation link, or enter the code if your email includes one.");return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const destination = new URLSearchParams(window.location.search).get("redirect_url");
      navigate(destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/my-learning");
    } catch (error) { setError(error.message || "Unable to complete this request."); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
    <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm">
      <Link href="/"><img src={`${basePath}/logo.png`} alt="Care Learn" className="h-12 w-auto max-w-full object-contain mx-auto mb-7" /></Link>
      <h1 className="text-2xl font-serif font-bold text-center mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground text-center mb-7">{signup ? "Free training for careworkers. Register with your email and password." : "Continue your Care Learn training."}</p>
      <form onSubmit={submit} className="space-y-4">
        {signup && !needsConfirmation && <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="first-name">First name</Label><Input id="first-name" autoComplete="given-name" required value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div><Label htmlFor="last-name">Last name</Label><Input id="last-name" autoComplete="family-name" required value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>}
        {!update && <div><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required value={email} disabled={needsConfirmation} onChange={e => setEmail(e.target.value)} /></div>}
        {!reset && !needsConfirmation && <div><Label htmlFor="password">{update ? "New password" : "Password"}</Label><Input id="password" type="password" autoComplete={signup || update ? "new-password" : "current-password"} minLength={signup || update ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} /></div>}
        {needsConfirmation && <div><Label htmlFor="confirmation-code">Confirmation code</Label><Input id="confirmation-code" autoComplete="one-time-code" required value={code} onChange={e => setCode(e.target.value)} /></div>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="text-sm text-teal-800">{message}</p>}
        <Button type="submit" disabled={busy} className="w-full rounded-full">{busy ? "Please wait…" : needsConfirmation ? "Confirm email" : signup ? "Create account" : reset ? "Send reset email" : update ? "Save password" : "Sign in"}</Button>
      </form>
      {!signup && !reset && !update && <Link href="/reset-password" className="mt-4 block text-sm text-primary text-center">Forgot your password?</Link>}
      {!signup && !reset && !update && <p className="mt-3 text-xs text-center text-muted-foreground">Moving from an earlier account? Reset your password using the same email to keep your courses and certificates.</p>}
      <p className="text-sm text-center text-muted-foreground mt-6">{signup ? "Already have an account? " : "New to Care Learn? "}<Link href={signup ? "/sign-in" : "/sign-up"} className="text-primary font-semibold">{signup ? "Sign in" : "Register"}</Link></p>
      <Link href="/" className="block text-center text-sm text-muted-foreground mt-4">Back to home</Link>
    </div>
  </div>;
}
export const SignInPage = () => <AuthForm mode="signin" />;
export const SignUpPage = () => <AuthForm mode="signup" />;
export const ResetPasswordPage = () => <AuthForm mode="reset" />;
export const UpdatePasswordPage = () => <AuthForm mode="update" />;
