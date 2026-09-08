import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "xplaya:show-xp-home";

interface PrefsValue {
  showXpOnHome: boolean;
  setShowXpOnHome: (value: boolean) => void;
}

const PrefsContext = createContext<PrefsValue>({
  showXpOnHome: true,
  setShowXpOnHome: () => {},
});

export function PrefsProvider({ children }: { children: ReactNode }) {
  // Default is ON; read the stored value after hydration to avoid mismatches.
  const [showXpOnHome, setShow] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored !== null) setShow(stored === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setShowXpOnHome = useCallback((value: boolean) => {
    setShow(value);
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <PrefsContext.Provider value={{ showXpOnHome, setShowXpOnHome }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  return useContext(PrefsContext);
}
