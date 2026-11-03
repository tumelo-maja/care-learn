import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useGetMyProfile, getGetMyProfileQueryKey } from "../api/index.js";
const UserProfileContext = createContext({
    role: "learner",
    isManager: false,
    isAdmin: false,
    isLoading: false,
    error: null,
});
export function UserProfileProvider({ children }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { data, isLoading: profileLoading, error } = useGetMyProfile({
        query: {
            queryKey: getGetMyProfileQueryKey(),
            enabled: isLoaded && isSignedIn,
            retry: false,
        },
    });
    const role = (isSignedIn && data?.profile?.role) || "learner";
    return (<UserProfileContext.Provider value={{
            role,
            isManager: role === "manager" || role === "admin",
            isAdmin: role === "admin",
            isLoading: !isLoaded || (!!isSignedIn && profileLoading),
            error,
        }}>
      {children}
    </UserProfileContext.Provider>);
}
export function useUserProfile() {
    return useContext(UserProfileContext);
}
