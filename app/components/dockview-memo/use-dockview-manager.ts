import { useCallback } from "react";
import { DockviewReadyEvent } from "dockview";
import { memoDB } from "../../library/indexDB";
import { DEFAULT_TITLES, STORAGE_KEYS } from "@/app/constants/default";

export function useDockviewManager(
  apiRef: React.MutableRefObject<DockviewReadyEvent["api"] | null>,
  removeMemo: (id: string) => void,
  persistState: () => void
) {
  const STORAGE_KEY = "my-secret-key";

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    event.api.onDidLayoutChange(() => {
      persistState();
    });

    event.api.onDidRemovePanel((panel) => {
      removeMemo(panel.id);
    });

    const initializeLayout = async () => {
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);
      if (apiRef.current !== event.api) return;

      const savedLayout = savedData?.layout;
      const savedTitlesMap = savedData?.titles || {};

      if (savedLayout) {
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
              id: "memo2",
              component: "editor",
              title: DEFAULT_TITLES["memo2"],
              tabComponent: "default",
              position: { referencePanel: "memo1", direction: "right" },
            });
            event.api.addPanel({
              id: "memo3",
              component: "editor",
              title: DEFAULT_TITLES["memo3"],
              tabComponent: "default",
              position: { referencePanel: "memo2", direction: "below" },
            });
          } catch (e) {
            console.error("Failed to create default layout", e);
          }
        }
      }
    };

    initializeLayout();
  }, [removeMemo, persistState, apiRef]);

  return { onReady };
}
