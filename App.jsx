import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import JSZip from 'jszip'
import {
  Code2, Play, Save, Download, Plus, X,
  FileCode, Eye, Terminal, Monitor, Smartphone,
  Tablet, Trash2, ExternalLink, ArrowLeft,
  RefreshCw, FolderOpen, Menu, Check
} from 'lucide-react'

const STORAGE_KEY = 'evora-files'

const defaults = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My EVORA Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="hero">
    <span class="tag">WELCOME TO EVORA</span>
    <h1>Build Something <b>Great.</b></h1>
    <p>Your next project starts here.</p>
    <button id="start">Get Started</button>
  </main>
  <script src="script.js"></script>
</body>
</html>`,

  'style.css': `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: Arial, sans-serif;
  color: white;
  background: #100b0e;
}

.hero {
  text-align: center;
  padding: 40px;
}

.tag {
  color: #d46b8b;
  letter-spacing: 4px;
}

h1 {
  font-size: clamp(35px, 7vw, 70px);
}

h1 b {
  color: #c84e76;
}

p {
  color: #bbaab2;
}

button {
  padding: 14px 25px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: #922d50;
  cursor: pointer;
}`,

  'script.js': `document.querySelector('#start')
  ?.addEventListener('click', () => {
    alert('Welcome to EVORA CODE!')
  })`
}

function getLanguage(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  const languages = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    md: 'markdown',
    xml: 'xml',
    svg: 'xml',
    scss: 'scss',
    less: 'less',
    php: 'php',
    py: 'python',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml'
  }
  return languages[ext] || 'plaintext'
}

function makePage(files, pageName = 'index.html') {
  const page = files[pageName] ?? files['index.html'] ?? '<h1>Welcome</h1>'
  let html = page

  const css = files['style.css'] || ''
  const js = files['script.js'] || ''

  const styleTag =
    `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`

  const scriptTag =
    `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`

  // Use project CSS and JS directly from the editor.
  html = html.replace(
    /<link\b[^>]*href=["'](?:\.\/)?style\.css["'][^>]*>/gi,
    ''
  )

  html = html.replace(
    /<script\b[^>]*src=["'](?:\.\/)?script\.js["'][^>]*>\s*<\/script>/gi,
    ''
  )

  const routes = JSON.stringify(
    Object.keys(files).filter(name => /\.html?$/i.test(name))
  )

  const navigationScript = `
