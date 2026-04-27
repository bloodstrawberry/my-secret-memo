import { useContext, useState, memo, KeyboardEvent, useMemo, useEffect, useRef } from "react";
import { IDockviewPanelProps } from "dockview";
import { Icon } from "@iconify/react";
import { MemoContext } from "./context";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "@/app/components/toast";
import { useSettings } from "@/app/context/settings-context";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { LockedView } from "./locked-view";
import { DEFAULT_MEMOS } from "@/app/constants/default";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface TodoData {
  items: TodoItem[];
}

interface SortableTodoItemProps {
  item: TodoItem;
  editingId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  handleEditStart: (item: TodoItem) => void;
  handleEditSave: () => void;
  handleEditKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  toggleCompleted: (id: string) => void;
  deleteItem: (id: string) => void;
  updateStyle: (id: string, type: 'border' | 'bg' | 'text', color: string) => void;
  activeTab: 'border' | 'bg' | 'text';
  setActiveTab: (tab: 'border' | 'bg' | 'text') => void;
  isReadOnly?: boolean;
}

const SortableTodoItem = memo(function SortableTodoItem({
  item,
  editingId,
  editingText,
  setEditingText,
  handleEditStart,
  handleEditSave,
  handleEditKeyDown,
  toggleCompleted,
  deleteItem,
  updateStyle,
  activeTab,
  setActiveTab,
  isReadOnly,
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  const TODO_COLORS = [
    { name: 'Default', value: '' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
  ];

  const containerStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
    ...(item.backgroundColor && !item.completed ? { backgroundColor: item.backgroundColor } : {}),
    ...(item.borderColor && !item.completed ? { borderColor: item.borderColor } : {}),
    ...(item.textColor && !item.completed ? { color: item.textColor } : {}),
  };


  return (
    <div
      ref={setNodeRef}
      style={containerStyle}
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all flex-shrink-0 ${item.completed
        ? "bg-slate-500/5 border-transparent text-slate-400"
        : "bg-[var(--background)] border-[var(--border-color)] hover:border-cyan-500/50 text-[var(--foreground)] shadow-sm"
        } ${isDragging ? "shadow-lg border-cyan-500" : ""}`}
    >
      <div className="flex items-center gap-1 flex-shrink-0">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-cyan-500 transition-colors"
        >
          <Icon icon="mdi:drag-vertical" className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => !isReadOnly && toggleCompleted(item.id)}
            disabled={isReadOnly}
            className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${item.completed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-400 hover:border-cyan-500 text-transparent hover:text-cyan-500/30"
              }`}
          >
            <Icon icon="mdi:check" className="w-4 h-4" />
          </button>

          <div className="relative flex-shrink-0" ref={pickerRef}>
            <button
              disabled={isReadOnly}
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="w-5 h-5 rounded-md border border-slate-400 bg-slate-400/10 hover:border-cyan-500 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <Icon icon="mdi:palette" className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500" />
            </button>

            {isPickerOpen && (
              <div className="absolute left-0 top-full mt-2 flex flex-col bg-[var(--panel-bg)] border border-[var(--border-color)] p-2.5 rounded-2xl shadow-2xl z-[60] gap-3 backdrop-blur-xl min-w-[180px]">
                <div className="flex p-1 bg-slate-500/10 rounded-xl gap-1">
                  {(['border', 'bg', 'text'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveTab(type)}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${activeTab === type ? "bg-cyan-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <Icon
                        icon={type === 'border' ? 'mdi:border-all-variant' : type === 'bg' ? 'mdi:format-color-fill' : 'mdi:format-color-text'}
                        className="w-4 h-4"
                      />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {TODO_COLORS.map((c) => {
                    const isSelected = (activeTab === 'border' && item.borderColor === c.value) ||
                      (activeTab === 'bg' && item.backgroundColor === c.value) ||
                      (activeTab === 'text' && item.textColor === c.value);

                    return (
                      <button
                        key={c.name}
                        onClick={() => updateStyle(item.id, activeTab, c.value)}
                        className={`w-5 h-5 rounded-full border border-white/10 hover:scale-125 transition-transform relative ${isSelected ? "ring-2 ring-cyan-500 ring-offset-2 ring-offset-[var(--panel-bg)]" : ""}`}
                        style={{ backgroundColor: c.value || "transparent" }}
                        title={c.name}
                      >
                        {!c.value && <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-40"><Icon icon="mdi:close" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingId === item.id ? (
        <input
          autoFocus
          type="text"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleEditKeyDown}
          className="flex-1 bg-transparent border-b border-cyan-500 outline-none"
          style={{ color: item.textColor && !item.completed ? item.textColor : "var(--foreground)" }}
        />
      ) : (
        <Tooltip
          title={item.text}
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                whiteSpace: "nowrap",
                maxWidth: "none",
              },
            },
          }}
        >
          <span
            onDoubleClick={() => !isReadOnly && handleEditStart(item)}
            className={`flex-1 w-full whitespace-nowrap overflow-hidden text-ellipsis transition-all cursor-text select-none ${item.completed ? "line-through opacity-70" : ""}`}
          >
            {item.text}
          </span>
        </Tooltip>
      )}

      {!isReadOnly && (
        <button
          onClick={() => deleteItem(item.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

export const TodoListPanel = memo(function TodoListPanel(props: IDockviewPanelProps) {
  const { memos, isReadOnly, updateMemo, isEncrypted } = useContext(MemoContext);
  const { settings } = useSettings();
  const { lockedTabs } = useVisualToggleStore();
  const isLocked = lockedTabs[props.api.id] === true;
  const memoData: TodoData = memos[props.api.id] || DEFAULT_MEMOS.todo1;
  const [inputValue, setInputValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [activeTab, setActiveTab] = useState<'border' | 'bg' | 'text'>('border');
  const [lastStyles, setLastStyles] = useState({
    border: '',
    bg: '',
    text: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateItems = (newItems: TodoItem[]) => {
    updateMemo(props.api.id, { ...memoData, items: newItems });
  };

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: inputValue.trim(),
      completed: false,
      borderColor: lastStyles.border,
      backgroundColor: lastStyles.bg,
      textColor: lastStyles.text,
    };
    updateItems([...memoData.items, newItem]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  const handleEditStart = (item: TodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleEditSave = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      const newItems = memoData.items.map(item =>
        item.id === editingId ? { ...item, text: trimmed } : item
      );
      updateItems(newItems);
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const toggleCompleted = (id: string) => {
    const newItems = memoData.items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateItems(newItems);
  };

  const updateStyle = (id: string, type: 'border' | 'bg' | 'text', color: string) => {
    setLastStyles(prev => ({ ...prev, [type]: color }));
    const newItems = memoData.items.map(item => {
      if (item.id === id) {
        if (type === 'border') return { ...item, borderColor: color };
        if (type === 'bg') return { ...item, backgroundColor: color };
        if (type === 'text') return { ...item, textColor: color };
      }
      return item;
    });
    updateItems(newItems);
  };

  const deleteItem = (id: string) => {
    toast.confirm("정말 이 항목을 삭제하시겠습니까?", () => {
      const newItems = memoData.items.filter(item => item.id !== id);
      updateItems(newItems);
    }, { type: "danger", confirmText: "삭제", cancelText: "취소" });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = memoData.items.findIndex((item) => item.id === active.id);
      const newIndex = memoData.items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(memoData.items, oldIndex, newIndex);
      updateItems(newItems);
    }
  };

  const total = memoData.items.length;
  const completedCount = memoData.items.filter(i => i.completed).length;

  const isJeonSoMin = settings.fontFamily.toLowerCase().includes("jeonsomin");

  return (
    <div
      className="h-full w-full bg-[var(--panel-bg)] flex flex-col overflow-hidden transition-colors duration-300 border border-[var(--border-color)] relative"
      style={{
        fontFamily: settings.fontFamily,
        fontWeight: isJeonSoMin ? "bold" : "normal",
        fontSize: isJeonSoMin ? `${parseInt(settings.fontSize) + 2}px` : settings.fontSize
      }}
    >
      {(isLocked && !isEncrypted) ? (
        <LockedView panelId={props.api.id} />
      ) : (
        <>
          {/* Read-only indicator */}
          {isReadOnly && (
            <div className="flex items-center gap-2 px-6 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              읽기 전용
            </div>
          )}

          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-medium text-slate-500 bg-slate-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                {completedCount} / {total} Completed
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isReadOnly ? "읽기 전용 모드" : "What needs to be done?"}
                disabled={isReadOnly}
                className="flex-1 bg-transparent border-b border-[var(--border-color)] focus:border-cyan-500 pb-2 outline-none text-[var(--foreground)] transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleAdd}
                disabled={!inputValue.trim() || isReadOnly}
                className="p-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-cyan-500/20 flex-shrink-0"
              >
                <Icon icon="mdi:plus" className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="px-6 pb-6 space-y-2">
              {memoData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                  <Icon icon="mdi:check-all" className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">No tasks yet.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                >
                  <SortableContext
                    items={memoData.items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {memoData.items.map((item) => (
                      <SortableTodoItem
                        key={item.id}
                        item={item}
                        editingId={editingId}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        handleEditStart={handleEditStart}
                        handleEditSave={handleEditSave}
                        handleEditKeyDown={handleEditKeyDown}
                        toggleCompleted={toggleCompleted}
                        deleteItem={deleteItem}
                        updateStyle={updateStyle}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
