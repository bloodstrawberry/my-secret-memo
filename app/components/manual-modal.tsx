"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '80vw', height: '80vh' }}
              className="relative bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-slate-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Icon icon="mdi:help-circle-outline" className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] uppercase">User Manual</h2>
                    <p className="text-xs text-cyan-500 font-bold tracking-widest opacity-80 mt-0.5">LEARN HOW TO USE NEXT NOTEPAD</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-slate-500/10 rounded-full transition-all text-[var(--foreground)] opacity-30 hover:opacity-100 hover:rotate-90 duration-300"
                >
                  <Icon icon="mdi:close" className="w-8 h-8" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xl font-bold mb-4 text-cyan-500 flex items-center gap-3">
                        <Icon icon="mdi:rocket-launch-outline" className="w-6 h-6" />
                        Getting Started
                      </h3>
                      <p className="text-base opacity-70 leading-relaxed">
                        Next Notepad is a high-performance, private notepad application built for speed and security. 
                        Your data is stored locally in your browser's IndexedDB and never leaves your machine unless you choose to download or sync it.
                      </p>
                    </section>

                    <section className="p-8 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                      <h3 className="text-sm font-bold mb-4 text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Icon icon="mdi:dock-window" />
                        Dockview Layout System
                      </h3>
                      <p className="text-sm opacity-70 leading-relaxed mb-4">
                        Our workspace uses a professional-grade docking system. You can:
                      </p>
                      <ul className="space-y-2 text-sm opacity-60">
                        <li className="flex items-center gap-2">
                          <Icon icon="mdi:check-circle-outline" className="text-cyan-500" />
                          Drag tabs to rearrange or split views
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon icon="mdi:check-circle-outline" className="text-cyan-500" />
                          Double-click tabs to maximize
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon icon="mdi:check-circle-outline" className="text-cyan-500" />
                          Save your custom layout automatically
                        </li>
                      </ul>
                    </section>
                  </div>

                  <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-8 rounded-xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-3 text-red-500">
                          <Icon icon="mdi:lock-outline" className="w-6 h-6" />
                          Military-Grade Security
                        </h4>
                        <p className="text-sm opacity-60 leading-relaxed">
                          Click the lock icon in the header to encrypt your current session. 
                          For maximum privacy, enable <strong>Auto-Lock</strong> in the editor settings. 
                          This ensures your data is always encrypted at rest.
                        </p>
                      </div>

                      <div className="p-8 rounded-xl bg-amber-500/5 border border-amber-500/10 group hover:bg-amber-500/10 transition-colors">
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-3 text-amber-500">
                          <Icon icon="mdi:history" className="w-6 h-6" />
                          Snapshot History
                        </h4>
                        <p className="text-sm opacity-60 leading-relaxed">
                          We take automatic snapshots of your work. Click the calendar icon to browse previous versions of your memos. 
                          You can restore any day's data with a single click.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
