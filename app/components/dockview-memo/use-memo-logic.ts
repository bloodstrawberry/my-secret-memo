import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce } from "es-toolkit";
import { toast } from "@/app/components/toast";
import { showSecurePrompt } from "@/app/components/secure-prompt";
import { DEFAULT_MEMOS, DEFAULT_TITLES, STORAGE_KEYS } from "@/app/constants/default";
import { memoDB } from "../../library/indexDB";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { useAutoLockStore } from "@/app/store/auto-lock-store";
import { useLoadingOverlay } from "@/app/store/loading-overlay-store";
import { EditorSettings, DEFAULT_SETTINGS } from "@/app/context/settings-context";
import { encryptMemosText, decryptMemosText } from "./utils";
import { DockviewReadyEvent } from "dockview";

export function useMemoLogic(apiRef: React.RefObject<DockviewReadyEvent["api"] | null>) {
  const [memos, setMemos] = useState<Record<string, any>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [progressWidth, setProgressWidth] = useState("0%");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const skipPersistRef = useRef(false);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(Date.now());
  const lastInputTimeRef = useRef<number>(0);
  const versionRef = useRef<number>(0);
  const lastSavedVersionRef = useRef<number>(0);
  const STORAGE_KEY = "my-secret-key";

  const isEncryptedRef = useRef(false);
  useEffect(() => {
    isEncryptedRef.current = isEncrypted;
  }, [isEncrypted]);

  // Use a ref to always have access to the latest state in debounced functions
  const stateRef = useRef({ memos, titles, settings, isDarkMode, lastUpdated });
  stateRef.current = { memos, titles, settings, isDarkMode, lastUpdated };

  // Centralized persistence function
  const persistState = useCallback(async (overrides?: {
    memos?: Record<string, any>;
    titles?: Record<string, string>;
    settings?: EditorSettings;
    isDarkMode?: boolean;
    layout?: any;
    silent?: boolean;
  }) => {
    if (!isMounted || skipPersistRef.current) return;

    // Check auto-lock state
    const { autoLockEnabled, sessionKey } = useAutoLockStore.getState();
    const hasAutoLockSession = autoLockEnabled && sessionKey;

    if (isEncryptedRef.current && !hasAutoLockSession) {
      if (versionRef.current === lastSavedVersionRef.current) {
        setSaveStatus("idle");
      }
      return;
    }

    const layout = overrides?.layout ?? apiRef.current?.toJSON();
    if (!layout) return;

    const memosToSave = overrides?.memos ?? stateRef.current.memos;
    const titlesToSave = overrides?.titles ?? stateRef.current.titles;

    const currentState: any = {
      memos: hasAutoLockSession ? encryptMemosText(memosToSave, sessionKey) : memosToSave,
      titles: titlesToSave,
      settings: overrides?.settings ?? stateRef.current.settings,
      theme: (overrides?.isDarkMode ?? stateRef.current.isDarkMode) ? "dark" : "light",
      layout: layout,
      visualToggles: useVisualToggleStore.getState().toolbarVisibility,
      lastUpdated: new Date().toISOString(),
    };

    // Mark encrypted state in persisted data
    if (hasAutoLockSession) {
      currentState.isEncrypted = true;
      currentState.autoLock = true;
    }

    const saveVersion = versionRef.current;

    try {
      const oldData = await memoDB.getItem<any>(STORAGE_KEY);
      if (oldData && oldData.encryptedKey) {
        currentState.encryptedKey = oldData.encryptedKey;
      }

      await memoDB.setItem(STORAGE_KEY, currentState);
      lastSaveTimeRef.current = Date.now();
      lastSavedVersionRef.current = Math.max(lastSavedVersionRef.current, saveVersion);

      if (!overrides?.silent && versionRef.current === lastSavedVersionRef.current) {
        setSaveStatus("success");
        setLastUpdated(currentState.lastUpdated);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus(prev => prev === "success" ? "idle" : prev);
        }, 2000);
      }
    } catch (e) {
      setSaveStatus("idle");
      toast.error("데이터 저장에 실패했습니다.");
      console.error("Save failed", e);
    }
  }, [isMounted, apiRef]);

  const persistStateRef = useRef(persistState);
  persistStateRef.current = persistState;

  const debouncedPersist = useMemo(() =>
    debounce((overrides?: any) => {
      persistStateRef.current(overrides);
    }, 1000)
    , []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);

      if (savedData) {
        // If auto-lock is ON, always force encrypted state on load
        // (the session key is lost on reload so data stays locked)
        const autoLockOn = useAutoLockStore.getState().autoLockEnabled;
        if (savedData.isEncrypted || (autoLockOn && savedData.autoLock)) {
          setIsEncrypted(true);
          isEncryptedRef.current = true;
          setMemos(DEFAULT_MEMOS);
          setTitles(DEFAULT_TITLES);
          stateRef.current = {
            memos: DEFAULT_MEMOS,
            titles: DEFAULT_TITLES,
            settings: savedData.settings || DEFAULT_SETTINGS,
            isDarkMode: savedData.theme === "dark",
            lastUpdated: savedData.lastUpdated
          };
        } else {
          if (savedData.memos) setMemos(savedData.memos);
          if (savedData.titles) setTitles(savedData.titles);
          stateRef.current = {
            memos: savedData.memos || {},
            titles: savedData.titles || {},
            settings: savedData.settings || DEFAULT_SETTINGS,
            isDarkMode: savedData.theme === "dark",
            lastUpdated: savedData.lastUpdated
          };
        }

        if (savedData.settings) setSettings(savedData.settings);
        if (savedData.theme) {
          const dark = savedData.theme === "dark";
          setIsDarkMode(dark);
          if (dark) document.documentElement.classList.add("dark");
        }
        if (savedData.visualToggles) {
          useVisualToggleStore.setState({ toolbarVisibility: savedData.visualToggles });
        }
        if (savedData.lastUpdated) {
          setLastUpdated(savedData.lastUpdated);
        }
      } else {
        const legacyMemos = localStorage.getItem(STORAGE_KEYS.MEMOS);
        const legacyTitles = localStorage.getItem(STORAGE_KEYS.TITLES);
        const legacySettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const legacyTheme = localStorage.getItem(STORAGE_KEYS.THEME);

        const initialMemos = legacyMemos ? JSON.parse(legacyMemos) : DEFAULT_MEMOS;
        const initialTitles = legacyTitles ? JSON.parse(legacyTitles) : DEFAULT_TITLES;
        const initialSettings = legacySettings ? JSON.parse(legacySettings) : DEFAULT_SETTINGS;
        const initialIsDark = legacyTheme === "dark";

        setMemos(initialMemos);
        setTitles(initialTitles);
        setSettings(initialSettings);
        setIsDarkMode(initialIsDark);

        stateRef.current = {
          memos: initialMemos,
          titles: initialTitles,
          settings: initialSettings,
          isDarkMode: initialIsDark,
          lastUpdated: null
        };
      }
      setIsMounted(true);
    };

    loadInitialData();
  }, []);

  // Update Theme DOM
  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode, isMounted]);

  const updateMemo = useCallback((id: string, val: any, immediate = false) => {
    versionRef.current++;
    lastInputTimeRef.current = Date.now();
    setSaveStatus(prev => prev !== "saving" ? "saving" : prev);

    const nextMemos = { ...stateRef.current.memos, [id]: val };
    setMemos(nextMemos);

    const now = Date.now();
    if (immediate || (now - lastSaveTimeRef.current >= 15000)) {
      debouncedPersist.cancel();
      persistState({ memos: nextMemos, silent: !immediate });
    } else {
      debouncedPersist({ memos: nextMemos });
    }
  }, [debouncedPersist, persistState]);

  const updateTitle = useCallback((id: string, title: string) => {
    versionRef.current++;
    lastInputTimeRef.current = Date.now();
    setSaveStatus(prev => prev !== "saving" ? "saving" : prev);

    const nextTitles = { ...stateRef.current.titles, [id]: title };
    setTitles(nextTitles);
    persistState({ titles: nextTitles });
  }, [persistState]);

  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    versionRef.current++;
    lastInputTimeRef.current = Date.now();
    setSaveStatus(prev => prev !== "saving" ? "saving" : prev);

    const nextSettings = { ...stateRef.current.settings, ...newSettings };
    setSettings(nextSettings);
    persistState({ settings: nextSettings });
  }, [persistState]);

  useEffect(() => {
    if (saveStatus === "saving") {
      setProgressWidth("0%");
      const t = setTimeout(() => setProgressWidth("95%"), 50);
      return () => clearTimeout(t);
    } else if (saveStatus === "success") {
      setProgressWidth("100%");
    } else {
      const t = setTimeout(() => {
        if (saveStatus === "idle") setProgressWidth("0%");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  const removeMemo = useCallback((id: string) => {
    const nextMemos = { ...stateRef.current.memos };
    delete nextMemos[id];
    setMemos(nextMemos);

    const nextTitles = { ...stateRef.current.titles };
    delete nextTitles[id];
    setTitles(nextTitles);

    persistState({ titles: nextTitles, memos: nextMemos });
  }, [persistState]);

  const resetData = useCallback(() => {
    toast.confirm("모든 메모 데이터와 설정을 초기화하시겠습니까?", async () => {
      skipPersistRef.current = true;

      // Clear auto-lock store states after confirmation
      const { setSessionKey, setAutoLockEnabled, setKeyError } = useAutoLockStore.getState();
      setSessionKey(null);
      setAutoLockEnabled(false);
      setKeyError(false);

      await memoDB.deleteItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEYS.MEMOS);
      localStorage.removeItem(STORAGE_KEYS.TITLES);
      localStorage.removeItem(STORAGE_KEYS.LAYOUT);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      window.location.reload();
    });
  }, []);

  const addMemo = useCallback((type: "memo" | "todo" = "memo") => {
    if (!apiRef.current) return;
    const id = `${type}-${Date.now()}`;
    const component = type === "memo" ? "editor" : "todoList";
    const title = type === "memo" ? "New Memo" : "New To-Do List";

    apiRef.current.addPanel({
      id: id,
      component: component,
      title: title,
      tabComponent: "default",
    });

    const initialContent = type === "memo"
      ? { type: "doc", content: [{ type: "paragraph" }] }
      : { items: [] };

    setMemos(prev => ({ ...prev, [id]: initialContent }));
    setTitles(prev => ({ ...prev, [id]: title }));
    persistState();
    toast.success(type === "memo" ? "새로운 메모가 생성되었습니다." : "새로운 To-Do List가 생성되었습니다.");
  }, [persistState, apiRef]);

  const downloadData = useCallback(async () => {
    const data = await memoDB.getItem<any>(STORAGE_KEY);
    if (!data) {
      toast.error("저장된 데이터가 없습니다.");
      return;
    }

    // If auto-lock is ON, download the encrypted data as-is
    // (memos stay encrypted in indexedDB; we export that directly)
    const autoLockOn = useAutoLockStore.getState().autoLockEnabled;
    let exportData = data;
    if (autoLockOn && data.isEncrypted) {
      // Already encrypted in DB — export as-is
      exportData = data;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear().toString().slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    a.download = `next-notepad-${dateStr}-${timeStr}${autoLockOn ? "-encrypted" : ""}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(autoLockOn ? "암호화된 데이터를 다운로드했습니다." : "데이터를 성공적으로 다운로드했습니다.");
  }, []);

  const uploadData = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    useLoadingOverlay.getState().show("업로드 중...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        skipPersistRef.current = true;
        await memoDB.setItem(STORAGE_KEY, json);

        if (json.isEncrypted) {
          setIsEncrypted(true);
          isEncryptedRef.current = true;
          setMemos(DEFAULT_MEMOS);
          setTitles(DEFAULT_TITLES);
        } else {
          setIsEncrypted(false);
          isEncryptedRef.current = false;
          if (json.memos) setMemos(json.memos);
          if (json.titles) setTitles(json.titles);
        }
        if (json.settings) setSettings(json.settings);
        if (json.theme) {
          setIsDarkMode(json.theme === "dark");
        }

        if (json.layout && apiRef.current) {
          try {
            apiRef.current.fromJSON(json.layout);
          } catch (e) {
            console.error("Layout restore failed during upload", e);
          }
        }

        toast.success("데이터를 성공적으로 업로드했습니다.");
        setTimeout(() => {
          skipPersistRef.current = false;
          window.location.reload();
        }, 1000);
      } catch (err) {
        skipPersistRef.current = false;
        useLoadingOverlay.getState().hide();
        toast.error("데이터 업로드에 실패했습니다. 올바른 JSON 파일인지 확인해 주세요.");
      }
    };
    reader.readAsText(file);
  }, [apiRef]);

  const toggleEncryption = useCallback(() => {
    const autoLockOn = useAutoLockStore.getState().autoLockEnabled;

    if (!isEncrypted) {
      showSecurePrompt("암호화 key를 입력하세요", async (key) => {
        if (!key) return;
        useLoadingOverlay.getState().show("암호화 중...");
        try {
          let data = await memoDB.getItem<any>(STORAGE_KEY);
          if (!data) {
            data = { memos: stateRef.current.memos, titles: stateRef.current.titles };
          }
          const memosToEncrypt = data.memos || stateRef.current.memos;
          data.memos = encryptMemosText(memosToEncrypt, key);
          data.isEncrypted = true;
          const { default: CryptoJS } = await import("crypto-js");
          data.encryptedKey = CryptoJS.AES.encrypt(key, "my-secret-memo-salt").toString();
          await memoDB.setItem(STORAGE_KEY, data);
          setIsEncrypted(true);
          isEncryptedRef.current = true;
          setMemos(DEFAULT_MEMOS);
          setTitles(DEFAULT_TITLES);
          stateRef.current.memos = DEFAULT_MEMOS;
          stateRef.current.titles = DEFAULT_TITLES;
          toast.success("암호화되었습니다.");
          setTimeout(() => useLoadingOverlay.getState().hide(), 600);
        } catch {
          useLoadingOverlay.getState().hide();
        }
      }, { placeholder: "암호화 키 입력" });
    } else {
      showSecurePrompt("암호화 key를 입력하세요", async (key) => {
        if (!key) return;
        useLoadingOverlay.getState().show("복호화 중...");
        try {
          const data = await memoDB.getItem<any>(STORAGE_KEY);
          if (data && data.isEncrypted && data.memos) {
            let isValid = false;
            if (data.encryptedKey) {
              const { default: CryptoJS } = await import("crypto-js");
              const bytes = CryptoJS.AES.decrypt(data.encryptedKey, "my-secret-memo-salt");
              const decKey = bytes.toString(CryptoJS.enc.Utf8);
              isValid = (decKey === key);
            } else {
              isValid = true;
            }

            if (!isValid) {
              useLoadingOverlay.getState().hide();
              useAutoLockStore.getState().setKeyError(true);
              return;
            }
            useAutoLockStore.getState().setKeyError(false);

            const decryptedMemos = decryptMemosText(data.memos, key);

            if (autoLockOn) {
              // Auto-lock ON: decrypt in memory only, keep encrypted in IndexedDB
              // Store session key so persist logic can re-encrypt on save
              useAutoLockStore.getState().setSessionKey(key);
              setIsEncrypted(false);
              isEncryptedRef.current = false;
              setMemos(decryptedMemos);
              if (data.titles) setTitles(data.titles);
              stateRef.current.memos = decryptedMemos;
              stateRef.current.titles = data.titles || DEFAULT_TITLES;
              toast.success("잠금이 해제되었습니다. (AUTO LOCK 유지)");
            } else {
              // Normal unlock: save decrypted to IndexedDB
              data.memos = decryptedMemos;
              data.isEncrypted = false;
              data.encryptedKey = null;
              await memoDB.setItem(STORAGE_KEY, data);
              setIsEncrypted(false);
              isEncryptedRef.current = false;
              setMemos(decryptedMemos);
              if (data.titles) setTitles(data.titles);
              stateRef.current.memos = decryptedMemos;
              stateRef.current.titles = data.titles || DEFAULT_TITLES;
              toast.success("암호화가 해제되었습니다.");
            }
          } else {
            setIsEncrypted(false);
            isEncryptedRef.current = false;
          }
          setTimeout(() => useLoadingOverlay.getState().hide(), 600);
        } catch {
          useLoadingOverlay.getState().hide();
        }
      }, { placeholder: "복호화 키 입력" });
    }
  }, [isEncrypted]);

  return {
    memos, titles, isDarkMode, setIsDarkMode, isMounted, settings, updateSettings,
    saveStatus, progressWidth, isEncrypted, lastUpdated, persistState, removeMemo, resetData,
    updateMemo, updateTitle, addMemo, downloadData, uploadData, toggleEncryption
  };
}
