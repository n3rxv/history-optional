'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type LangContextType = {
  langHi: boolean;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextType>({ langHi: false, toggleLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [langHi, setLangHi] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'hi') setLangHi(true);
  }, []);

  // Screen readers, hyphenation and font fallback go by the page's lang.
  useEffect(() => {
    document.documentElement.lang = langHi ? 'hi' : 'en';
  }, [langHi]);

  const toggleLang = () => {
    setLangHi(prev => {
      const next = !prev;
      localStorage.setItem('lang', next ? 'hi' : 'en');
      return next;
    });
  };

  return (
    <LangContext.Provider value={{ langHi, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
