import { IDockviewHeaderActionsProps } from 'dockview';
import * as React from 'react';
import { Icon } from '@iconify/react';
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";

const HeaderIcon = (props: {
  icon: string;
  title?: string;
  onClick?: (event: React.MouseEvent) => void;
  active?: boolean;
}) => (
  <div
    title={props.title}
    className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all hover:bg-slate-500/10 ${
      props.active ? 'text-cyan-500 bg-cyan-500/10' : 'text-[var(--foreground)] opacity-60 hover:opacity-100'
    }`}
    onClick={props.onClick}
  >
    <Icon icon={props.icon} width={18} height={18} />
  </div>
);

export const RightControls = (props: IDockviewHeaderActionsProps) => {
  const { toolbarVisibility, toggleToolbarVisibility } = useVisualToggleStore();
  
  // Dockview header actions props provide group access. The active panel in this group is what we control.
  const activePanel = props.group.activePanel;
  const activePanelId = activePanel?.id;
  
  // Default to true (visible) if not set. Store stores false for hidden.
  const isVisible = activePanelId ? toolbarVisibility[activePanelId] !== false : true;

  const onToggleToolbar = () => {
    if (activePanelId) {
      toggleToolbarVisibility(activePanelId);
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
        onClick={() => activePanel?.api.close()}
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
