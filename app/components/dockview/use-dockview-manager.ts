import { useCallback, useState } from "react";
import { DockviewReadyEvent } from "dockview";
import { memoDB } from "../../library/indexDB";
import { DEFAULT_TITLES, STORAGE_KEYS } from "@/app/constants/default";

import { useAutoLockStore } from "@/app/store/auto-lock-store";

export function useDockviewManager(
  apiRef: React.MutableRefObject<DockviewReadyEvent["api"] | null>,
  removeMemo: (id: string) => void,
  persistState: () => void
) {
  const STORAGE_KEY = "my-secret-key";
  const [panelIds, setPanelIds] = useState<string[]>([]);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    event.api.onDidLayoutChange(() => {
      setPanelIds(event.api.panels.map(p => p.id));
      persistState();
    });

    event.api.onDidRemovePanel((panel) => {
      removeMemo(panel.id);
    });

    const initializeLayout = async () => {
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);
      if (apiRef.current !== event.api) return;

      const { sessionKey } = useAutoLockStore.getState();
      const isLocked = savedData?.isEncrypted && !sessionKey;

      const savedLayout = savedData?.layout;
      const savedTitlesMap = savedData?.titles || {};

      if (isLocked) {
        // Force default layout when locked
        try {
          event.api.addPanel({
            id: "memo1",
            component: "editor",
            title: DEFAULT_TITLES["memo1"],
            tabComponent: "default",
          });
          event.api.addPanel({
            id: "todo1",
            component: "todoList",
            title: DEFAULT_TITLES["todo1"],
            tabComponent: "default",
            position: { referencePanel: "memo1", direction: "right" },
          });
          event.api.addPanel({
            id: "spreadsheet1",
            component: "spreadsheet",
            title: DEFAULT_TITLES["spreadsheet1"],
            tabComponent: "default",
            position: { referencePanel: "todo1", direction: "below" },
          });
        } catch (e) {
          console.error("Failed to create locked default layout", e);
        }
      } else if (savedLayout) {
        try {
          event.api.fromJSON(savedLayout);
          event.api.panels.forEach(panel => {
            if (savedTitlesMap[panel.id]) {
              panel.api.setTitle(savedTitlesMap[panel.id]);
            }
          });
        } catch (e) {
          console.error("Failed to load saved layout", e);
        }
      } else {
        const legacyLayoutStr = localStorage.getItem(STORAGE_KEYS.LAYOUT);
        if (legacyLayoutStr) {
          try {
            event.api.fromJSON(JSON.parse(legacyLayoutStr));
          } catch (e) {
            console.error("Failed to load legacy layout", e);
          }
        } else {
          try {
            event.api.addPanel({
              id: "memo1",
              component: "editor",
              title: DEFAULT_TITLES["memo1"],
              tabComponent: "default",
            });
            event.api.addPanel({
              id: "todo1",
              component: "todoList",
              title: DEFAULT_TITLES["todo1"],
              tabComponent: "default",
              position: { referencePanel: "memo1", direction: "right" },
            });
            event.api.addPanel({
              id: "spreadsheet1",
              component: "spreadsheet",
              title: DEFAULT_TITLES["spreadsheet1"],
              tabComponent: "default",
              position: { referencePanel: "todo1", direction: "below" },
            });
          } catch (e) {
            console.error("Failed to create default layout", e);
          }
        }
      }

      setPanelIds(event.api.panels.map(p => p.id));
    };

    initializeLayout();
  }, [removeMemo, persistState, apiRef]);

  return { onReady, panelIds };
}
