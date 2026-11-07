
import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import JSZip from 'jszip'
import {
  Code2, Play, Save, Download, Plus, X,
  FileCode, Eye, Terminal, Monitor, Smartphone,
  Tablet, Trash2
} from 'lucide-react'

const defaults = {
  'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="hero">
    <span>WELCOME TO EVORA</span>
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

.hero span {
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

function getLanguage(name) {
  if (name.endsWith('.html')) return 'html'
  if (name.endsWith('.css')) return 'css'
  if (name.endsWith('.js')) return 'javascript'
  if (name.endsWith('.json')) return 'json'
  return 'plaintext'
}

export default function App() {
  const [files, setFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('evora-files')) || defaults
    } catch {
      return defaults
    }
  })

  const [active, setActive] = useState('index.html')
  const [tabs, setTabs] = useState([
    'index.html', 'style.css', 'script.js'
  ])
  const [device, setDevice] = useState('desktop')
  const [panel, setPanel] = useState('preview')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [message, setMessage] = useState('Ready')

  useEffect(() => {
    localStorage.setItem('evora-files', JSON.stringify(files))
    setMessage('Saved locally')
  }, [files])

  function updateCode(value) {
    setFiles(prev => ({
      ...prev,
      [active]: value || ''
    }))
  }

  function openFile(name) {
    setActive(name)
    setTabs(prev =>
      prev.includes(name) ? prev : [...prev, name]
    )
  }

  function createFile() {
    const name = newName.trim()

    if (!name || files[name]) return

    setFiles(prev => ({
      ...prev,
      [name]: ''
    }))

    setTabs(prev => [...prev, name])
    setActive(name)
    setNewName('')
    setAdding(false)
  }

  function deleteFile(name) {
    if (Object.keys(files).length <= 1) return

    const next = { ...files }
    delete next[name]

    setFiles(next)
    setTabs(prev => prev.filter(item => item !== name))

    if (active === name) {
      setActive(Object.keys(next)[0])
    }
  }

  function closeTab(name) {
    const next = tabs.filter(item => item !== name)
    setTabs(next)

    if (active === name) {
      setActive(next[next.length - 1] || '')
    }
  }

  function getPreview() {
    let html = files['index.html'] || '<h1>Create index.html</h1>'
    const css = files['style.css'] || ''
    const js = files['script.js'] || ''

    const style = `<style>${css.replace(/<\\/style/gi, '<\\\\/style')}</style>`
    const script = `<script>${js.replace(/<\\/script/gi, '<\\\\/script')}<\\/script>`

    if (html.includes('</head>')) {
      html = html.replace('</head>', style + '</head>')
    } else {
      html = style + html
    }

    if (html.includes('</body>')) {
      html = html.replace('</body>', script + '</body>')
    } else {
      html += script
    }

    return html
  }

  function runProject() {
    setRefresh(value => value + 1)
    setPanel('preview')
    setMessage('Preview updated')
  }

  async function exportProject() {
    const zip = new JSZip()

    Object.entries(files).forEach(([name, content]) => {
      zip.file(name, content)
    })

    zip.file(
      'README.md',
      '# EVORA CODE Project\n\nCreated with EVORA CODE.\n\n© 2026 WINE 🍷'
    )

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'evora-code-project.zip'
    link.click()

    URL.revokeObjectURL(url)
    setMessage('Project exported')
  }

  const width = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px'
  }[device]

  return (
    <div className="app">

      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <Code2 />
          </div>
          <div>
            <strong>EVORA <span>CODE</span></strong>
            <small>WEB DEVELOPMENT STUDIO</small>
          </div>
        </div>

        <div className="actions">
          <button onClick={() => {
            localStorage.setItem('evora-files', JSON.stringify(files))
            setMessage('Saved locally')
          }}>
            <Save size={15}/> Save
          </button>

          <button className="run" onClick={runProject}>
            <Play size={15}/> Run
          </button>

          <button onClick={exportProject}>
            <Download size={15}/> Export
          </button>
        </div>
      </header>

      <div className="workspace">

        <aside className="sidebar">
          <div className="side-title">
            EXPLORER
            <button onClick={() => setAdding(true)}>
              <Plus size={16}/>
            </button>
          </div>

          <div className="project-name">
            ▾ EVORA PROJECT
          </div>

          {Object.keys(files).map(name => (
            <div
              key={name}
              className={`file ${active === name ? 'selected' : ''}`}
              onClick={() => openFile(name)}
            >
              <FileCode size={15}/>
              {name}

              <button
                onClick={event => {
                  event.stopPropagation()
                  deleteFile(name)
                }}
              >
                <Trash2 size={13}/>
              </button>
            </div>
          ))}

          {adding && (
            <div className="new-file">
              <input
                autoFocus
                placeholder="filename.ext"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFile()}
              />
              <button onClick={createFile}>✓</button>
              <button onClick={() => setAdding(false)}>×</button>
            </div>
          )}
        </aside>

        <main className="main">

          <div className="tabs">
            {tabs.map(name => (
              <div
                key={name}
                className={`tab ${active === name ? 'active' : ''}`}
                onClick={() => setActive(name)}
              >
                <FileCode size={14}/>
                {name}
                <button onClick={e => {
                  e.stopPropagation()
                  closeTab(name)
                }}>
                  <X size={13}/>
                </button>
              </div>
            ))}
          </div>

          <div className="editor">
            {active && files[active] !== undefined ? (
              <Editor
                height="100%"
                theme="vs-dark"
                path={active}
                language={getLanguage(active)}
                value={files[active]}
                onChange={updateCode}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  tabSize: 2
                }}
              />
            ) : (
              <div className="welcome">
                <Code2 size={40}/>
                <h2>EVORA CODE</h2>
                <p>Open a file to start coding.</p>
              </div>
            )}
          </div>

          <section className="bottom">

            <div className="panel-tabs">
              <button
                className={panel === 'preview' ? 'chosen' : ''}
                onClick={() => setPanel('preview')}
              >
                <Eye size={14}/> Preview
              </button>

              <button
                className={panel === 'output' ? 'chosen' : ''}
                onClick={() => setPanel('output')}
              >
                <Terminal size={14}/> Output
              </button>
            </div>

            {panel === 'preview' ? (
              <>
                <div className="preview-tools">
                  <button onClick={() => setDevice('desktop')}>
                    <Monitor size={15}/>
                  </button>
                  <button onClick={() => setDevice('tablet')}>
                    <Tablet size={15}/>
                  </button>
                  <button onClick={() => setDevice('mobile')}>
                    <Smartphone size={15}/>
                  </button>

                  <button onClick={runProject}>
                    <Play size={14}/> Refresh
                  </button>
                </div>

                <div className="preview">
                  <iframe
                    key={refresh}
                    title="EVORA Preview"
                    sandbox="allow-scripts allow-modals"
                    srcDoc={getPreview()}
                    style={{ width }}
                  />
                </div>
              </>
            ) : (
              <div className="output">
                EVORA CODE environment ready.
                <br/>
                {message}
              </div>
            )}

          </section>

        </main>
      </div>

      <footer className="status">
        <span>● Ready</span>
        <span>{message}</span>
        <span>© 2026 WINE 🍷</span>
      </footer>

    </div>
  )
}
