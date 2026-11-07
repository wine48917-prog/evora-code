
import React, { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Code2,
  Play,
  Save,
  Download,
  Plus,
  Trash2,
  Folder,
  FileCode2,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Menu,
  X,
  Palette,
  ExternalLink,
  ChevronDown
} from "lucide-react";

import CodeEditor from "./CodeEditor.jsx";

const STORAGE_KEY = "evora-code-v2-files";
const THEME_KEY = "evora-code-v2-theme";

const initialFiles = {
  "index.html": `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My EVORA Project</title>
</head>
<body>
  <main class="container">
    <h1>مرحباً بك في EVORA CODE 🍷</h1>
    <p>ابدأ ببناء موقعك الأول.</p>
    <button onclick="showMessage()">اضغط هنا</button>
  </main>
</body>
</html>`,
  "style.css": `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  color: #222;
}

.container {
  max-width: 800px;
  margin: 80px auto;
  padding: 30px;
  text-align: center;
}

button {
  border: 0;
  padding: 12px 24px;
  border-radius: 8px;
  background: #713d58;
  color: white;
  cursor: pointer;
}`,
  "script.js": `function showMessage() {
  alert("Your project is running with EVORA CODE!");
}`,
  "data.json": `{
  "name": "EVORA CODE",
  "version": "2.0"
}`
};

const languageFromName = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();

  if (ext === "html" || ext === "htm") return "html";
  if (ext === "css") return "css";
  if (["js", "jsx", "mjs"].includes(ext)) return "javascript";
  if (ext === "json") return "json";

  return "html";
};

function readSavedFiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialFiles;

    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : initialFiles;
  } catch {
    return initialFiles;
  }
}

