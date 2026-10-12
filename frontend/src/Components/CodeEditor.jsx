import React, { useRef, useMemo, useLayoutEffect } from "react";
import { highlightCode } from "../utils/syntaxHighlighter.js";
import { handleEditorKeyDown } from "../utils/editorUtils.js";

/**
 * Premium IDE Code Editor with Syntax Color Highlighting & Caret Synchronization:
 * - Data Types: Cyan / Sky Blue
 * - Functions: Bright Yellow
 * - Keywords: Purple
 * - Strings: Emerald Green
 * - Numbers: Orange
 * - Comments: Muted Slate Gray (Italic)
 * - Built-ins: Rose Red
 * - Synchronous cursor tracking to eliminate React 19 caret reset bug
 * - High-contrast selection visibility & optional Direct Text Mode
 */
const CodeEditor = ({
  value = "",
  onChange,
  language = "python",
  placeholder = "Write your algorithmic solution here...",
  className = "",
  onPaste,
  onCopy,
  readOnly = false,
  syntaxHighlight = true
}) => {
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineGutterRef = useRef(null);
  const selectionRef = useRef(null);

  // Synchronously restore cursor position immediately after React updates DOM
  useLayoutEffect(() => {
    if (selectionRef.current && textareaRef.current) {
      const { start, end } = selectionRef.current;
      textareaRef.current.setSelectionRange(start, end);
      selectionRef.current = null;
    }
  }, [value]);

  const setCursor = (start, end = start) => {
    selectionRef.current = { start, end };
  };

  const handleChange = (e) => {
    const target = e.target;
    selectionRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd
    };
    if (onChange) {
      onChange(target.value);
    }
  };

  // Memoize highlighted HTML to maximize typing responsiveness
  const highlightedHtml = useMemo(() => {
    return highlightCode(value, language);
  }, [value, language]);

  // Compute line numbers based on line breaks
  const lines = useMemo(() => {
    const count = (value || "").split("\n").length;
    return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
  }, [value]);

  // Synchronize scroll offsets between textarea, syntax layer, and line number gutter
  const handleScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    handleEditorKeyDown(e, value, onChange, setCursor);
  };

  // Standardized font styles shared strictly between PRE and TEXTAREA
  const editorFontStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "13px",
    lineHeight: "24px",
    letterSpacing: "0px",
    tabSize: 4,
    MozTabSize: 4
  };

  return (
    <div
      className={`relative w-full h-full flex bg-[#050b10] font-mono text-xs sm:text-sm overflow-hidden select-text ${className}`}
    >
      {/* LINE NUMBERS GUTTER */}
      <div
        ref={lineGutterRef}
        aria-hidden="true"
        className="w-10 sm:w-12 py-4 bg-[#03070b]/90 border-r border-white/5 select-none overflow-hidden shrink-0 text-right pr-2.5 text-gray-500 font-mono text-xs leading-[24px]"
        style={{
          fontFamily: editorFontStyle.fontFamily,
          lineHeight: editorFontStyle.lineHeight
        }}
      >
        {lines.map((num) => (
          <div key={num} className="h-[24px] leading-[24px]">
            {num}
          </div>
        ))}
      </div>

      {/* DUAL-LAYER CODE WORKSPACE */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* SYNTAX HIGHLIGHTED PRE LAYER (LAYER 0 - UNDERNEATH) */}
        {syntaxHighlight && (
          <pre
            ref={preRef}
            aria-hidden="true"
            className="code-editor-pre absolute inset-0 m-0 p-4 whitespace-pre overflow-hidden pointer-events-none text-white font-medium"
            style={{
              ...editorFontStyle,
              margin: 0,
              border: 0,
              boxSizing: "border-box"
            }}
            dangerouslySetInnerHTML={{
              __html: highlightedHtml + (value.endsWith("\n") ? "\n " : "")
            }}
          />
        )}

        {/* INTERACTIVE TEXTAREA (LAYER 1 - ON TOP) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onPaste={onPaste}
          onCopy={onCopy}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          className={`code-editor-textarea absolute inset-0 w-full h-full m-0 p-4 whitespace-pre caret-orange-400 bg-transparent resize-none outline-none border-none overflow-auto custom-scrollbar selection:bg-orange-500/40 selection:text-white placeholder:text-gray-600 font-medium ${
            syntaxHighlight ? "text-transparent" : "text-gray-100"
          }`}
          style={{
            ...editorFontStyle,
            margin: 0,
            border: 0,
            boxSizing: "border-box"
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;