<script>
(function () {
  const projectPages = ${routes};
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(href)) return;

    const target = href.split(/[?#]/)[0].replace(/^\\.\\//, '');
    if (projectPages.includes(target)) {
      event.preventDefault();
      parent.postMessage({ type: 'EVORA_NAV', page: target }, '*');
    }
  });
})();
</script>`

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `${styleTag}</head>`)
  } else {
    html = `${styleTag}${html}`
  }

  if (/<\/body>/i.test(html)) {
    html = html.replace(
      /<\/body>/i,
      `${scriptTag}${navigationScript}</body>`
    )
  } else {
    html += scriptTag + navigationScript
  }

  return html
}

function Runner() {
  const [files, setFiles] = useState({})
  const [page, setPage] = useState('index.html')
  const [ready, setReady] = useState(false)
  const frameRef = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setFiles(saved && Object.keys(saved).length ? saved : defaults)
    } catch {
      setFiles(defaults)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== frameRef.current?.contentWindow) return
      if (event.data?.type !== 'EVORA_NAV') return

      const target = event.data.page
      if (files[target] !== undefined) {
        setPage(target)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [files])

  const pageContent = useMemo(
    () => makePage(files, page),
    [files, page]
  )

  if (!ready) {
    return <div className="runner-loading">Loading your website...</div>
  }

  return (
    <div className="runner">
      <div className="runner-bar">
        <button onClick={() => window.close()} title="Close preview">
          <ArrowLeft size={17} />
        </button>

        <div className="runner-address">
          <span className="runner-dot" />
          <span>{page}</span>
        </div>

        <button
          onClick={() => setPage('index.html')}
          title="Go to home page"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={() => window.location.href = '/'}
          title="Back to editor"
        >
          <Code2 size={17} />
        </button>
      </div>

      <iframe
        ref={frameRef}
        key={page}
        className="runner-frame"
        title="Your EVORA website"
        srcDoc={pageContent}
        sandbox="allow-scripts allow-forms allow-modals allow-popups"
      />
    </div>
  )
}

export default function App() {
  if (new URLSearchParams(window.location.search).has('evora-run')) {
    return <Runner />
  }

  return <Workspace />
}

function Workspace() {
  const [files, setFiles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return Object.keys(saved).length ? saved : defaults
    } catch {
      return defaults
    }
  })

  const [active, setActive] = useState('index.html')
  const [tabs, setTabs] = useState(['index.html', 'style.css', 'script.js'])
  const [device, setDevice] = useState('desktop')
  const [panel, setPanel] = useState('preview')
  const [mobileView, setMobileView] = useState('editor')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [message, setMessage] = useState('Ready')
  const [saved, setSaved] = useState(true)

  const editorRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    setSaved(true)
  }, [files])

  const previewHTML = useMemo(
    () => makePage(files, 'index.html'),
    [files]
  )

  function updateCode(value) {
    setFiles(prev => ({
      ...prev,
      [active]: value ?? ''
    }))
    setSaved(false)
  }

  function openFile(name) {
    setActive(name)
    setTabs(prev => prev.includes(name) ? prev : [...prev, name])
    setShowFiles(false)
    setMobileView('editor')
  }

  function createFile() {
    const name = newName.trim()

    if (!name) return
    if (files[name] !== undefined) {
      setMessage('This file already exists')
      return
    }

    setFiles(prev => ({ ...prev, [name]: '' }))
    setTabs(prev => [...prev, name])
    setActive(name)
    setNewName('')
    setAdding(false)
    setShowFiles(false)
    setMobileView('editor')
  }

  function deleteFile(name) {
    if (Object.keys(files).length <= 1) {
      setMessage('At least one file is required')
      return
    }

    if (!window.confirm(`Delete ${name}?`)) return

    const next = { ...files }
    delete next[name]

    setFiles(next)
    setTabs(prev => prev.filter(item => item !== name))

    if (active === name) {
      const nextName = Object.keys(next)[0]
      setActive(nextName)
    }

    setMessage(`${name} deleted`)
  }

  function closeTab(name) {
    const next = tabs.filter(item => item !== name)
    setTabs(next)

    if (active === name) {
      setActive(next[next.length - 1] || '')
    }
  }

  function saveProject() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    setSaved(true)
    setMessage('Project saved')
  }

  function runProject() {
    try {
      // Save before opening the independent website view.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files))

      const url = `${window.location.origin}/?evora-run=1`
      const opened = window.open(url, '_blank')

      if (!opened) {
        setMessage('Allow pop-ups to run your website')
        return
      }

      setMessage('Website opened in a new tab')
    } catch (error) {
      console.error(error)
      setMessage('Could not launch website')
    }
  }

  function refreshPreview() {
    setRefresh(value => value + 1)
    setMessage('Preview refreshed')
  }

  async function exportProject() {
    try {
      const zip = new JSZip()

      Object.entries(files).forEach(([name, content]) => {
        zip.file(name, content)
      })

      zip.file(
        'README.md',
        '# EVORA CODE Project\n\nCreated with EVORA CODE.\n\n© 2026 WINE 🍷 — All Rights Reserved.'
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'evora-code-project.zip'
      link.click()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('Project exported')
    } catch (error) {
      console.error(error)
      setMessage('Export failed')
    }
  }

  const deviceWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px'
  }[device]

  return (
    <div className="app">

      <header className="topbar">
        <div className="brand">
          <div className="logo"><Code2 size={21} /></div>
          <div className="brand-copy">
            <strong>EVORA <span>CODE</span></strong>
            <small>WEB DEVELOPMENT STUDIO</small>
          </div>
        </div>

        <div className="top-actions">
          <button className="action-button save-button" onClick={saveProject}>
            <Save size={15} />
            <span>Save</span>
          </button>

          <button className="action-button run-button" onClick={runProject}>
            <Play size={15} fill="currentColor" />
            <span>Run</span>
          </button>

          <button className="action-button export-button" onClick={exportProject}>
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="mobile-toolbar">
        <button
          className={mobileView === 'files' ? 'mobile-active' : ''}
          onClick={() => setShowFiles(!showFiles)}
        >
          <FolderOpen size={17} />
          Files
        </button>

        <button
          className={mobileView === 'editor' ? 'mobile-active' : ''}
          onClick={() => {
            setShowFiles(false)
            setMobileView('editor')
          }}
        >
          <Code2 size={17} />
          Editor
        </button>

        <button
          className={mobileView === 'preview' ? 'mobile-active' : ''}
          onClick={() => {
            setShowFiles(false)
            setMobileView('preview')
            setPanel('preview')
          }}
        >
          <Eye size={17} />
          Preview
        </button>

        <button onClick={runProject}>
          <Play size={17} />
          Run
        </button>
      </div>

      <div className="workspace">

        <aside className={`sidebar ${showFiles ? 'sidebar-open' : ''}`}>
          <div className="side-title">
            <span>EXPLORER</span>
            <button
              title="New file"
              onClick={() => setAdding(true)}
            >
              <Plus size={17} />
            </button>
          </div>

          <div className="project-name">
            <span>▾</span> EVORA PROJECT
          </div>

          {Object.keys(files).map(name => (
            <div
              key={name}
              className={`file ${active === name ? 'selected' : ''}`}
              onClick={() => openFile(name)}
            >
              <FileCode size={15} />
              <span className="file-name">{name}</span>
              <button
                title={`Delete ${name}`}
                onClick={event => {
                  event.stopPropagation()
                  deleteFile(name)
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {adding && (
            <div className="new-file">
              <input
                autoFocus
                placeholder="filename.html"
                value={newName}
                onChange={event => setNewName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') createFile()
                  if (event.key === 'Escape') setAdding(false)
                }}
              />
              <button onClick={createFile}><Check size={14} /></button>
              <button onClick={() => setAdding(false)}><X size={14} /></button>
            </div>
          )}

          <div className="sidebar-bottom">
            <span className="sidebar-status-dot" />
            Local project
          </div>
        </aside>

        {showFiles && (
          <button
            className="mobile-backdrop"
            aria-label="Close files"
            onClick={() => setShowFiles(false)}
          />
        )}

        <main className="main">

          <div className="tabs">
            {tabs.map(name => (
              <div
                key={name}
                className={`tab ${active === name ? 'active' : ''}`}
                onClick={() => {
                  setActive(name)
                  setMobileView('editor')
                }}
              >
                <FileCode size={14} />
                <span>{name}</span>
                <button
                  title="Close tab"
                  onClick={event => {
                    event.stopPropagation()
                    closeTab(name)
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <section className={`editor-area ${mobileView !== 'editor' ? 'mobile-hidden' : ''}`}>
            {active && files[active] !== undefined ? (
              <Editor
                height="100%"
                theme="vs-dark"
                path={active}
                language={getLanguage(active)}
                value={files[active]}
                onChange={updateCode}
                onMount={editor => { editorRef.current = editor }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  tabSize: 2,
                  padding: { top: 14 },
                  fontFamily: 'Consolas, "Courier New", monospace',
                  bracketPairColorization: { enabled: true },
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            ) : (
              <div className="welcome">
                <Code2 size={42} />
                <h2>EVORA CODE</h2>
                <p>Open a file to start coding.</p>
              </div>
            )}
          </section>

          <section className={`bottom ${mobileView !== 'preview' ? 'mobile-hidden' : ''}`}>
            <div className="panel-header">
              <div className="panel-tabs">
                <button
                  className={panel === 'preview' ? 'chosen' : ''}
                  onClick={() => setPanel('preview')}
                >
                  <Eye size={14} /> Preview
                </button>

                <button
                  className={panel === 'output' ? 'chosen' : ''}
                  onClick={() => setPanel('output')}
                >
                  <Terminal size={14} /> Output
                </button>
              </div>

              {panel === 'preview' && (
                <div className="preview-tools">
                  <button
                    className={device === 'desktop' ? 'device-active' : ''}
                    title="Desktop"
                    onClick={() => setDevice('desktop')}
                  >
                    <Monitor size={15} />
                  </button>

                  <button
                    className={device === 'tablet' ? 'device-active' : ''}
                    title="Tablet"
                    onClick={() => setDevice('tablet')}
                  >
                    <Tablet size={15} />
                  </button>

                  <button
                    className={device === 'mobile' ? 'device-active' : ''}
                    title="Mobile"
                    onClick={() => setDevice('mobile')}
                  >
                    <Smartphone size={15} />
                  </button>

                  <button onClick={refreshPreview} title="Refresh preview">
                    <RefreshCw size={14} />
                  </button>

                  <button onClick={runProject} title="Open website">
                    <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>

            {panel === 'preview' ? (
              <div className="preview">
                <iframe
                  key={refresh}
                  title="EVORA Live Preview"
                  srcDoc={previewHTML}
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  style={{ width: deviceWidth }}
                />
              </div>
            ) : (
              <div className="output">
                <p><span className="output-success">●</span> EVORA CODE environment ready.</p>
                <p>{message}</p>
                <p>{saved ? 'All changes saved locally.' : 'Saving project...'}</p>
              </div>
            )}
          </section>

        </main>
      </div>

      <footer className="status">
        <div className="status-left">
          <span><span className="status-dot" /> Ready</span>
          <span>{saved ? 'Saved' : 'Modified'}</span>
        </div>
        <span className="status-message">{message}</span>
        <span className="copyright">© 2026 WINE 🍷 — All Rights Reserved.</span>
      </footer>

    </div>
  )
}