function makePage(files, pageName = "index.html") {
  const htmlFile =
    files[pageName] !== undefined
      ? files[pageName]
      : files["index.html"] || "<h1>EVORA CODE</h1>";

  const cssCode = files["style.css"] || "";
  const jsCode = files["script.js"] || "";

  const safeCss = cssCode.replace(/<\/style/gi, "<\\/style");
  const safeJs = jsCode.replace(/<\/script/gi, "<\\/script");

  let page = htmlFile;

  page = page.replace(
    /<link\b[^>]*href=["']style\.css["'][^>]*>/gi,
    ""
  );

  page = page.replace(
    /<script\b[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/gi,
    ""
  );

  const styleTag = `<style>${safeCss}</style>`;
  const scriptTag = `<script>${safeJs}<\/script>`;

  if (/<\/head>/i.test(page)) {
    page = page.replace(/<\/head>/i, `${styleTag}</head>`);
  } else {
    page = `${styleTag}${page}`;
  }

  if (/<\/body>/i.test(page)) {
    page = page.replace(/<\/body>/i, `${scriptTag}</body>`);
  } else {
    page += scriptTag;
  }

  return page;
}

function Runner() {
  const [files, setFiles] = useState({});
  const [page, setPage] = useState("index.html");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setFiles(readSavedFiles());
  }, []);

  const htmlFiles = Object.keys(files).filter((name) =>
    /\.(html|htm)$/i.test(name)
  );

  const currentPage = htmlFiles.includes(page)
    ? page
    : htmlFiles[0] || "index.html";

  const srcDoc = useMemo(
    () => makePage(files, currentPage),
    [files, currentPage, refreshKey]
  );

  return (
    <div className="runner-page">
      <header className="runner-topbar">
        <button
          className="icon-btn"
          onClick={() => window.location.href = window.location.pathname}
          title="Back to editor"
        >
          <Code2 size={18} />
        </button>

        <div className="runner-brand">
          <span className="logo">{"</>"}</span>
          <strong>EVORA CODE</strong>
          <small>LIVE PREVIEW</small>
        </div>

        <div className="runner-controls">
          <select
            value={currentPage}
            onChange={(e) => setPage(e.target.value)}
          >
            {htmlFiles.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <button
            className="primary-btn"
            onClick={() => setRefreshKey((v) => v + 1)}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </header>

      <main className="runner-content">
        <iframe
          key={currentPage}
          title="EVORA Project Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        />
      </main>

      <footer className="runner-footer">
        <span>DEV BY VELOR</span>
        <span>© 2026 WINE 🍷 — All Rights Reserved.</span>
      </footer>
    </div>
  );
}

function Workspace() {
  const [files, setFiles] = useState(readSavedFiles);
  const [activeFile, setActiveFile] = useState("index.html");
  const [openFiles, setOpenFiles] = useState(["index.html", "style.css", "script.js"]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "dark";
  });

  const [previewMode, setPreviewMode] = useState("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState("editor");
  const [output, setOutput] = useState("Welcome to EVORA CODE V2.");
  const [lastSaved, setLastSaved] = useState("Saved locally");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    setLastSaved("Saved locally");
  }, [files]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const activeLanguage = languageFromName(activeFile);

  const htmlFiles = useMemo(
    () => Object.keys(files).filter((name) => /\.(html|htm)$/i.test(name)),
    [files]
  );

  const previewHtml = useMemo(
    () => makePage(files, htmlFiles.includes(activeFile) ? activeFile : "index.html"),
    [files, activeFile, htmlFiles]
  );

  const updateCode = useCallback((value) => {
    setFiles((old) => ({
      ...old,
      [activeFile]: value
    }));
    setLastSaved("Saving...");
  }, [activeFile]);

  function openFile(name) {
    setActiveFile(name);
    setOpenFiles((old) =>
      old.includes(name) ? old : [...old, name]
    );
    setShowSidebar(false);
    setShowMobilePanel("editor");
  }

  function closeTab(name) {
    const next = openFiles.filter((file) => file !== name);
    setOpenFiles(next);

    if (activeFile === name && next.length) {
      setActiveFile(next[next.length - 1]);
    } else if (activeFile === name) {
      setActiveFile("");
    }
  }

  function createFile() {
    const name = window.prompt("Enter file name (example: about.html)");
    if (!name) return;

    const cleanName = name.trim();

    if (!/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(cleanName)) {
      alert("Please enter a valid file name with extension.");
      return;
    }

    if (files[cleanName] !== undefined) {
      alert("This file already exists.");
      return;
    }

    setFiles((old) => ({
      ...old,
      [cleanName]: ""
    }));

    openFile(cleanName);
    setOutput(`Created file: ${cleanName}`);
  }

  function deleteFile(name) {
    if (!window.confirm(`Delete ${name}?`)) return;

    const next = { ...files };
    delete next[name];

    setFiles(next);
    setOpenFiles((old) => old.filter((file) => file !== name));

    if (activeFile === name) {
      const remaining = Object.keys(next);
      setActiveFile(remaining[0] || "");
    }

    setOutput(`Deleted file: ${name}`);
  }

  function saveProject() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    setLastSaved("Saved successfully");
    setOutput("Project saved locally.");
  }

  function runProject() {
    if (!htmlFiles.length) {
      alert("Create an HTML file first.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));

    const url = `${window.location.origin}${window.location.pathname}?evora-run=1`;
    const opened = window.open(url, "_blank");

    if (!opened) {
      setOutput("Popup blocked. Allow popups to open your project.");
      alert("Allow popups in your browser, then try Run again.");
      return;
    }

    setOutput("Project opened in a separate preview page.");
  }

  function refreshPreview() {
    setShowPreview(false);
    requestAnimationFrame(() => setShowPreview(true));
  }

  async function exportProject() {
    try {
      const zip = new JSZip();

      Object.entries(files).forEach(([name, content]) => {
        zip.file(name, content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "evora-project.zip";
      link.click();

      URL.revokeObjectURL(url);
      setOutput("Project exported as ZIP.");
    } catch (error) {
      console.error(error);
      setOutput("Could not export project.");
    }
  }

  const themeOptions = [
    { id: "dark", label: "Dark" },
    { id: "light", label: "Light" }
  ];

  return (
    <div className={`app evora-app theme-${theme}`}>
      <div className="dev-credit">DEV BY VELOR</div>

      <header className="topbar">
        <button
          className="mobile-menu icon-btn"
          onClick={() => setShowSidebar((v) => !v)}
          aria-label="Toggle files"
        >
          {showSidebar ? <X size={19} /> : <Menu size={19} />}
        </button>

        <div className="brand">
          <div className="logo"><Code2 size={23} /></div>
          <div className="brand-text">
            <strong>EVORA CODE</strong>
            <small>WEB DEVELOPMENT STUDIO</small>
          </div>
        </div>

        <div className="actions">
          <div className="theme-picker">
            <button
              className="secondary-btn"
              onClick={() => setShowThemeMenu((v) => !v)}
            >
              <Palette size={16} />
              Theme
              <ChevronDown size={13} />
            </button>

            {showThemeMenu && (
              <div className="theme-menu">
                {themeOptions.map((item) => (
                  <button
                    key={item.id}
                    className={theme === item.id ? "selected" : ""}
                    onClick={() => {
                      setTheme(item.id);
                      setShowThemeMenu(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="secondary-btn save-btn" onClick={saveProject}>
            <Save size={16} />
            <span>Save</span>
          </button>

          <button className="secondary-btn export-btn" onClick={exportProject}>
            <Download size={16} />
            <span>Export</span>
          </button>

          <button className="primary-btn run-btn" onClick={runProject}>
            <Play size={16} fill="currentColor" />
            Run
          </button>
        </div>
      </header>

      <div className="mobile-toolbar">
        <button
          className={showMobilePanel === "files" ? "active" : ""}
          onClick={() => setShowSidebar((v) => !v)}
        >
          <Folder size={16} /> Files
        </button>

        <button
          className={showMobilePanel === "editor" ? "active" : ""}
          onClick={() => setShowMobilePanel("editor")}
        >
          <Code2 size={16} /> Editor
        </button>

        <button
          className={showMobilePanel === "preview" ? "active" : ""}
          onClick={() => setShowMobilePanel("preview")}
        >
          <Eye size={16} /> Preview
        </button>

        <button onClick={runProject}>
          <Play size={16} /> Run
        </button>
      </div>

      <main className="workspace">
        <aside className={`sidebar ${showSidebar ? "sidebar-open" : ""}`}>
          <div className="side-title">
            <span>EXPLORER</span>
            <button className="icon-btn" onClick={createFile} title="New file">
              <Plus size={17} />
            </button>
          </div>

          <div className="project-name">
            <ChevronDown size={14} />
            <Folder size={15} />
            EVORA PROJECT
          </div>

          <div className="file-list">
            {Object.keys(files).map((name) => (
              <div
                key={name}
                className={`file ${activeFile === name ? "active" : ""}`}
              >
                <button
                  className="file-open"
                  onClick={() => openFile(name)}
                >
                  <FileCode2 size={15} />
                  <span>{name}</span>
                </button>

                <button
                  className="file-delete"
                  onClick={() => deleteFile(name)}
                  title="Delete file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button className="new-file" onClick={createFile}>
            <Plus size={15} /> New File
          </button>

          <div className="sidebar-bottom">
            <div className="sidebar-version">EVORA CODE V2.0</div>
            <div>© WINE 🍷</div>
          </div>
        </aside>

        <section className="main">
          <div className="tabs">
            <div className="tab-list">
              {openFiles.map((name) => (
                <div
                  key={name}
                  className={`tab ${activeFile === name ? "active" : ""}`}
                >
                  <button onClick={() => openFile(name)}>
                    <FileCode2 size={14} />
                    {name}
                  </button>
                  <button
                    className="tab-close"
                    onClick={() => closeTab(name)}
                    aria-label={`Close ${name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="editor-actions">
              <span>{activeLanguage.toUpperCase()}</span>
            </div>
          </div>

          <div className="mobile-editor-view" style={{
            display: showMobilePanel === "editor" ? "flex" : "none"
          }}>
            {activeFile ? (
              <div className="editor">
                <CodeEditor
                  key={activeFile}
                  height="100%"
                  language={activeLanguage}
                  value={files[activeFile] || ""}
                  onChange={updateCode}
                  theme={theme}
                  options={{
                    lineNumbers: true,
                    wordWrap: "on"
                  }}
                />
              </div>
            ) : (
              <div className="welcome">
                <Code2 size={45} />
                <h2>EVORA CODE</h2>
                <p>Select a file or create a new one to start coding.</p>
                <button className="primary-btn" onClick={createFile}>
                  <Plus size={16} /> Create File
                </button>
              </div>
            )}
          </div>

          <section
            className="preview-section"
            style={{
              display: showMobilePanel === "preview" ? "flex" : undefined
            }}
          >
            <div className="preview-header">
              <div className="preview-title">
                <Eye size={16} />
                LIVE PREVIEW
              </div>

              <div className="preview-tools">
                <button
                  className={previewMode === "desktop" ? "active" : ""}
                  onClick={() => setPreviewMode("desktop")}
                  title="Desktop"
                >
                  <Monitor size={15} />
                </button>

                <button
                  className={previewMode === "tablet" ? "active" : ""}
                  onClick={() => setPreviewMode("tablet")}
                  title="Tablet"
                >
                  <Tablet size={15} />
                </button>

                <button
                  className={previewMode === "mobile" ? "active" : ""}
                  onClick={() => setPreviewMode("mobile")}
                  title="Mobile"
                >
                  <Smartphone size={15} />
                </button>

                <button onClick={refreshPreview} title="Refresh preview">
                  <RefreshCw size={15} />
                </button>

                <button
                  onClick={() => setShowPreview((v) => !v)}
                  title="Toggle preview"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="preview-frame-wrap">
                <iframe
                  key={previewHtml}
                  title="EVORA Live Preview"
                  className={`preview-frame preview-${previewMode}`}
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                />
              </div>
            )}

            {!showPreview && (
              <div className="preview-placeholder">
                <Eye size={25} />
                <p>Preview is hidden</p>
                <button
                  className="secondary-btn"
                  onClick={() => setShowPreview(true)}
                >
                  Show Preview
                </button>
              </div>
            )}
          </section>

          <div className="bottom">
            <div className="panel-tabs">
              <span className="active">OUTPUT</span>
              <span>PROBLEMS</span>
            </div>
            <div className="output">{output}</div>
          </div>

          <footer className="status">
            <span>EVORA CODE</span>
            <span>{activeLanguage.toUpperCase()}</span>
            <span>{lastSaved}</span>
            <span>DEV BY VELOR</span>
          </footer>
        </section>
      </main>

      <footer className="app-footer">
        <span>DEV BY VELOR</span>
        <span>© 2026 WINE 🍷 — All Rights Reserved.</span>
      </footer>
    </div>
  );
}

export default function App() {
  const isRunner = new URLSearchParams(window.location.search).has("evora-run");

  return isRunner ? <Runner /> : <Workspace />;
                  }
                  
