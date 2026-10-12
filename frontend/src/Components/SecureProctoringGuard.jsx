import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaShieldAlt, FaExpand, FaExclamationTriangle, FaLock, FaBan } from "react-icons/fa";

/**
 * STRICT_FULLSCREEN_LOCKDOWN Flag:
 * Fullscreen is strictly mandatory.
 * Exiting fullscreen immediately terminates the session, deletes saved code, and forfeits the attempt.
 */
export const STRICT_FULLSCREEN_LOCKDOWN = true;

export const useSecureProctoring = ({
  onTerminate,
  enabled = true,
  environmentName = "Coding Arena"
}) => {
  const isLockdownActive = enabled && STRICT_FULLSCREEN_LOCKDOWN;
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const hasEnteredFullscreenOnceRef = useRef(Boolean(document.fullscreenElement));

  const isTerminatingRef = useRef(false);
  const keystrokeHistoryRef = useRef([]);
  const onTerminateRef = useRef(onTerminate);

  useEffect(() => {
    onTerminateRef.current = onTerminate;
  }, [onTerminate]);

  // Terminate session for verified integrity violations
  const triggerViolation = useCallback((reason) => {
    if (!isLockdownActive || isTerminatingRef.current) return;
    isTerminatingRef.current = true;

    // Clear clipboard safely
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("").catch(() => {});
      }
    } catch (e) {}

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (onTerminateRef.current) {
      onTerminateRef.current(reason);
    }
  }, [isLockdownActive]);

  // Request fullscreen wrapper
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      hasEnteredFullscreenOnceRef.current = true;
    } catch (err) {
      console.warn("Fullscreen permission or activation required:", err);
    }
  }, []);

  // Exit fullscreen wrapper (restores normal windowed mode)
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn("Exit fullscreen error:", err);
    }
  }, []);

  // Handle Fullscreen state change & proctoring guard listeners
  useEffect(() => {
    if (!isLockdownActive) return;

    // Try auto-fullscreen on mount if user gesture allows
    enterFullscreen().catch(() => {});

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (active) {
        hasEnteredFullscreenOnceRef.current = true;
      }
      // Note: When fullscreen is exited (active === false), do NOT terminate or forfeit the battle.
      // The FullscreenGatewayModal overlay will display and prompt the user to re-enter fullscreen
      // without losing code or ending the battle.
    };

    // Tab switch or minimize notification
    const handleVisibilityChange = () => {
      if (document.hidden && hasEnteredFullscreenOnceRef.current && !isTerminatingRef.current) {
        console.warn("Visibility change detected during active session");
      }
    };

    // Anti-Screenshot, Anti-Inspect, Anti-Shortcut & Anti-Autotyper
    const handleKeyDown = (e) => {
      if (isTerminatingRef.current) return;

      // 0. Detect automated script / untrusted event
      if (e.isTrusted === false) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation("Automated synthetic script event detected");
        return;
      }

      // Autotyper detection: track keystroke frequency
      const now = Date.now();
      keystrokeHistoryRef.current.push(now);
      keystrokeHistoryRef.current = keystrokeHistoryRef.current.filter(t => now - t <= 400);
      if (keystrokeHistoryRef.current.length > 25) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation("Autotyper / Automated typing script detected");
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Screenshot key (PrintScreen)
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("").catch(() => {});
          }
        } catch (err) {}
        triggerViolation("Screenshot capture attempted (PrintScreen detected)");
        return;
      }

      // 2. Snipping Tool shortcuts (Win+Shift+S / Cmd+Shift+4)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "4" || e.key === "3")) {
        e.preventDefault();
        triggerViolation("Screen capture tool shortcut triggered");
        return;
      }

      // 3. DevTools / Inspection Keys (F12, Ctrl+Shift+I, etc.)
      if (
        e.key === "F12" ||
        (cmdOrCtrl && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (cmdOrCtrl && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
        triggerViolation("Inspection or Developer Tools shortcut detected");
        return;
      }

      // 4. Save / Print shortcuts
      if (cmdOrCtrl && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return;
      }

      // 5. Copy / Cut (Ctrl+C, Ctrl+X) - Strictly blocked
      if (cmdOrCtrl && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")) {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("").catch(() => {});
          }
        } catch (err) {}
        return;
      }

      // 6. Paste (Ctrl+V) - Strictly blocked
      if (cmdOrCtrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        triggerViolation("Clipboard paste shortcut (Ctrl+V) is strictly prohibited");
        return;
      }
    };

    // Block Copy
    const handleCopy = (e) => {
      e.preventDefault();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      } catch (err) {}
    };

    // Block Cut
    const handleCut = (e) => {
      e.preventDefault();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      } catch (err) {}
    };

    // Block Paste
    const handlePaste = (e) => {
      e.preventDefault();
      triggerViolation("Clipboard paste event detected - manual coding required");
    };

    // Block Context Menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [isLockdownActive, enterFullscreen, triggerViolation]);

  return {
    isFullscreen,
    hasEnteredFullscreenOnce: hasEnteredFullscreenOnceRef.current,
    enterFullscreen,
    exitFullscreen,
    triggerViolation
  };
};

/**
 * SkillrackSecurityModal / FullscreenGatewayModal Component
 * Displays the initial Fullscreen Gateway modal (strictly fullscreen, no normal mode).
 */
export const SkillrackSecurityModal = ({
  isFullscreen,
  onEnterFullscreen,
  environmentName = "Coding Arena"
}) => {
  if (!STRICT_FULLSCREEN_LOCKDOWN) return null;

  // Initial Fullscreen Gateway (if user hasn't entered fullscreen yet)
  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#03070b]/98 backdrop-blur-xl flex items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-[#0a1118] border-2 border-orange-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(249,115,22,0.3)] animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-400 text-3xl mx-auto mb-4 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <FaShieldAlt />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold uppercase tracking-widest mb-3">
            Strict Fullscreen Lockdown
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
            Fullscreen Required
          </h2>

          <p className="text-xs text-gray-300 font-mono leading-relaxed mb-6">
            To code in <span className="text-orange-400 font-bold">{environmentName}</span>, full-screen mode is strictly mandatory.
          </p>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-left font-mono text-xs space-y-2 mb-6 text-gray-300">
            <div className="flex items-start gap-2 text-white font-bold">
              <FaLock className="text-orange-400 mt-0.5 shrink-0" />
              <span>Strict Single-Attempt Rules:</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-gray-400">
              <FaBan className="text-red-400 mt-0.5 shrink-0" />
              <span>Copy, Paste, Cut, and dev-tools shortcuts are prohibited.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-amber-400 font-bold">
              <FaExclamationTriangle className="text-amber-400 mt-0.5 shrink-0" />
              <span>Fullscreen mode must remain active while coding. Click below to enter fullscreen and continue.</span>
            </div>
          </div>

          <button
            onClick={onEnterFullscreen}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black font-mono text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <FaExpand /> Enter Fullscreen Environment
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Backwards-compatible alias
export const FullscreenGatewayModal = SkillrackSecurityModal;

export default useSecureProctoring;
