
const $ = selector => document.querySelector(selector);

const grid = $("#templatesGrid");
const empty = $("#emptyState");
const count = $("#templatesCount");

const STORAGE_KEY = "evora_templates";

function getTemplates() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function buildDocument(template) {
  const mode = template.status || "split";
  let html = template.html || "";

  if (mode !== "unified") {
    const style = template.css
      ? `<style>${template.css.replace(/<\/style/gi, "<\\/style")}</style>`
      : "";

    const script = template.js
      ? `<script>${template.js.replace(/<\/script/gi, "<\\/script")}<\/script>`
      : "";

    if (!/<!doctype\s+html/i.test(html) && !/<html[\s>]/i.test(html)) {
      html = `<!DOCTYPE html><html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head><body>${html}</body></html>`;
    }

    if (style) {
      html = /<\/head>/i.test(html)
        ? html.replace(/<\/head>/i, style + "</head>")
        : style + html;
    }

    if (script) {
      html = /<\/body>/i.test(html)
        ? html.replace(/<\/body>/i, script + "</body>")
        : html + script;
    }
  }

  return html;
}

function openPreview(template) {
  $("#previewTitle").textContent = template.name || "معاينة القالب";
  $("#previewFrame").srcdoc = buildDocument(template);
  $("#preview").hidden = false;
  document.body.style.overflow = "hidden";
}

function closePreview() {
  $("#preview").hidden = true;
  $("#previewFrame").srcdoc = "";
  document.body.style.overflow = "";
}

$("#closePreview").addEventListener("click", closePreview);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePreview();
});

function downloadTemplate(template) {
  const files = [
    ["index.html", template.html || ""]
  ];

  if (template.status !== "unified") {
    files.push(["style.css", template.css || ""]);
    files.push(["script.js", template.js || ""]);
  }

  files.forEach(([filename, content]) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function render() {
  const templates = getTemplates();
  const query = $("#searchInput").value.trim().toLowerCase();
  const sort = $("#sortSelect").value;

  let filtered = templates.filter(template => {
    const name = String(template.name || "").toLowerCase();
    const description = String(template.description || "").toLowerCase();

    return name.includes(query) || description.includes(query);
  });

  if (sort === "newest") {
    filtered.sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  } else if (sort === "oldest") {
    filtered.sort((a, b) =>
      new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  } else {
    filtered.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  count.textContent = templates.length + " قالب";
  grid.replaceChildren();

  empty.hidden = filtered.length !== 0;

  filtered.forEach(template => {
    const card = document.createElement("article");
    card.className = "template-card";

    card.innerHTML = `
      <div class="template-icon">&lt;/&gt;</div>
      <h3>${escapeHTML(template.name)}</h3>
      <p>${escapeHTML(template.description || "لا يوجد وصف لهذا القالب.")}</p>
      <div class="template-meta">
        <span>${template.status === "unified" ? "HTML واحد" : "3 ملفات"}</span>
        <span>${escapeHTML(
          template.createdAt
            ? new Date(template.createdAt).toLocaleDateString("ar-EG")
            : "تاريخ غير معروف"
        )}</span>
      </div>
      <div class="card-actions">
        <button data-action="preview">معاينة</button>
        <button data-action="download">تحميل</button>
        <button class="delete-btn" data-action="delete">حذف</button>
      </div>
    `;

    card.querySelector('[data-action="preview"]').addEventListener("click", () => {
      openPreview(template);
    });

    card.querySelector('[data-action="download"]').addEventListener("click", () => {
      downloadTemplate(template);
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm("هل تريد حذف هذا القالب؟")) return;

      saveTemplates(getTemplates().filter(item => item.id !== template.id));
      render();
    });

    grid.appendChild(card);
  });
}

$("#searchInput").addEventListener("input", render);
$("#sortSelect").addEventListener("change", render);
$("#refreshBtn").addEventListener("click", render);

window.addEventListener("storage", render);

render();
