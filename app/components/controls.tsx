import { IDockviewHeaderActionsProps } from 'dockview';
import * as React from 'react';
import { Icon } from '@iconify/react';
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { toast } from "@/app/components/toast";
import { MemoContext } from "./dockview/context";
import { encryptSingleMemo, decryptSingleMemo, hashPassword } from "./dockview/utils";

const HeaderIcon = (props: {
  icon: string;
  title?: string;
  onClick?: (event: React.MouseEvent) => void;
  active?: boolean;
  className?: string;
}) => (
  <div
    title={props.title}
    className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all hover:bg-slate-500/10 ${
      props.active ? 'text-cyan-500 bg-cyan-500/10' : 'text-[var(--foreground)] opacity-60 hover:opacity-100'
    } ${props.className || ''}`}
    onClick={props.onClick}
  >
    <Icon icon={props.icon} width={18} height={18} />
  </div>
);

export const RightControls = (props: IDockviewHeaderActionsProps) => {
  const { 
    toolbarVisibility, 
    toggleToolbarVisibility,
    tabLocks,
    lockedTabs,
    setTabLock,
    toggleTabLock
  } = useVisualToggleStore();
  
  const { memos, updateMemo } = React.useContext(MemoContext);

  // Dockview header actions props provide group access. The active panel in this group is what we control.
  const activePanel = props.group.activePanel;
  const activePanelId = activePanel?.id;
  
  // Default to true (visible) if not set. Store stores false for hidden.
  const isVisible = activePanelId ? toolbarVisibility[activePanelId] !== false : true;
  const isLocked = activePanelId ? lockedTabs[activePanelId] === true : false;

  const onToggleToolbar = () => {
    if (activePanelId) {
      toggleToolbarVisibility(activePanelId);
    }
  };

  const onToggleVisibility = () => {
    if (!activePanelId) return;

    const currentContent = memos[activePanelId];

    if (isLocked) {
      // Unlock attempt
      toast.passwordPrompt("비밀번호를 입력하여 잠금을 해제하세요", (val) => {
        if (!val) return;
        const hash = hashPassword(val);
        if (hash === tabLocks[activePanelId]) {
          try {
            const decrypted = decryptSingleMemo(activePanelId, currentContent, val);
            toggleTabLock(activePanelId, false);
            updateMemo(activePanelId, decrypted, true);
            toast.success("잠금이 해제되었습니다.");
          } catch (e) {
            toast.error("복호화에 실패했습니다.");
          }
        } else {
          toast.error("비밀번호가 일치하지 않습니다.");
        }
      });
    } else {
      // Lock attempt
      toast.passwordPrompt("비밀번호를 설정하여 탭을 숨깁니다", (val) => {
        if (!val) {
          toast.error("비밀번호를 입력해야 합니다.");
          return;
        }
        const hash = hashPassword(val);
        try {
          const encrypted = encryptSingleMemo(activePanelId, currentContent, val);
          setTabLock(activePanelId, hash, val);
          toggleTabLock(activePanelId, true);
          updateMemo(activePanelId, encrypted, true);
          toast.success("탭이 암호화되어 숨겨졌습니다.");
        } catch (e) {
          toast.error("암호화에 실패했습니다.");
        }
      });
    }
  };

  const [isMaximized, setIsMaximized] = React.useState<boolean>(
    props.containerApi.hasMaximizedGroup(),
  );

  React.useEffect(() => {
    const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
      setIsMaximized(props.containerApi.hasMaximizedGroup());
    });

    return () => {
      disposable.dispose();
    };
  }, [props.containerApi]);

  const onMaximize = () => {
    if (props.containerApi.hasMaximizedGroup()) {
      props.containerApi.exitMaximizedGroup();
    } else {
      activePanel?.api.maximize();
    }
  };

  return (
    <div className="flex items-center px-2 h-full gap-0.5">
      {activePanelId && (
        <HeaderIcon
          title={isLocked ? "콘텐츠 보이기" : "콘텐츠 숨기기"}
          icon={isLocked ? "material-symbols:visibility-off-outline" : "material-symbols:visibility-outline"}
          onClick={onToggleVisibility}
          active={isLocked}
          className={isLocked ? "text-amber-500 bg-amber-500/10" : ""}
        />
      )}

      {activePanelId && !activePanelId.startsWith("todo") && (
        <HeaderIcon
          title={isVisible ? "편집 도구 숨기기" : "편집 도구 보이기"}
          icon={isVisible ? "material-symbols:edit-off-outline" : "material-symbols:edit-outline"}
          onClick={onToggleToolbar}
          active={!isVisible}
        />
      )}
      
      <HeaderIcon
        title={isMaximized ? "Minimize View" : "Maximize View"}
        icon={isMaximized ? "material-symbols:collapse-content" : "material-symbols:expand-content"}
        onClick={onMaximize}
      />
      
      <HeaderIcon
        title="Close Panel"
        icon="material-symbols:close"
        onClick={() => {
          if (activePanel) {
            if (isLocked) {
              toast.error("잠겨있는 탭은 삭제할 수 없습니다. 먼저 잠금을 해제해 주세요.");
              return;
            }
            const isTodo = activePanel.id.startsWith("todo");
            const message = isTodo 
              ? "탭을 종료하면 To-Do List가 삭제됩니다. 정말 삭제하시겠습니까?"
              : "탭을 종료하면 메모가 삭제됩니다. 정말 삭제하시겠습니까?";

            toast.confirm(message, () => {
              activePanel.api.close();
            }, { type: "danger", confirmText: "삭제", cancelText: "유지" });
          }
        }}
      />
    </div>
  );
};

export const LeftControls = (props: IDockviewHeaderActionsProps) => {
  return null;
};

export const PrefixHeaderControls = (props: IDockviewHeaderActionsProps) => {
  return null;
};
