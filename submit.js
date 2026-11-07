
import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { html } from "https://esm.sh/@codemirror/lang-html";
import { css } from "https://esm.sh/@codemirror/lang-css";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "evora_templates";
const EDIT_KEY = "evora_edit_template";

const form = $("#submitForm");
const nameInput = $("#templateName");
const descInput = $("#description");

let currentTab = "html";
let mode = "split";

let state = {
  html: "",
  css: "",
  js: ""
};

let editingId = localStorage.getItem(EDIT_KEY);
let editingTemplate = null;

try {
  const saved = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  editingTemplate = saved.find(item => item.id === editingId) || null;
} catch {
  editingTemplate = null;
}

if (!editingTemplate) {
  editingId = null;
  localStorage.removeItem(EDIT_KEY);
}

function getMode() {
  return $('input[name="status"]:checked')?.value || "split";
}

function updateCount() {
  const count = Object.values(state)
    .join("\n")
    .split("\n").length;

  const element = $("#linesCount");
  if (element) element.textContent = count;
}

function updateDescriptionCount() {
  const element = $("#descCount");

  if (element) {
    element.textContent = descInput.value.length;
  }
}

function buildPreview() {
  state[currentTab] = editor.state.doc.toString();

  const htmlCode = state.html || "";
  const cssCode = state.css || "";
  const jsCode = state.js || "";

  let output = htmlCode;

  if (getMode() === "split") {
    if (/<\/head>/i.test(output)) {
      output = output.replace(
        /<\/head>/i,
        `<style>${cssCode.replace(/<\/style/gi, "<\\/style")}</style></head>`
      );
    } else {
      output = `<style>${cssCode}</style>${output}`;
    }

    if (/<\/body>/i.test(output)) {
      output = output.replace(
        /<\/body>/i,
        `<script>${jsCode.replace(/<\/script/gi, "<\\/script")}</script></body>`
      );
    } else {
      output += `<script>${jsCode}</script>`;
    }
  }

  return output;
}

const editor = new EditorView({
  doc: "",
  extensions: [
    basicSetup,
    oneDark,
    html(),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        state[currentTab] = update.state.doc.toString();
        updateCount();
      }
    })
  ],
  parent: $("#htmlEditor") || $("#paneHtml")
});

function switchTab(tab) {
  if (tab === currentTab) return;

  state[currentTab] = editor.state.doc.toString();
  currentTab = tab;

  const language = {
    html: html(),
    css: css(),
    js: javascript()
  }[tab];

  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: state[tab] || ""
    },
    effects: []
  });

  editor.dispatch({
    effects: []
  });

  $$(".code-editor__tab").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tab
    );
  });

  $$("[data-pane]").forEach(pane => {
    pane.style.display =
      pane.dataset.pane === tab ? "block" : "none";
  });

  updateCount();
}

$$(".code-editor__tab").forEach(button => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

$$('input[name="status"]').forEach(input => {
  input.addEventListener("change", () => {
    mode = getMode();

    $$("[data-split-only]").forEach(element => {
      element.style.display =
        mode === "split" ? "" : "none";
    });

    if (mode === "unified" && currentTab !== "html") {
      switchTab("html");
    }
  });
});

descInput?.addEventListener("input", updateDescriptionCount);

if (editingTemplate) {
  nameInput.value = editingTemplate.name || "";
  descInput.value = editingTemplate.description || "";

  state.html = editingTemplate.html || "";
  state.css = editingTemplate.css || "";
  state.js = editingTemplate.js || "";

  const selectedMode = $(
    `input[name="status"][value="${editingTemplate.status || "split"}"]`
  );

  if (selectedMode) selectedMode.checked = true;

  mode = editingTemplate.status || "split";

  if ($("#pageHeading")) {
    $("#pageHeading").textContent = "تعديل القالب";
  }

  if ($("#submitLabel")) {
    $("#submitLabel").textContent = "حفظ التعديلات";
  }
}

editor.dispatch({
  changes: {
    from: 0,
    to: editor.state.doc.length,
    insert: state.html
  }
});

updateDescriptionCount();
updateCount();

function showPreview() {
  state[currentTab] = editor.state.doc.toString();

  const preview = $("#preview");
  const frame = $("#previewFrame");

  if (!preview || !frame) return;

  if ($("#previewTitle")) {
    $("#previewTitle").textContent =
      nameInput.value || "معاينة المشروع";
  }

  frame.srcdoc = buildPreview();
  preview.style.display = "flex";
}

$("#previewBtn")?.addEventListener("click", showPreview);

$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    $("#preview").style.display = "none";
    $("#previewFrame").srcdoc = "";
  });
});

form?.addEventListener("submit", event => {
  event.preventDefault();

  state[currentTab] = editor.state.doc.toString();

  const name = nameInput.value.trim();

  if (name.length < 2 || name.length > 100) {
    alert("اسم القالب يجب أن يكون بين حرفين و100 حرف.");
    nameInput.focus();
    return;
  }

  if (!state.html.trim()) {
    alert("كود HTML مطلوب.");
    switchTab("html");
    return;
  }

  const templates = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  const post = {
    id: editingTemplate?.id || crypto.randomUUID(),
    name,
    description: descInput.value.trim(),
    status: getMode(),
    html: state.html,
    css: getMode() === "unified" ? "" : state.css,
    js: getMode() === "unified" ? "" : state.js,
    createdAt: editingTemplate?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const index = templates.findIndex(item => item.id === post.id);

  if (index >= 0) {
    templates[index] = post;
  } else {
    templates.unshift(post);
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(templates)
  );

  localStorage.removeItem(EDIT_KEY);

  alert(
    editingTemplate
      ? "تم تحديث القالب بنجاح!"
      : "تم حفظ القالب بنجاح!"
  );

  window.location.href = "library.html";
});
      
