
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Settings {
  logoUrl: string;
  platformName: string;
  loginTitle: string;
  loginSubtitle: string;
  loginButtonText: string;
  darkLogoUrl: string;
  lightLogoUrl: string;
}

const defaultSettings: Settings = {
  logoUrl: "",
  platformName: "NETFLIX",
  loginTitle: "Welcome Back",
  loginSubtitle: "Admin Console",
  loginButtonText: "Sign In",
  darkLogoUrl: "",
  lightLogoUrl: "",
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("tripleMindesSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        console.error("Failed to parse settings from localStorage:", e);
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("tripleMindesSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
