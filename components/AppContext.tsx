"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Locale } from "@/lib/i18n";

interface AppContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations.en;
  user: any;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("hi");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        if (json.user.locale) {
          setLocaleState(json.user.locale as Locale);
        }
      }
    } catch (err) {
      console.error("Failed to load user", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    const savedLocale = localStorage.getItem("hk_locale") as Locale;
    if (savedLocale) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("hk_locale", l);
  };

  const t = translations[locale] || translations.hi;

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t,
        user,
        refreshUser: fetchUser,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
