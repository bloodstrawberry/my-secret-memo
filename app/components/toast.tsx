"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { Icon } from "@iconify/react";
import * as React from "react";

export const Toaster = () => {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    // Initial check
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    // Observe changes
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SonnerToaster
        position="top-center"
        expand={false}
        richColors
        theme={theme}
        toastOptions={{
          className: "border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--foreground)] rounded-xl shadow-2xl backdrop-blur-xl",
          style: {
            fontFamily: "var(--font-geist-sans), sans-serif",
          },
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        [data-sonner-toast] *:focus,
        [data-sonner-toast] *:focus-visible {
          outline: none !important;
        }
        [data-sonner-toaster] {
          --width: auto !important;
          --max-width: 90vw !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        [data-sonner-toast] {
          width: var(--width) !important;
          max-width: var(--max-width) !important;
          min-width: fit-content !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          white-space: nowrap !important;
          margin-left: auto !important;
          margin-right: auto !important;
          border-radius: 16px !important;
          align-items: center !important;
          gap: 10px !important;
        }
        [data-sonner-toast] [data-content] {
          flex: initial !important;
          width: auto !important;
          display: flex !important;
          align-items: center !important;
        }
        [data-sonner-toast] [data-icon] {
          display: flex !important;
          align-items: center !important;
          align-self: center !important;
          margin: 0 !important;
        }
        [data-sonner-toast] [data-title] {
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
          margin-bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          text-align: left !important;
        }
        [data-sonner-toast] [data-description] {
          color: var(--foreground) !important;
          opacity: 0.9 !important;
        }
        [data-sonner-toast] [data-button] {
          align-self: center !important;
        }
        [data-sonner-toast] [data-close-button] {
          top: 4px !important;
          left: 4px !important;
          right: auto !important;
          transform: none !important;
        }
      `}} />
    </>
  );
};

const PromptContent = ({ 
  onConfirm, 
  onCancel, 
  placeholder, 
  confirmText, 
  cancelText, 
  type = "text",
  icon = "material-symbols:link"
}: { 
  onConfirm: (val: string) => void; 
  onCancel: () => void;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "text" | "password";
  icon?: string;
}) => {
  const [value, setValue] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleConfirm = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    onConfirm(value);
  };
  
  return (
    <div className="flex flex-col gap-4 mt-3 w-full min-w-[300px]">
      <div className="relative flex items-center group">
        <Icon icon={icon} className="absolute left-3 w-4 h-4 text-cyan-500 opacity-60 group-focus-within:opacity-100 transition-opacity" />
        <input
          type={type}
          autoFocus
          placeholder={placeholder || (type === "password" ? "비밀번호를 입력하세요..." : "내용을 입력하세요...")}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-[var(--border-color)] rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-sm transition-all shadow-inner text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleConfirm();
            }
            if (e.key === "Escape") {
              onCancel();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isSubmitted}
          className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-500/10 transition-colors text-slate-500 disabled:opacity-50"
        >
          {cancelText || "취소"}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitted}
          className="px-6 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {confirmText || "확인"}
        </button>
      </div>
    </div>
  );
};

export const toast = {
  success: (message: string) => 
    sonnerToast.success(message, {
      icon: <Icon icon="material-symbols:check-circle-outline" className="w-5 h-5 text-emerald-500" />,
    }),
  error: (message: string) => 
    sonnerToast.error(message, {
      icon: <Icon icon="material-symbols:error-outline" className="w-5 h-5 text-red-500" />,
    }),
  info: (message: string) => 
    sonnerToast.info(message, {
      icon: <Icon icon="material-symbols:info-outline" className="w-5 h-5 text-blue-500" />,
    }),
  warning: (message: string) => 
    sonnerToast.warning(message, {
      icon: <Icon icon="material-symbols:warning-outline" className="w-5 h-5 text-amber-500" />,
    }),
  // Custom confirmation toast
  confirm: (message: React.ReactNode, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string; type?: "info" | "warning" | "danger" }) => {
    sonnerToast.dismiss();
    let isConfirmed = false;
    const handleConfirm = () => {
      if (isConfirmed) return;
      isConfirmed = true;
      onConfirm();
    };

    const type = options?.type || "info";
    const iconMap = {
      info: <Icon icon="material-symbols:help-outline" className="w-5 h-5 text-cyan-500" />,
      warning: <Icon icon="material-symbols:warning-outline" className="w-5 h-5 text-amber-500" />,
      danger: <Icon icon="material-symbols:error-outline" className="w-5 h-5 text-red-500" />,
    };

    sonnerToast(message, {
      closeButton: false,
      duration: Infinity,
      action: {
        label: options?.confirmText || "확인",
        onClick: handleConfirm,
      },
      cancel: {
        label: options?.cancelText || "취소",
        onClick: () => {},
      },
      icon: iconMap[type],
    });
  },
  // Custom prompt toast
  prompt: (message: string, onConfirm: (value: string) => void, options?: { placeholder?: string; confirmText?: string; cancelText?: string }) => {
    sonnerToast.dismiss();
    const toastId = sonnerToast(message, {
      duration: Infinity,
      description: (
        <PromptContent 
          placeholder={options?.placeholder}
          confirmText={options?.confirmText}
          cancelText={options?.cancelText}
          onConfirm={(val) => {
            onConfirm(val);
            sonnerToast.dismiss(toastId);
          }}
          onCancel={() => sonnerToast.dismiss(toastId)}
        />
      ),
      icon: null, 
    });
  },
  // Custom password prompt toast
  passwordPrompt: (message: string, onConfirm: (value: string) => void, options?: { placeholder?: string; confirmText?: string; cancelText?: string }) => {
    sonnerToast.dismiss();
    const toastId = sonnerToast(message, {
      duration: Infinity,
      description: (
        <PromptContent 
          type="password"
          icon="material-symbols:lock-outline"
          placeholder={options?.placeholder}
          confirmText={options?.confirmText}
          cancelText={options?.cancelText}
          onConfirm={(val) => {
            onConfirm(val);
            sonnerToast.dismiss(toastId);
          }}
          onCancel={() => sonnerToast.dismiss(toastId)}
        />
      ),
      icon: null,
    });
  },
};
