import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../api/index.js";
import { queryClient } from "../lib/queryClient.js";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = useRef(null);
  useEffect(() => {
    let alive = true;
    function acceptSession(current) {
      if (!alive) return;
      const nextId = current?.user?.id ?? null;
      // Clear the previous account's cache BEFORE rendering signed-in queries.
      // Clearing in a post-render effect cancels the new profile request and
      // can leave the protected-route observer permanently loading.
      if (currentUserId.current !== nextId) queryClient.clear();
      currentUserId.current = nextId;
      setSession(current);
      setLoaded(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => {
      acceptSession(current);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setError(error);
      acceptSession(data.session);
    }).catch(error => { if (alive) { setError(error); setLoaded(true); } });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  const value = useMemo(() => ({
    session, error, isLoaded, isSignedIn: !!session,
    user: session ? {
      id: session.user.id,
      firstName: session.user.user_metadata?.first_name,
      lastName: session.user.user_metadata?.last_name,
      imageUrl: session.user.user_metadata?.avatar_url,
      primaryEmailAddress: { emailAddress: session.user.email },
    } : null,
    async signOut({ redirectUrl = import.meta.env.BASE_URL } = {}) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      window.location.assign(redirectUrl);
    },
  }), [session, isLoaded, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
export const useUser = useAuth;
export const useAccount = useAuth;
export function Show({ when, children }) {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && (when === "signed-in" ? isSignedIn : !isSignedIn) ? children : null;
}
