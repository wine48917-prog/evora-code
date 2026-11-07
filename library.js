
const STORAGE_KEY = "evora_templates";
const EDIT_KEY = "evora_edit_template";

const $ = (selector) => document.querySelector(selector);

let templates = [];

function loadTemplates() {
  try {
    templates = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(templates)) templates = [];
  } catch {
    templates = [];
  }

  renderTemplates();
}

function saveTemplates() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(templates)
  );
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderTemplates() {
  const grid = $("#templatesGrid");
  const empty = $("#emptyState");
  const count = $("#templatesCount");

  if (!grid) return;

  const search = ($("#searchInput")?.value || "")
    .trim()
    .toLowerCase();

  const sort = $("#sortSelect")?.value || "newest";

  let filtered = templates.filter(item =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(search)
  );

  if (sort === "oldest") {
    filtered.sort((a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  } else if (sort === "name") {
    filtered.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } else {
    filtered.sort((a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
    );
  }

  if (count) count.textContent = filtered.length;

  if (empty) {
    empty.style.display = filtered.length ? "none" : "block";
  }

  grid.innerHTML = filtered.map(item => `
    <article class="template-card">
      <div class="template-card__top">
        <span class="template-card__icon">&lt;/&gt;</span>
        <span class="template-card__badge">
          ${item.status === "unified" ? "ملف واحد" : "HTML / CSS / JS"}
        </span>
      </div>

      <h3>${escapeHTML(item.name)}</h3>

      <p>${escapeHTML(item.description || "بدون وصف")}</p>

      <div class="template-card__date">
        آخر تعديل:
        ${new Date(item.updatedAt || item.createdAt).toLocaleDateString("ar-EG")}
      </div>

      <div class="template-card__actions">
        <button data-action="preview" data-id="${escapeHTML(item.id)}">
          معاينة
        </button>

        <button data-action="edit" data-id="${escapeHTML(item.id)}">
          تعديل
        </button>

        <button data-action="download" data-id="${escapeHTML(item.id)}">
          تحميل
        </button>

        <button data-action="delete" data-id="${escapeHTML(item.id)}">
          حذف
        </button>
      </div>
    </article>
  `).join("");
}

function buildDocument(item) {
  const html = item.html || "";
  const css = item.css || "";
  const js = item.js || "";

  if (item.status === "unified") {
    return html;
  }

  return html
    .replace(
      /<\/head>/i,
      `<style>${css.replace(/<\/style/gi, "<\\/style")}</style></head>`
    )
    .replace(
      /<\/body>/i,
      `<script>${js.replace(/<\/script/gi, "<\\/script")}</script></body>`
    );
}

function previewTemplate(item) {
  const modal = $("#preview");
  const frame = $("#previewFrame");
  const title = $("#previewTitle");

  if (!modal || !frame) return;

  if (title) title.textContent = item.name;

  frame.srcdoc = buildDocument(item);
  modal.style.display = "flex";
}

function closePreview() {
  const modal = $("#preview");
  const frame = $("#previewFrame");

  if (modal) modal.style.display = "none";
  if (frame) frame.srcdoc = "";
}

function editTemplate(item) {
  localStorage.setItem(EDIT_KEY, item.id);
  window.location.href = "submit.html";
}

function downloadTemplate(item) {
  const files = item.status === "unified"
    ? { "index.html": item.html }
    : {
        "index.html": item.html,
        "style.css": item.css,
        "script.js": item.js
      };

  const blob = new Blob(
    [JSON.stringify(files, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${item.name.replace(/[^\w\u0600-\u06FF-]/g, "_")}-files.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function deleteTemplate(id) {
  const confirmed = confirm("هل أنت متأكد من حذف هذا القالب؟");

  if (!confirmed) return;

  templates = templates.filter(item => item.id !== id);
  saveTemplates();
  renderTemplates();
}

$("#templatesGrid")?.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const item = templates.find(
    template => template.id === button.dataset.id
  );

  if (!item) return;

  switch (button.dataset.action) {
    case "preview":
      previewTemplate(item);
      break;

    case "edit":
      editTemplate(item);
      break;

    case "download":
      downloadTemplate(item);
      break;

    case "delete":
      deleteTemplate(item.id);
      break;
  }
});

$("#searchInput")?.addEventListener("input", renderTemplates);
$("#sortSelect")?.addEventListener("change", renderTemplates);
$("#refreshBtn")?.addEventListener("click", loadTemplates);
$("#closePreview")?.addEventListener("click", closePreview);

$("#preview")?.addEventListener("click", event => {
  if (event.target.id === "preview") closePreview();
});

loadTemplates();
    
