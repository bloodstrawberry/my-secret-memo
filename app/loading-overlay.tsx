"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLoadingOverlay } from "./loading-overlay-store";

export default function LoadingOverlay() {
  const { isLoading, message } = useLoadingOverlay();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="loading-overlay"
        >
          {/* Glassmorphism backdrop */}
          <motion.div
            className="loading-overlay__backdrop"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
          />

          {/* Content */}
          <motion.div
            className="loading-overlay__content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Outer glow ring */}
            <div className="loading-overlay__glow" />

            {/* Spinner */}
            <div className="loading-overlay__spinner">
              <svg viewBox="0 0 50 50" className="loading-overlay__svg">
                <circle
                  className="loading-overlay__track"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="3"
                />
                <circle
                  className="loading-overlay__progress"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center dot pulse */}
              <div className="loading-overlay__pulse" />
            </div>

            {/* Message */}
            {message && (
              <motion.p
                className="loading-overlay__message"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
