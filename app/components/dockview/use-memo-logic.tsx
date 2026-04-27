import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce } from "es-toolkit";
import { toast } from "@/app/components/toast";
import { showSecurePrompt } from "@/app/components/secure-prompt";
import { DEFAULT_MEMOS, DEFAULT_TITLES, STORAGE_KEYS } from "@/app/constants/default";
import { memoDB } from "../../library/indexDB";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { useAutoLockStore } from "@/app/store/auto-lock-store";
import { useHistoryStore } from "@/app/store/history-store";
import { useLoadingOverlay } from "@/app/store/loading-overlay-store";
import { EditorSettings, DEFAULT_SETTINGS } from "@/app/context/settings-context";
import { encryptMemosText, decryptMemosText } from "./utils";
import { DockviewReadyEvent } from "dockview";

const MAX_HISTORY = 100;

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useMemoLogic(apiRef: React.RefObject<DockviewReadyEvent["api"] | null>) {
  const [memos, setMemos] = useState<Record<string, any>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = isMounted;
  }, [isMounted]);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [progressWidth, setProgressWidth] = useState("0%");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // History: track the last snapshot hash to detect changes
  const lastHistoryHashRef = useRef<string>("");
  const { viewingDate, isReadOnly } = useHistoryStore();

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

  // Security: Auto-exit history mode if app becomes locked
  useEffect(() => {
    const { autoLockEnabled, sessionKey } = useAutoLockStore.getState();
    const { isReadOnly } = useHistoryStore.getState();
    if (autoLockEnabled && !sessionKey && isReadOnly) {
      loadHistoryDate(null);
    }
  }, [isEncrypted]); // Trigger when lock state might have changed

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

    // Don't persist while viewing history
    if (useHistoryStore.getState().isReadOnly) return;

    // Check auto-lock state
    const { autoLockEnabled, sessionKey } = useAutoLockStore.getState();
    const hasAutoLockSession = autoLockEnabled && sessionKey;

    // We can only save if the app is NOT locked.
    // AUTO LOCK is only for locking on initial entry — it should NOT block saves when unlocked.
    // Only block saves if data is actually encrypted and no session key is available.
    const isLocked = isEncryptedRef.current && !sessionKey;

    if (isLocked) {
      if (versionRef.current === lastSavedVersionRef.current) {
        setSaveStatus("idle");
      }
      return;
    }

    const layout = overrides?.layout ?? apiRef.current?.toJSON();
    if (!layout) return;

    const memosToSave = overrides?.memos ?? stateRef.current.memos;
    const titlesToSave = overrides?.titles ?? stateRef.current.titles;

    const visualToggleState = useVisualToggleStore.getState();
    const currentState: any = {
      memos: hasAutoLockSession ? encryptMemosText(memosToSave, sessionKey) : memosToSave,
      titles: titlesToSave,
      settings: overrides?.settings ?? stateRef.current.settings,
      theme: (overrides?.isDarkMode ?? stateRef.current.isDarkMode) ? "dark" : "light",
      layout: layout,
      visualToggles: {
        toolbarVisibility: visualToggleState.toolbarVisibility,
        tabLocks: visualToggleState.tabLocks,
        lockedTabs: visualToggleState.lockedTabs,
      },
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
      
      // Critical safety check: If a lock/unlock/upload process started while we were waiting
      // for the DB read, we MUST abort this save to prevent data corruption or overwriting
      // encrypted data with unencrypted data (or vice versa).
      if (skipPersistRef.current) {
        console.warn("Aborting persistState: skipPersistRef became true during async DB read");
        return;
      }

      if (oldData) {
        if (oldData.keyHash) currentState.keyHash = oldData.keyHash;
        if (oldData.encryptedKey) currentState.encryptedKey = oldData.encryptedKey;
      }

      // Synchronously update the ref to prevent redundant liveQuery updates when we save locally
      stateRef.current.lastUpdated = currentState.lastUpdated;

      await memoDB.setItem(STORAGE_KEY, currentState);
      lastSaveTimeRef.current = Date.now();
      lastSavedVersionRef.current = Math.max(lastSavedVersionRef.current, saveVersion);

      // Save history snapshot for today (only if data actually changed)
      try {
        const todayKey = getTodayKey();
        const snapshotData = JSON.stringify({ memos: memosToSave, titles: titlesToSave });
        const snapshotHash = snapshotData.length + "-" + snapshotData.slice(0, 200);
        if (snapshotHash !== lastHistoryHashRef.current) {
          lastHistoryHashRef.current = snapshotHash;
          const historyEntry = {
            memos: currentState.memos,
            titles: titlesToSave,
            settings: currentState.settings,
            theme: currentState.theme,
            layout: currentState.layout,
            savedAt: currentState.lastUpdated,
            isEncrypted: currentState.isEncrypted || false,
          };
          // Enforce max 100 history entries
          const keys = await memoDB.getAllHistoryKeys();
          if (keys.length >= MAX_HISTORY && !keys.includes(todayKey)) {
            // Delete the oldest entry
            await memoDB.deleteHistoryItem(keys[0]);
          }
          await memoDB.setHistoryItem(todayKey, historyEntry);
        }
      } catch (histErr) {
        console.error("History snapshot failed", histErr);
      }

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

  // Initial load & Cross-tab sync
  useEffect(() => {
    const subscription = memoDB.observeItem<any>(STORAGE_KEY).subscribe({
      next: (savedData) => {
        if (!savedData) {
          if (!isMountedRef.current) {
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
            setIsMounted(true);
          }
          return;
        }

        // If we are ignoring updates (e.g. during encryption/decryption)
        if (skipPersistRef.current) return;

        // Prevent redundant updates triggered by our own saves
        if (isMountedRef.current && savedData.lastUpdated && savedData.lastUpdated === stateRef.current.lastUpdated) {
          return;
        }

        // Apply external changes
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
          if (savedData.visualToggles.toolbarVisibility !== undefined) {
            useVisualToggleStore.setState({ 
              toolbarVisibility: savedData.visualToggles.toolbarVisibility,
              tabLocks: savedData.visualToggles.tabLocks || {},
              lockedTabs: savedData.visualToggles.lockedTabs || {}
            });
          } else {
            // Legacy format
            useVisualToggleStore.setState({ toolbarVisibility: savedData.visualToggles });
          }
        }
        if (savedData.lastUpdated) {
          setLastUpdated(savedData.lastUpdated);
        }

        setIsMounted(true);
      },
      error: (err) => console.error("observeItem error:", err)
    });

    return () => subscription.unsubscribe();
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

  // Prevent accidental reload/close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (skipPersistRef.current || (window as any).__skipBeforeUnload) return;

      // Skip confirmation if the app is locked (edits aren't saved while locked anyway)
      const { autoLockEnabled, sessionKey } = useAutoLockStore.getState();
      const isLocked = isEncryptedRef.current && !sessionKey;
      if (isLocked) return;

      if (versionRef.current !== lastSavedVersionRef.current || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  const updateMemo = useCallback((id: string, val: any, immediate = false) => {
    // Block writes in read-only history mode or during critical transitions (lock/unlock/upload)
    if (useHistoryStore.getState().isReadOnly || skipPersistRef.current) return;
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
    // Block during history mode or critical transitions
    if (useHistoryStore.getState().isReadOnly || skipPersistRef.current) return;
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
    // Block during history mode or critical transitions
    if (useHistoryStore.getState().isReadOnly || skipPersistRef.current) {
      return;
    }
    const nextMemos = { ...stateRef.current.memos };
    delete nextMemos[id];
    setMemos(nextMemos);

    const nextTitles = { ...stateRef.current.titles };
    delete nextTitles[id];
    setTitles(nextTitles);

    persistState({ titles: nextTitles, memos: nextMemos });
  }, [persistState]);

  const resetData = useCallback((type: "options" | "memos" | "todos" | "page" | "all" = "all") => {
    const messages: Record<string, React.ReactNode> = {
      options: "모든 설정을 초기화하시겠습니까?",
      memos: "모든 메모를 초기화하시겠습니까?",
      todos: "모든 To-Do List를 초기화하시겠습니까?",
      page: "현재 페이지의 내용을 초기화하시겠습니까?",
      all: (
        <span>
          <span className="text-red-500 font-bold">모든 데이터의 이력</span>과 설정을 초기화하시겠습니까?
        </span>
      )
    };

    toast.confirm(messages[type], async () => {
      if (type === "options") {
        setSettings(DEFAULT_SETTINGS);
        persistState({ settings: DEFAULT_SETTINGS });
        toast.success("설정이 초기화되었습니다.");
        return;
      }

      if (type === "page") {
        if (!apiRef.current) return;
        const activePanel = apiRef.current.activePanel;
        if (!activePanel) {
          toast.error("초기화할 활성 페이지가 없습니다.");
          return;
        }
        const id = activePanel.id;
        let defaultValue: any = { type: "doc", content: [{ type: "paragraph" }] };

        if (id.startsWith("todo")) {
          defaultValue = { items: [] };
        } else if (id.startsWith("spreadsheet")) {
          defaultValue = [{ name: "Sheet1", celldata: [], status: 1 }];
        }

        const nextMemos = { ...stateRef.current.memos, [id]: defaultValue };
        setMemos(nextMemos);
        persistState({ memos: nextMemos });
        toast.success("현재 페이지가 초기화되었습니다.");
        return;
      }

      if (type === "memos") {
        const nextMemos = { ...stateRef.current.memos };
        const nextTitles = { ...stateRef.current.titles };
        Object.keys(nextMemos).forEach(id => {
          if (id.startsWith("memo")) delete nextMemos[id];
        });
        Object.keys(nextTitles).forEach(id => {
          if (id.startsWith("memo")) delete nextTitles[id];
        });

        // Pick only memo defaults
        Object.keys(DEFAULT_MEMOS).forEach(key => {
          if (key.startsWith("memo")) nextMemos[key] = DEFAULT_MEMOS[key];
        });
        Object.keys(DEFAULT_TITLES).forEach(key => {
          if (key.startsWith("memo")) nextTitles[key] = DEFAULT_TITLES[key];
        });

        setMemos(nextMemos);
        setTitles(nextTitles);
        persistState({ memos: nextMemos, titles: nextTitles });
        localStorage.removeItem(STORAGE_KEYS.LAYOUT);
        toast.success("메모장이 초기화되었습니다.");
        skipPersistRef.current = true;
        setTimeout(() => window.location.reload(), 500);
        return;
      }

      if (type === "todos") {
        const nextMemos = { ...stateRef.current.memos };
        const nextTitles = { ...stateRef.current.titles };
        Object.keys(nextMemos).forEach(id => {
          if (id.startsWith("todo")) delete nextMemos[id];
        });
        Object.keys(nextTitles).forEach(id => {
          if (id.startsWith("todo")) delete nextTitles[id];
        });

        // Pick only todo defaults
        Object.keys(DEFAULT_MEMOS).forEach(key => {
          if (key.startsWith("todo")) nextMemos[key] = DEFAULT_MEMOS[key];
        });
        Object.keys(DEFAULT_TITLES).forEach(key => {
          if (key.startsWith("todo")) nextTitles[key] = DEFAULT_TITLES[key];
        });

        setMemos(nextMemos);
        setTitles(nextTitles);
        persistState({ memos: nextMemos, titles: nextTitles });
        localStorage.removeItem(STORAGE_KEYS.LAYOUT);
        toast.success("To-Do List가 초기화되었습니다.");
        skipPersistRef.current = true;
        setTimeout(() => window.location.reload(), 500);
        return;
      }

      // Default: all
      skipPersistRef.current = true;

      // Clear auto-lock store states after confirmation
      const { setSessionKey, setAutoLockEnabled, setKeyError } = useAutoLockStore.getState();
      setSessionKey(null);
      setAutoLockEnabled(false);
      setKeyError(false);

      // Clear visual toggle locks
      useVisualToggleStore.setState({ tabLocks: {}, lockedTabs: {}, tabSessionPasswords: {} });

      await memoDB.deleteItem(STORAGE_KEY);
      await memoDB.clearHistory();
      localStorage.removeItem(STORAGE_KEYS.MEMOS);
      localStorage.removeItem(STORAGE_KEYS.TITLES);
      localStorage.removeItem(STORAGE_KEYS.LAYOUT);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      window.location.reload();
    });
  }, [persistState]);

  const addMemo = useCallback((type: "memo" | "todo" | "spreadsheet" = "memo") => {
    if (useHistoryStore.getState().isReadOnly) {
      toast.error("읽기 전용 모드에서는 추가할 수 없습니다.");
      return;
    }
    if (!apiRef.current) return;
    const id = `${type}-${Date.now()}`;
    const component = type === "memo" ? "editor" : type === "todo" ? "todoList" : "spreadsheet";
    const title = type === "memo" ? "New Memo" : type === "todo" ? "New To-Do List" : "New Spreadsheets";

    apiRef.current.addPanel({
      id: id,
      component: component,
      title: title,
      tabComponent: "default",
    });

    const initialContent = type === "memo"
      ? { type: "doc", content: [{ type: "paragraph" }] }
      : type === "todo" ? { items: [] }
        : [{ name: "Sheet1", celldata: [], status: 1 }];

    const nextMemos = { ...stateRef.current.memos, [id]: initialContent };
    const nextTitles = { ...stateRef.current.titles, [id]: title };
    setMemos(nextMemos);
    setTitles(nextTitles);
    persistState({ memos: nextMemos, titles: nextTitles });
    toast.success(type === "memo" ? "새로운 메모가 생성되었습니다." : type === "todo" ? "새로운 To-Do List가 생성되었습니다." : "새로운 스프레드시트가 생성되었습니다.");
  }, [persistState, apiRef]);

  const downloadData = useCallback(async (mode: "current" | "full" = "current") => {
    let data: any;
    const { viewingDate, isReadOnly } = useHistoryStore.getState();

    if (mode === "current" && isReadOnly && viewingDate) {
      // If viewing history, download the snapshot data as the 'current' file
      data = await memoDB.getHistoryItem<any>(viewingDate);
    } else {
      // Default: get live data
      data = await memoDB.getItem<any>(STORAGE_KEY);
    }

    if (!data) {
      toast.error("저장된 데이터가 없습니다.");
      return;
    }

    const autoLockOn = useAutoLockStore.getState().autoLockEnabled;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear().toString().slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    let exportData: any;
    let filename: string;

    if (mode === "full") {
      // Full mode: include all history entries (always include live data in full export)
      const liveData = await memoDB.getItem<any>(STORAGE_KEY);
      const historyKeys = await memoDB.getAllHistoryKeys();
      const history: Record<string, any> = {};
      for (const key of historyKeys) {
        const entry = await memoDB.getHistoryItem<any>(key);
        if (entry) history[key] = entry;
      }
      exportData = { ...(liveData || data), __history: history };
      filename = `next-notepad-full-${dateStr}-${timeStr}${autoLockOn ? "-encrypted" : ""}.json`;
    } else {
      exportData = data;
      const displayDate = isReadOnly && viewingDate ? viewingDate : dateStr;
      filename = `next-notepad-${displayDate}-${timeStr}${autoLockOn ? "-encrypted" : ""}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    const msg = mode === "full"
      ? `전체 데이터 (이력 ${Object.keys(exportData.__history || {}).length}개 포함)를 다운로드했습니다.`
      : autoLockOn ? "암호화된 데이터를 다운로드했습니다." : "데이터를 성공적으로 다운로드했습니다.";
    toast.success(msg);
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

        // Extract and restore history if present
        const historyData = json.__history;
        const mainData = { ...json };
        delete mainData.__history;

        // Always clear existing history first to ensure the app state matches the uploaded file
        await memoDB.clearHistory();
        await memoDB.setItem(STORAGE_KEY, mainData);

        // Restore history entries if present
        if (historyData && typeof historyData === "object") {
          const keys = Object.keys(historyData).sort();
          // Only keep up to MAX_HISTORY entries
          const keysToRestore = keys.slice(-MAX_HISTORY);
          for (const key of keysToRestore) {
            await memoDB.setHistoryItem(key, historyData[key]);
          }
        }

        if (mainData.isEncrypted) {
          setIsEncrypted(true);
          isEncryptedRef.current = true;
          setMemos(DEFAULT_MEMOS);
          setTitles(DEFAULT_TITLES);

          // Reset layout to default when uploading encrypted data
          if (apiRef.current) {
            try {
              apiRef.current.clear();
              apiRef.current.addPanel({ id: "memo1", component: "editor", title: DEFAULT_TITLES["memo1"], tabComponent: "default" });
              apiRef.current.addPanel({ id: "todo1", component: "todoList", title: DEFAULT_TITLES["todo1"], tabComponent: "default", position: { referencePanel: "memo1", direction: "right" } });
              apiRef.current.addPanel({ id: "spreadsheet1", component: "spreadsheet", title: DEFAULT_TITLES["spreadsheet1"], tabComponent: "default", position: { referencePanel: "todo1", direction: "below" } });
            } catch (e) { console.error("Layout reset failed during upload", e); }
          }
        } else {
          setIsEncrypted(false);
          isEncryptedRef.current = false;
          if (mainData.memos) setMemos(mainData.memos);
          if (mainData.titles) setTitles(mainData.titles);
        }
        if (mainData.settings) setSettings(mainData.settings);
        if (mainData.theme) {
          setIsDarkMode(mainData.theme === "dark");
        }

        if (mainData.layout && apiRef.current) {
          try {
            apiRef.current.fromJSON(mainData.layout);
          } catch (e) {
            console.error("Layout restore failed during upload", e);
          }
        }

        const historyCount = historyData ? Object.keys(historyData).length : 0;
        const msg = historyCount > 0
          ? `데이터를 업로드했습니다. (이력 ${historyCount}개 복원)`
          : "데이터를 성공적으로 업로드했습니다.";
        toast.success(msg);
        setTimeout(() => {
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
    const { autoLockEnabled, setSessionKey } = useAutoLockStore.getState();

    if (!isEncrypted) {
      if (autoLockEnabled) {
        toast.info("AUTO LOCK을 해제해주세요");
        return;
      }
      showSecurePrompt("암호화 key를 입력하세요", async (key) => {
        if (!key) return;

        // If viewing history, return to Today after key is entered
        const { isReadOnly } = useHistoryStore.getState();
        if (isReadOnly) {
          loadHistoryDate(null);
        }

        useLoadingOverlay.getState().show("암호화 중...");
        try {
          debouncedPersist.cancel(); // Defensive code: cancel pending saves
          skipPersistRef.current = true; // Block auto-persistence during lock process
          
          let data = await memoDB.getItem<any>(STORAGE_KEY) || {};
          
          // Capture LATEST state including layout and titles
          const memosToEncrypt = stateRef.current.memos;

          // Defensive code: prevent encrypting the DEFAULT_MEMOS if it was already reset
          if (memosToEncrypt === DEFAULT_MEMOS) {
            console.warn("Attempted to encrypt DEFAULT_MEMOS, aborting to prevent data loss.");
            skipPersistRef.current = false;
            useLoadingOverlay.getState().hide();
            return;
          }

          const titlesToEncrypt = stateRef.current.titles;
          const layoutToEncrypt = apiRef.current?.toJSON();

          data.memos = encryptMemosText(memosToEncrypt, key);
          data.titles = titlesToEncrypt;
          data.layout = layoutToEncrypt;
          data.isEncrypted = true;
          data.lastUpdated = new Date().toISOString(); // Defensive code: update timestamp
          
          const { default: CryptoJS } = await import("crypto-js");
          data.keyHash = CryptoJS.SHA256(key).toString();
          delete data.encryptedKey;
          
          if (autoLockEnabled) {
            data.autoLock = true;
          }

          await memoDB.setItem(STORAGE_KEY, data);
          setIsEncrypted(true);
          isEncryptedRef.current = true;
          setMemos(DEFAULT_MEMOS);
          setTitles(DEFAULT_TITLES);
          stateRef.current.memos = DEFAULT_MEMOS;
          stateRef.current.titles = DEFAULT_TITLES;
          
          // Reset layout to default when manually locking
          if (apiRef.current) {
            try {
              apiRef.current.clear();
              apiRef.current.addPanel({ id: "memo1", component: "editor", title: DEFAULT_TITLES["memo1"], tabComponent: "default" });
              apiRef.current.addPanel({ id: "todo1", component: "todoList", title: DEFAULT_TITLES["todo1"], tabComponent: "default", position: { referencePanel: "memo1", direction: "right" } });
              apiRef.current.addPanel({ id: "spreadsheet1", component: "spreadsheet", title: DEFAULT_TITLES["spreadsheet1"], tabComponent: "default", position: { referencePanel: "todo1", direction: "below" } });
            } catch (e) { console.error("Layout reset failed during lock", e); }
          }
          
          // Clear session key when manually locking
          setSessionKey(null);

          setTimeout(() => {
            skipPersistRef.current = false;
            useLoadingOverlay.getState().hide();
          }, 1000);
        } catch (e) {
          console.error("Encryption failed", e);
          skipPersistRef.current = false;
          useLoadingOverlay.getState().hide();
        }
      }, { placeholder: "암호화 키 입력" });
    } else {
      showSecurePrompt("복호화 key를 입력하세요", async (key) => {
        if (!key) return;
        useLoadingOverlay.getState().show("복호화 중...");
        try {
          debouncedPersist.cancel(); // Defensive code: cancel pending saves
          skipPersistRef.current = true; // Block early
          const data = await memoDB.getItem<any>(STORAGE_KEY);
          if (data && data.isEncrypted && data.memos) {
            let isValid = false;
            const { default: CryptoJS } = await import("crypto-js");
            if (data.keyHash) {
              isValid = (CryptoJS.SHA256(key).toString() === data.keyHash);
            } else if (data.encryptedKey) {
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
            skipPersistRef.current = true; // Ensure blocked auto-persistence during unlock process

            if (autoLockEnabled) {
              // Auto-lock ON: decrypt in memory only, keep encrypted in IndexedDB
              // Store session key so persist logic can re-encrypt on save
              setSessionKey(key);
              setIsEncrypted(false);
              isEncryptedRef.current = false;
              setMemos(decryptedMemos);
              if (data.titles) setTitles(data.titles);
              stateRef.current.memos = decryptedMemos;
              stateRef.current.titles = data.titles || DEFAULT_TITLES;

              // Restore layout from data when unlocking
              if (data.layout && apiRef.current) {
                setTimeout(() => {
                  try {
                    apiRef.current?.fromJSON(data.layout);
                    if (data.titles) {
                      apiRef.current?.panels.forEach(p => {
                        if (data.titles[p.id]) p.api.setTitle(data.titles[p.id]);
                      });
                    }
                  } catch (e) { console.error("Layout restore failed during unlock", e); }
                }, 0);
              }

              toast.success("잠금이 해제되었습니다. (AUTO LOCK 유지)");
            } else {
              // Normal unlock: save decrypted to IndexedDB
              data.memos = decryptedMemos;
              data.isEncrypted = false;
              data.lastUpdated = new Date().toISOString(); // Defensive code: update timestamp
              delete data.encryptedKey;
              delete data.keyHash;
              await memoDB.setItem(STORAGE_KEY, data);
              setIsEncrypted(false);
              isEncryptedRef.current = false;
              setMemos(decryptedMemos);
              if (data.titles) setTitles(data.titles);
              stateRef.current.memos = decryptedMemos;
              stateRef.current.titles = data.titles || DEFAULT_TITLES;

              // Restore layout from data when unlocking
              if (data.layout && apiRef.current) {
                setTimeout(() => {
                  try {
                    apiRef.current?.fromJSON(data.layout);
                    if (data.titles) {
                      apiRef.current?.panels.forEach(p => {
                        if (data.titles[p.id]) p.api.setTitle(data.titles[p.id]);
                      });
                    }
                  } catch (e) { console.error("Layout restore failed during unlock", e); }
                }, 0);
              }

              toast.success("암호화가 해제되었습니다.");
            }
          } else {
            setIsEncrypted(false);
            isEncryptedRef.current = false;
          }
          setTimeout(() => {
            skipPersistRef.current = false;
            useLoadingOverlay.getState().hide();
          }, 1000);
        } catch (e) {
          console.error("Decryption failed", e);
          skipPersistRef.current = false;
          useLoadingOverlay.getState().hide();
        }
      }, { placeholder: "복호화 키 입력" });
    }
  }, [isEncrypted]);

  // Load a historical date snapshot
  const loadHistoryDate = useCallback(async (dateKey: string | null) => {
    const { setViewingDate } = useHistoryStore.getState();
    const { autoLockEnabled, sessionKey } = useAutoLockStore.getState();

    // Block access if app is locked (auto-lock ON but no session key)
    if (autoLockEnabled && !sessionKey && dateKey !== null) {
      toast.error("잠금을 해제해야 이력을 볼 수 있습니다.");
      return;
    }

    if (dateKey === null) {
      // Return to live mode: reload from main storage
      setViewingDate(null);
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);
      if (savedData) {
        const autoLockOn = useAutoLockStore.getState().autoLockEnabled;
        const sessionKeyVal = useAutoLockStore.getState().sessionKey;
        if (savedData.isEncrypted && autoLockOn && sessionKeyVal) {
          const decrypted = decryptMemosText(savedData.memos, sessionKeyVal);
          setMemos(decrypted);
          if (savedData.titles) setTitles(savedData.titles);
          stateRef.current.memos = decrypted;
          stateRef.current.titles = savedData.titles || DEFAULT_TITLES;
        } else if (!savedData.isEncrypted) {
          if (savedData.memos) setMemos(savedData.memos);
          if (savedData.titles) setTitles(savedData.titles);
          stateRef.current.memos = savedData.memos || {};
          stateRef.current.titles = savedData.titles || {};
        }
        if (savedData.layout && apiRef.current) {
          try { apiRef.current.fromJSON(savedData.layout); } catch (e) { console.error(e); }
        }
      }
      toast.success("암호화 성공! 오늘 데이터로 돌아왔습니다.");
      return;
    }

    // Load history snapshot
    const snapshot = await memoDB.getHistoryItem<any>(dateKey);
    if (!snapshot) {
      toast.error("해당 날짜의 이력이 없습니다.");
      return;
    }

    setViewingDate(dateKey);

    // If snapshot is encrypted, we need session key to view
    const autoLockOn = useAutoLockStore.getState().autoLockEnabled;
    const sessionKeyVal = useAutoLockStore.getState().sessionKey;
    if (snapshot.isEncrypted && autoLockOn && sessionKeyVal) {
      const decrypted = decryptMemosText(snapshot.memos, sessionKeyVal);
      setMemos(decrypted);
    } else if (snapshot.isEncrypted) {
      toast.error("잠금 해제 후 이력을 볼 수 있습니다.");
      setViewingDate(null);
      return;
    } else {
      setMemos(snapshot.memos || {});
    }

    if (snapshot.titles) setTitles(snapshot.titles);
    if (snapshot.layout && apiRef.current) {
      try { apiRef.current.fromJSON(snapshot.layout); } catch (e) { console.error(e); }
    }
    toast.success(`${dateKey} 이력을 불러왔습니다. (읽기 전용)`);
  }, [apiRef]);

  // Delete a historical date snapshot
  const deleteHistoryDate = useCallback(async (dateKey: string) => {
    if (!confirm(`${dateKey} 이력을 삭제하시겠습니까?`)) return;

    try {
      await memoDB.deleteHistoryItem(dateKey);
      toast.success(`${dateKey} 이력이 삭제되었습니다.`);
      // Return to today's data
      loadHistoryDate(null);
    } catch (err) {
      console.error("Failed to delete history", err);
      toast.error("이력 삭제에 실패했습니다.");
    }
  }, [loadHistoryDate]);

  return {
    memos, titles, isDarkMode, setIsDarkMode, isMounted, settings, updateSettings,
    saveStatus, progressWidth, isEncrypted, isReadOnly, lastUpdated, persistState, removeMemo, resetData,
    updateMemo, updateTitle, addMemo, downloadData, uploadData, toggleEncryption, loadHistoryDate, deleteHistoryDate
  };
}
