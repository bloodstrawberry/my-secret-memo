"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { Icon } from "@iconify/react";
import { useState } from "react";

const SecurePromptContent = ({ 
  options, 
  onConfirm, 
  toastId 
}: { 
  options?: { placeholder?: string; confirmText?: string; cancelText?: string }; 
  onConfirm: (value: string) => void; 
  toastId: string | number; 
}) => {
  const [currentValue, setCurrentValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-4 mt-3 w-full">
      <div className="relative flex items-center group">
        <Icon icon="material-symbols:lock-outline" className="absolute left-3 w-4 h-4 text-rose-500 opacity-60 group-focus-within:opacity-100 transition-opacity z-10" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder={options?.placeholder || "암호화 키를 입력하세요..."}
          className="w-full pl-9 pr-10 py-2.5 bg-rose-500/5 !border-rose-500/30 rounded-xl !outline-none focus:!outline-none focus-visible:!outline-none focus:!ring-2 focus:!ring-rose-500/50 focus:!border-rose-500 text-sm transition-all shadow-inner font-mono tracking-widest text-[var(--foreground)] selection:bg-rose-500/30"
          autoFocus
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onConfirm(currentValue);
              sonnerToast.dismiss(toastId);
            }
            if (e.key === "Escape") {
              sonnerToast.dismiss(toastId);
            }
          }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2.5 p-1 rounded-md hover:bg-rose-500/10 text-rose-500/60 hover:text-rose-500 transition-colors z-10 !outline-none focus:!outline-none focus:!ring-0"
          title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
        >
          <Icon icon={showPassword ? "material-symbols:visibility-off-outline" : "material-symbols:visibility-outline"} className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => sonnerToast.dismiss(toastId)}
          className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-500/10 transition-colors text-slate-500 !outline-none focus:!outline-none focus:!ring-0"
        >
          {options?.cancelText || "취소"}
        </button>
        <button
          onClick={() => {
            onConfirm(currentValue);
            sonnerToast.dismiss(toastId);
          }}
          className="px-6 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-pink-700 transition-all active:scale-95 !outline-none focus:!outline-none focus:!ring-0"
        >
          {options?.confirmText || "확인"}
        </button>
      </div>
    </div>
  );
};

export const Toaster = () => {
  return (
    <>
      <SonnerToaster
        position="top-center"
        expand={false}
        richColors
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
          min-width: 320px !important;
          padding: 16px 20px !important;
          font-size: 14px !important;
          white-space: nowrap !important;
          margin-left: auto !important;
          margin-right: auto !important;
          border-radius: 16px !important;
          align-items: center !important;
        }
        [data-sonner-toast] [data-content] {
          flex: 1 !important;
          width: 100% !important;
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
  confirm: (message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string }) => {
    sonnerToast(message, {
      closeButton: false,
      duration: Infinity,
      action: {
        label: options?.confirmText || "확인",
        onClick: onConfirm,
      },
      cancel: {
        label: options?.cancelText || "취소",
        onClick: () => {},
      },
      icon: <Icon icon="material-symbols:help-outline" className="w-5 h-5 text-cyan-500" />,
    });
  },
  // Custom prompt toast
  prompt: (message: string, onConfirm: (value: string) => void, options?: { placeholder?: string; confirmText?: string; cancelText?: string }) => {
    let currentValue = "";
    const toastId = sonnerToast(message, {
      duration: Infinity,
      description: (
        <div className="flex flex-col gap-4 mt-3 w-full">
          <div className="relative flex items-center group">
            <Icon icon="material-symbols:link" className="absolute left-3 w-4 h-4 text-cyan-500 opacity-60 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              placeholder={options?.placeholder || "내용을 입력하세요..."}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-500/5 border border-[var(--border-color)] rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-sm transition-all shadow-inner"
              autoFocus
              onChange={(e) => currentValue = e.target.value}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onConfirm(currentValue);
                  sonnerToast.dismiss(toastId);
                }
                if (e.key === "Escape") {
                  sonnerToast.dismiss(toastId);
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => sonnerToast.dismiss(toastId)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-500/10 transition-colors text-slate-500"
            >
              {options?.cancelText || "취소"}
            </button>
            <button
              onClick={() => {
                onConfirm(currentValue);
                sonnerToast.dismiss(toastId);
              }}
              className="px-6 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all active:scale-95"
            >
              {options?.confirmText || "확인"}
            </button>
          </div>
        </div>
      ),
      // We use our own buttons in description for full layout control
      icon: null, 
    });
  },
  // Secure prompt for passwords/encryption
  securePrompt: (message: string, onConfirm: (value: string) => void, options?: { placeholder?: string; confirmText?: string; cancelText?: string }) => {
    const toastId = "secure-prompt-" + Date.now();
    sonnerToast(message, {
      id: toastId,
      duration: Infinity,
      description: <SecurePromptContent options={options} onConfirm={onConfirm} toastId={toastId} />,
      icon: null,
    });
  }
};
