import { createContext, useContext, useState, useEffect } from "react";

// Define the Authentication Context type
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook to provide auth context values
export const useAuthProvider = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const cookies = document.cookie.split(";");
      const authStatus = cookies.some((cookie) => cookie.trim().startsWith("deepracer_token="));
      setIsAuthenticated(authStatus);
      console.debug("Auth status checked:", authStatus);
    };

    checkAuthStatus();
  }, []);

  const login = () => {
    // Set the cookie with the token
    console.debug("useAuth: Logging in...");
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove the auth cookie
    console.debug("useAuth: Logging out...");
    document.cookie = "deepracer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};
