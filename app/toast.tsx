"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { Icon } from "@iconify/react";

export const Toaster = () => {
  return (
    <>
      <SonnerToaster
        position="top-center"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          className: "border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--foreground)] rounded-xl shadow-2xl backdrop-blur-xl",
          style: {
            fontFamily: "var(--font-geist-sans), sans-serif",
          },
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
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
          min-width: 350px !important;
          white-space: nowrap !important;
          padding: 12px 20px !important;
          font-size: 13px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        [data-sonner-toast] [data-title] {
          white-space: nowrap !important;
          text-align: center !important;
          flex: 1 !important;
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
  }
};
