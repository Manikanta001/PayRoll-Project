import React, { createContext, useEffect, useMemo, useState, useContext } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!cancelled) setUser(me);
      } finally {
        if (!cancelled) setIsLoadingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateToLogin = () => {
  };

  const signInWithEmail = async (email) => {
    return null;
  };

  const signInWithEmailPassword = async (email, password) => {
    setIsAuthenticating(true);
    try {
      const loggedInUser = await base44.auth.loginWithEmailPassword(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const registerWithEmailPassword = async (full_name, email, password, role = "employee") => {
    setIsAuthenticating(true);
    try {
      const newUser = await base44.auth.registerWithEmailPassword(full_name, email, password, role);
      setUser(newUser);
      return newUser;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    base44.auth.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      navigateToLogin,
      isAuthenticating,
      signInWithEmail,
      signInWithEmailPassword,
      registerWithEmailPassword,
      logout,
    }),
    [user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};