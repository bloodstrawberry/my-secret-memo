"use client";

import { createContext, useContext } from "react";

export interface EditorSettings {
  lineHeight: string;
  letterSpacing: string;
  fontSize: string;
  fontFamily: string;
  maxWidth: string;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  lineHeight: "1.6",
  letterSpacing: "0px",
  fontSize: "16px",
  fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  maxWidth: "100%",
};

interface SettingsContextType {
  settings: EditorSettings;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => { },
});

export const useSettings = () => useContext(SettingsContext);
