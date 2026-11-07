
import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";

import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

import { oneDark } from "@codemirror/theme-one-dark";
import {
  autocompletion,
  closeBrackets
} from "@codemirror/autocomplete";

import {
  bracketMatching,
  indentUnit
} from "@codemirror/language";

import { EditorView } from "@codemirror/view";

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff",
    color: "#242424"
  },
  ".cm-gutters": {
    backgroundColor: "#f3f4f6",
    color: "#858585",
    border: "none"
  },
  ".cm-activeLine": {
    backgroundColor: "#eef2ff"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#e5e7eb"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#7c3aed"
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "#c4b5fd"
  }
}, { dark: false });

const themes = {
  dark: oneDark,
  light: lightTheme
};

function getLanguage(language = "html") {
  const lang = String(language).toLowerCase();

  if (lang === "css") return css();
  if (["js", "javascript", "jsx"].includes(lang)) {
    return javascript({ jsx: true });
  }
  if (lang === "json") return json();
  if (["html", "xml"].includes(lang)) return html();

  return [];
}

export default function CodeEditor({
  height = "100%",
  language = "html",
  value = "",
  onChange,
  theme = "dark",
  options = {}
}) {
  const extensions = useMemo(() => {
    const list = [
      getLanguage(language),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      indentUnit.of("  ")
    ];

    if (options.wordWrap === "on" || options.wordWrap === true) {
      list.push(EditorView.lineWrapping);
    }

    return list;
  }, [language, options.wordWrap]);

  return (
    <div className="evora-codemirror">
      <CodeMirror
        value={value}
        height={height}
        theme={themes[theme] || oneDark}
        extensions={extensions}
        onChange={(nextValue) => onChange?.(nextValue)}
        readOnly={Boolean(options.readOnly)}
        basicSetup={{
          lineNumbers: options.lineNumbers !== false,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          tabSize: 2
        }}
      />
    </div>
  );
}
