
import { basicSetup, EditorView } from "https://esm.sh/codemirror@6";
import { EditorState, Compartment } from "https://esm.sh/@codemirror/state@6";
import { html } from "https://esm.sh/@codemirror/lang-html@6";
import { css } from "https://esm.sh/@codemirror/lang-css@6";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6";
import { keymap } from "https://esm.sh/@codemirror/view@6";
import { indentWithTab } from "https://esm.sh/@codemirror/commands@6";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const form = $("#submitForm");
const nameInput = $("#templateName");
const descInput = $("#description");
const editorCount = $("#linesCount");
const preview = $("#preview");
const previewFrame = $("#previewFrame");

const state = { html: "", css: "", js: "" };
let currentTab = "html";
const language = new Compartment();

const editor = new EditorView({
  parent: $("#paneHtml"),
  state: EditorState.create({
    doc: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Website</title>
</head>
<body>
  <h1>أهلاً بك في EVORA CODE</h1>
</body>
</html>`,
    extensions: [
      basicSetup,
      oneDark,
      keymap.of([indentWithTab]),
      language.of(html()),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          state[currentTab] = update.state.doc.toString();
          updateCount();
        }
      })
    ]
  })
});

const languages = {
  html: html,
  css: css,
  js: javascript
};

function switchTab(tab) {
  state[currentTab] = editor.state.doc.toString();
  currentTab = tab;

  $$(".code-editor__tab").forEach(button => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });

  $$(".code-editor__pane").forEach(pane => {
    pane.classList.toggle("is-active", pane.dataset.pane === tab);
  });

  const pane = $(`.code-editor__pane[data-pane="${tab}"]`);
  pane.appendChild(editor.dom);

  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: state[tab] || ""
    },
    effects: language.reconfigure(languages[tab]())
  });

  editor.requestMeasure();
  editor.focus();
}

$$(".code-editor__tab").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.tab !== currentTab) {
      switchTab(button.dataset.tab);
    }
  });
});

function updateCount() {
  state[currentTab] = editor.state.doc.toString();

  const count = value =>
    String(value || "").split("\n").filter(line => line.trim()).length;

  const total = getMode() === "unified"
    ? count(state.html)
    : count(state.html) + count(state.css) + count(state.js);

  editorCount.textContent = total + " سطر";
}

function getMode() {
  return $('input[name="status"]:checked')?.value || "split";
}

function isFullHTML(value) {
  return /<!doctype\s+html/i.test(value) || /<html[\s>]/i.test(value);
}

function buildPreview() {
  state[currentTab] = editor.state.doc.toString();

  const htmlCode = state.html;
  const cssCode = getMode() === "unified" ? "" : state.css;
  const jsCode = getMode() === "unified" ? "" : state.js;

  if (!htmlCode.trim() && !cssCode.trim() && !jsCode.trim()) {
    return null;
  }

  let documentHTML = htmlCode;

  if (!isFullHTML(documentHTML)) {
    documentHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(nameInput.value || "EVORA Preview")}</title>
</head>
<body>${documentHTML}</body>
</html>`;
  }

  if (cssCode.trim()) {
    const style = `<style>${cssCode.replace(/<\/style/gi, "<\\/style")}</style>`;

    documentHTML = documentHTML.includes("</head>")
      ? documentHTML.replace("</head>", style + "</head>")
      : style + documentHTML;
  }

  if (jsCode.trim()) {
    const script = `<script>${jsCode.replace(/<\/script/gi, "<\\/script")}<\/script>`;

    documentHTML = documentHTML.includes("</body>")
      ? documentHTML.replace("</body>", script + "</body>")
      : documentHTML + script;
  }

  return documentHTML;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

$("#previewBtn").addEventListener("click", () => {
  const result = buildPreview();

  if (!result) {
    alert("اكتب كود HTML أولاً");
    return;
  }

  previewFrame.srcdoc = result;
  $("#previewTitle").textContent = nameInput.value || "معاينة القالب";
  preview.hidden = false;
  document.body.style.overflow = "hidden";
});

function closePreview() {
  preview.hidden = true;
  previewFrame.srcdoc = "";
  document.body.style.overflow = "";
}

preview.addEventListener("click", event => {
  if (event.target.closest("[data-close]")) closePreview();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !preview.hidden) closePreview();
});

$("#description").addEventListener("input", event => {
  $("#descCount").textContent = event.target.value.length;
});

$$('input[name="status"]').forEach(input => {
  input.addEventListener("change", () => {
    const unified = getMode() === "unified";

    $$("[data-split-only]").forEach(element => {
      element.style.display = unified ? "none" : "";
    });

    if (unified && currentTab !== "html") {
      switchTab("html");
    }

    updateCount();
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const name = nameInput.value.trim();

  if (name.length < 2 || name.length > 100) {
    alert("اسم القالب يجب أن يكون بين حرفين و100 حرف.");
    nameInput.focus();
    return;
  }

  state[currentTab] = editor.state.doc.toString();

  if (!state.html.trim()) {
    alert("كود HTML مطلوب.");
    switchTab("html");
    return;
  }

  const post = {
    id: crypto.randomUUID(),
    name,
    description: descInput.value.trim(),
    status: getMode(),
    html: state.html,
    css: getMode() === "unified" ? "" : state.css,
    js: getMode() === "unified" ? "" : state.js,
    createdAt: new Date().toISOString()
  };

  const saved = JSON.parse(localStorage.getItem("evora_templates") || "[]");
  saved.unshift(post);
  localStorage.setItem("evora_templates", JSON.stringify(saved));

  alert("تم حفظ القالب على هذا الجهاز بنجاح.");

  form.reset();
  state.html = "";
  state.css = "";
  state.js = "";
  switchTab("html");
});

switchTab("html");
updateCount();
