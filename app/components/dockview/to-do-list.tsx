import { useContext, useState, memo, KeyboardEvent, useMemo } from "react";
import { IDockviewPanelProps } from "dockview";
import { Icon } from "@iconify/react";
import { MemoContext } from "./context";
import { Tooltip } from "@/app/components/ui/tooltip";
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all flex-shrink-0 ${item.completed
        ? "bg-slate-500/5 border-transparent text-slate-400"
        : "bg-[var(--background)] border-[var(--border-color)] hover:border-cyan-500/50 text-[var(--foreground)] shadow-sm"
        } ${isDragging ? "shadow-lg border-cyan-500" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-cyan-500 transition-colors"
      >
        <Icon icon="mdi:drag-vertical" className="w-5 h-5" />
      </div>

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

      {editingId === item.id ? (
        <input
          autoFocus
          type="text"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleEditKeyDown}
          className="flex-1 bg-transparent border-b border-cyan-500 outline-none text-[var(--foreground)]"
        />
      ) : (
        <Tooltip content={item.text} className="flex-1">
          <span
            onDoubleClick={() => !isReadOnly && handleEditStart(item)}
            className={`w-full whitespace-nowrap overflow-hidden text-ellipsis transition-all cursor-text select-none ${item.completed ? "line-through opacity-70" : ""}`}
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
