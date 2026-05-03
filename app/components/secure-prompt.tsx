"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

interface SecurePromptOptions {
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface SecurePromptState {
  isOpen: boolean;
  options: SecurePromptOptions;
  onConfirm: ((value: string) => void) | null;
  id: number;
}

// ── Global state for imperative API ──
let globalSetState: ((state: SecurePromptState) => void) | null = null;
let globalId = 0;

// ── Imperative API ──
export function showSecurePrompt(
  title: string,
  onConfirm: (value: string) => void,
  options?: Omit<SecurePromptOptions, "title">
) {
  globalSetState?.({
    isOpen: true,
    options: { title, ...options },
    onConfirm,
    id: ++globalId,
  });
}

// ── Modal Component ──
function SecurePromptModal({
  state,
  onClose,
}: {
  state: SecurePromptState;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [showPassword, setShowPassword] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("secure-prompt-show-password");
      return saved !== "false"; // Default to true (if null or true)
    }
    return true;
  });
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset value when opened
  useEffect(() => {
    if (state.isOpen) {
      setValue("");
      setIsClosing(false);
      // Focus the input after mount
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [state.isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm(value);
    }
    handleClose();
  }, [value, state.onConfirm, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleConfirm, handleClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!state.isOpen && !isClosing) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] transition-all duration-200 ${isClosing ? "opacity-0" : "opacity-100"
        }`}
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className={`w-full max-w-sm mx-4 rounded-2xl border shadow-2xl transition-all duration-200 ${isClosing
            ? "opacity-0 scale-95 translate-y-2"
            : "opacity-100 scale-100 translate-y-0"
          }`}
        style={{
          backgroundColor: "var(--panel-bg)",
          borderColor: "var(--border-color)",
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.35), 0 0 40px -8px rgba(244,63,94,0.15)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 mb-3">
            <Icon icon="material-symbols:lock-outline" className="w-6 h-6 text-white" />
          </div>
          <h2
            className="text-base font-extrabold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {state.options.title || "암호화 key를 입력하세요"}
          </h2>
        </div>

        {/* Input */}
        <div className="px-6 py-4">
          <div className="relative flex items-center group">
            <Icon
              icon="material-symbols:key-outline"
              className="absolute left-3 w-4 h-4 text-rose-500 opacity-60 group-focus-within:opacity-100 transition-opacity z-10"
            />
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              placeholder={state.options.placeholder || "암호화 키를 입력하세요..."}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm transition-all font-mono tracking-widest selection:bg-rose-500/30"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              lang="en"
              style={{
                backgroundColor: "rgba(244,63,94,0.05)",
                border: "1.5px solid rgba(244,63,94,0.3)",
                outline: "none",
                color: "var(--foreground)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
                imeMode: "disabled",
              } as React.CSSProperties}
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                // Filter out non-ASCII characters (e.g., Korean)
                const filtered = val.replace(/[^\x00-\x7F]/g, "");
                setValue(filtered);
              }}
              onCompositionStart={(e) => {
                // Skip on mobile devices to prevent virtual keyboard flicker/closing issues
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) return;

                // Interrupt Korean composition by blurring and refocusing
                const target = e.currentTarget;
                target.blur();
                setTimeout(() => {
                  target.focus();
                }, 0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(244,63,94,0.6)";
                e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.06), 0 0 0 3px rgba(244,63,94,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(244,63,94,0.3)";
                e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.06)";
              }}
            />
            <button
              onClick={() => {
                const next = !showPassword;
                setShowPassword(next);
                localStorage.setItem("secure-prompt-show-password", String(next));
              }}
              className="absolute right-2.5 p-1 rounded-md transition-colors z-10"
              style={{
                color: "rgba(244,63,94,0.5)",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(244,63,94,1)";
                e.currentTarget.style.backgroundColor = "rgba(244,63,94,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(244,63,94,0.5)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              tabIndex={-1}
            >
              <Icon
                icon={
                  showPassword
                    ? "material-symbols:visibility-outline"
                    : "material-symbols:visibility-off-outline"
                }
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              color: "var(--foreground)",
              opacity: 0.5,
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.backgroundColor = "rgba(100,116,139,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.5";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {state.options.cancelText || "취소"}
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f43f5e, #db2777)",
              boxShadow: "0 4px 14px rgba(244,63,94,0.3)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #e11d48, #be185d)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(244,63,94,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #f43f5e, #db2777)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(244,63,94,0.3)";
            }}
          >
            {state.options.confirmText || "확인"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Provider Component (mount once in layout) ──
export function SecurePromptProvider() {
  const [state, setState] = useState<SecurePromptState>({
    isOpen: false,
    options: {},
    onConfirm: null,
    id: 0,
  });

  useEffect(() => {
    globalSetState = setState;
    return () => {
      globalSetState = null;
    };
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return <SecurePromptModal key={state.id} state={state} onClose={handleClose} />;
}
