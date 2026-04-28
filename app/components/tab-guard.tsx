"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";

/**
 * TabGuard Component
 * Prevents multiple tabs from being open simultaneously to avoid data sync issues.
 * Uses BroadcastChannel for cross-tab communication.
 */
export function TabGuard() {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const isDuplicateRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel("my_secret_memo_tab_sync");
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "PING_EXISTING_TAB") {
        if (!isDuplicateRef.current) {
          channel.postMessage("PONG_EXISTING_TAB");
        }
      } else if (event.data === "PONG_EXISTING_TAB") {
        setIsDuplicate(true);
        isDuplicateRef.current = true;
        // Set global flag to stop other sync processes
        (window as any).__isDuplicateTab = true;
        window.dispatchEvent(new Event('duplicate-tab-detected'));
      }
    };

    channel.addEventListener("message", handleMessage);
    channel.postMessage("PING_EXISTING_TAB");

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  if (!isDuplicate) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-[#64748b]/80 backdrop-blur-sm animate-in fade-in duration-500" 
      />
      
      {/* Modal Container - Slightly reduced width as font is smaller */}
      <div className="relative w-full max-w-[580px] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out">
        <div className="p-10 text-center flex flex-col items-center">
          
          {/* Icon Header (Slightly smaller) */}
          <div className="w-20 h-20 rounded-full bg-[#fff0f0] flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#ff3b3b] flex items-center justify-center shadow-lg shadow-red-500/20">
              <Icon icon="material-symbols:error-rounded" className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Text Content - Reduced font sizes */}
          <div className="space-y-5 mb-10 whitespace-nowrap">
            <h2 className="text-[28px] font-black tracking-tight text-[#1a1f36] leading-tight">
              이미 페이지가 열려 있습니다
            </h2>
            <div className="space-y-1.5 text-[#8e9aaf] font-medium leading-relaxed">
              <p className="text-[15px]">
                안전한 데이터 동기화를 위해 <span className="text-[#ff5252] font-bold">한 번에 하나의 페이지만</span> 사용할 수 있습니다.
              </p>
              <p className="text-[15px]">
                데이터 손실을 방지하기 위해 이 페이지를 종료합니다.
              </p>
            </div>
          </div>

          {/* Action Button - Reduced height and font size */}
          <button
            onClick={() => {
              // Try standard close
              window.close();
              
              // Redirect to blank page if close fails (as requested)
              try {
                const win = window.open("about:blank", "_self");
                if (win) win.close();
              } catch (e) {
                console.error("Close failed", e);
              }

              // Fallback if still open
              setTimeout(() => {
                const btn = document.getElementById('close-tab-btn');
                if (btn) {
                  btn.innerHTML = `<span>탭을 직접 닫아주세요</span>`;
                  btn.classList.add('opacity-80', 'cursor-not-allowed');
                }
              }, 500);
            }}
            id="close-tab-btn"
            className="w-full h-16 flex items-center justify-center gap-2 bg-[#ff3232] hover:bg-[#e62e2e] text-white font-black text-xl rounded-[24px] transition-all active:scale-[0.97] shadow-xl shadow-red-500/25"
          >
            <Icon icon="material-symbols:close-rounded" className="w-7 h-7" />
            <span>종료하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
