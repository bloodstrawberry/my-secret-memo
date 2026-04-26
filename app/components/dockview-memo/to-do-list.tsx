import { useContext, useState, memo, KeyboardEvent } from "react";
import { IDockviewPanelProps } from "dockview";
import { Icon } from "@iconify/react";
import { MemoContext } from "./context";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoData {
  items: TodoItem[];
}

export const TodoListPanel = memo(function TodoListPanel(props: IDockviewPanelProps) {
  const { memos, updateMemo } = useContext(MemoContext);
  const memoData: TodoData = memos[props.api.id] || { items: [] };
  const [inputValue, setInputValue] = useState("");

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

  const toggleCompleted = (id: string) => {
    const newItems = memoData.items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateItems(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = memoData.items.filter(item => item.id !== id);
    updateItems(newItems);
  };

  const total = memoData.items.length;
  const completedCount = memoData.items.filter(i => i.completed).length;

  return (
    <div className="h-full w-full bg-[var(--panel-bg)] p-6 flex flex-col overflow-hidden transition-colors duration-300 border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)]">To-Do List</h2>
        <div className="text-xs font-medium text-slate-500 bg-slate-500/10 px-2 py-1 rounded-full">
          {completedCount} / {total} Completed
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="flex-1 bg-transparent border-b border-[var(--border-color)] focus:border-cyan-500 pb-2 outline-none text-[var(--foreground)] transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-cyan-500/20"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {memoData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <Icon icon="mdi:check-all" className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">No tasks yet.</p>
          </div>
        ) : (
          memoData.items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                item.completed
                  ? "bg-slate-500/5 border-transparent text-slate-400"
                  : "bg-[var(--background)] border-[var(--border-color)] hover:border-cyan-500/50 text-[var(--foreground)] shadow-sm"
              }`}
            >
              <button
                onClick={() => toggleCompleted(item.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  item.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-400 hover:border-cyan-500 text-transparent hover:text-cyan-500/30"
                }`}
              >
                <Icon icon="mdi:check" className="w-4 h-4" />
              </button>
              
              <span className={`flex-1 break-words text-sm transition-all ${item.completed ? "line-through opacity-70" : ""}`}>
                {item.text}
              </span>

              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
