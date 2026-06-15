import type { User } from "../types/User";
import { createContext, useState, useEffect, useContext, useRef } from "react";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    register: (username: string, email: string, password1: string, password2: string, remember?: boolean) => Promise<void>;
    login: (username: string, password: string, remember?: boolean) => Promise<void>;
    logout: () => void;
    fetchUserData: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    if (isMounted.current) setUser(null);
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(`${BASEURL}/api/user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          clearAuthData();
        }
        return;
      }
      const userData = await response.json();
      if (isMounted.current) setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch(`${BASEURL}/api/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        return data.token;
      }
      if (response.status === 401) {
        localStorage.removeItem("refresh_token");
      }
      return null;
    } catch (error) {
      console.error("Refresh failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        await fetchUserData(token);
      } else {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) await fetchUserData(newToken);
        }
      }
      if (isMounted.current) setLoading(false);
    };
    init();
  }, []);

  const login = async (username: string, password: string, remember = false) => {
    const response = await fetch(`${BASEURL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Invalid username or password");
    }
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (remember && data.refresh) localStorage.setItem("refresh_token", data.refresh);
      await fetchUserData(data.token);
    } else {
      throw new Error("Invalid server response");
    }
  };

  const register = async (username: string, email: string, password1: string, password2: string, remember = false) => {
    const response = await fetch(`${BASEURL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password1, password2 }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (remember && data.refresh) localStorage.setItem("refresh_token", data.refresh);
      await fetchUserData(data.token);
    } else {
      throw new Error("Invalid server response");
    }
  };

  const logout = () => {
    clearAuthData();
    fetch(`${BASEURL}/api/logout`, { method: "POST", credentials: "include" }).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};