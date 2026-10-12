import React from "react";
import LanguageSelector from "./LanguageSelector.jsx";
import { FaCompress, FaExpand, FaPalette } from "react-icons/fa";

export const EditorTopBar = ({
  language,
  onLanguageChange,
  title = "Solution Workspace // Tab=Indent",
  isFullscreen = false,
  onToggleFullscreen,
  syntaxHighlight = true,
  onToggleSyntax
}) => {
  return (
    <div className="p-2.5 sm:p-3 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0 flex-wrap gap-2">
      <div className="flex items-center gap-3">
        {/* Terminal Window Dots */}
        <div className="flex gap-1.5 ml-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50 border border-orange-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50 border border-green-500/80"></div>
        </div>
        {/* Workspace Title */}
        <span className="text-[11px] font-mono text-gray-300 uppercase tracking-widest hidden md:inline font-semibold">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* SYNTAX HIGHLIGHTING TOGGLE (IF PROVIDED) */}
        {onToggleSyntax && (
          <button
            type="button"
            onClick={onToggleSyntax}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition cursor-pointer ${
              syntaxHighlight
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25"
                : "bg-white/5 border-white/20 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={syntaxHighlight ? "Switch to Direct Text Mode" : "Switch to Syntax Highlight Mode"}
          >
            <FaPalette className={syntaxHighlight ? "text-cyan-400 text-xs" : "text-gray-400 text-xs"} />
            <span className="hidden sm:inline">
              {syntaxHighlight ? "Syntax: On" : "Direct Text"}
            </span>
          </button>
        )}

        {/* FULLSCREEN / NORMAL MODE TOGGLE (IF PROVIDED) */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/15 text-gray-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
            title={isFullscreen ? "Exit Fullscreen (Normal Mode)" : "Enter Fullscreen Mode"}
          >
            {isFullscreen ? (
              <>
                <FaCompress className="text-orange-400 text-xs" />
                <span>Normal Mode</span>
              </>
            ) : (
              <>
                <FaExpand className="text-orange-400 text-xs" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        )}

        <LanguageSelector selectedLanguage={language} onChange={onLanguageChange} />
      </div>
    </div>
  );
};

export default EditorTopBar;
