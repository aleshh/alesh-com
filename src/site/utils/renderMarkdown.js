const fs = require("fs");
const path = require("path");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function parseInline(markdown) {
  const pattern =
    /<span class="emoji">([\s\S]*?)<\/span>|\[([^\]]+)\]\(([^)]+)\)(?:\{target=(\\?[_a-z]+)\})?/g;

  let html = "";
  let lastIndex = 0;
  let match = pattern.exec(markdown);

  while (match) {
    if (match.index > lastIndex) {
      html += escapeHtml(markdown.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      html += `<span class="emoji">${escapeHtml(match[1])}</span>`;
    } else if (match[2] !== undefined) {
      const href = escapeAttribute(match[3]);
      const target = match[4] ? match[4].replace(/\\/g, "") : "";
      const targetAttribute = target
        ? ` target="${escapeAttribute(target)}"`
        : "";
      const relAttribute =
        target === "_blank" ? ' rel="noreferrer"' : "";

      html += `<a href="${href}"${relAttribute}${targetAttribute}>${escapeHtml(
        match[2]
      )}</a>`;
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(markdown);
  }

  if (lastIndex < markdown.length) {
    html += escapeHtml(markdown.slice(lastIndex));
  }

  return html;
}

function stripComments(markdown) {
  return markdown.replace(/<!--[\s\S]*?-->/g, (match) => {
    const lineBreaks = match.match(/\r?\n/g)?.length || 0;
    return "\n".repeat(Math.max(1, lineBreaks));
  });
}

function parseBlocks(markdown) {
  const lines = stripComments(markdown).trim().split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      index += 1;
      continue;
    }

    const projectsDirective = line.match(/^\[\[projects:(featured|all)\]\]$/);
    if (projectsDirective) {
      blocks.push({ type: "projects", mode: projectsDirective[1] });
      index += 1;
      continue;
    }

    if (line.match(/^\/\/\s*---\s*$/)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items = [];

      while (index < lines.length) {
        const itemLine = lines[index].trimEnd();

        if (!itemLine.startsWith("- ")) {
          break;
        }

        const itemLines = [itemLine.slice(2).trim()];
        index += 1;

        while (index < lines.length) {
          const continuation = lines[index];
          const trimmed = continuation.trim();

          if (trimmed === "") {
            index += 1;

            while (index < lines.length && lines[index].trim() === "") {
              index += 1;
            }

            break;
          }

          if (
            continuation.trimStart().startsWith("- ") ||
            continuation.trimStart().startsWith("#")
          ) {
            break;
          }

          itemLines.push(trimmed);
          index += 1;
        }

        items.push(itemLines);
      }

      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trimEnd();

      if (
        nextLine.trim() === "" ||
        nextLine.startsWith("# ") ||
        nextLine.startsWith("## ") ||
        nextLine.startsWith("// ---") ||
        nextLine.startsWith("- ")
      ) {
        break;
      }

      paragraphLines.push(nextLine.trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

function normalizeProjectItem(itemLines) {
  const normalizedLines = [...itemLines];
  let featured = false;

  if (normalizedLines[0]) {
    normalizedLines[0] = normalizedLines[0].replace(/^\[featured\]\s*/i, () => {
      featured = true;
      return "";
    });
  }

  while (normalizedLines[0] === "") {
    normalizedLines.shift();
  }

  return {
    featured,
    itemLines: normalizedLines,
  };
}

function getProjectItems(markdown) {
  return parseBlocks(markdown)
    .filter((block) => block.type === "list")
    .flatMap((block) => block.items.map(normalizeProjectItem))
    .filter((item) => item.itemLines.length > 0);
}

function renderListItem(itemLines) {
  const [firstLine, ...remainingLines] = itemLines;
  const imageMatch = firstLine.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(.*)$/);

  if (!imageMatch) {
    return `<li class="project-item"><div class="project-copy">${parseInline(
      itemLines.join(" ")
    )}</div></li>`;
  }

  const [, alt, src, trailingText] = imageMatch;
  const bodyLines = [trailingText, ...remainingLines].filter(Boolean);

  return `<li class="project-item has-image"><img alt="${escapeAttribute(
    alt
  )}" loading="lazy" src="${escapeAttribute(
    src
  )}"><div class="project-copy">${parseInline(bodyLines.join(" "))}</div></li>`;
}

function renderProjectList(markdown, mode = "all") {
  const items = getProjectItems(markdown).filter((item) =>
    mode === "featured" ? item.featured : true
  );

  if (items.length === 0) {
    return "";
  }

  return `<ul class="project-list">${items
    .map((item) => renderListItem(item.itemLines))
    .join("")}</ul>`;
}

function readProjectsMarkdown() {
  return fs.readFileSync(
    path.join(process.cwd(), "src", "content", "projects.md"),
    "utf8"
  );
}

function renderMarkdown(markdown) {
  return parseBlocks(markdown)
    .map((block) => {
      if (block.type === "h1") {
        return `<h1>${parseInline(block.text)}</h1>`;
      }

      if (block.type === "h2") {
        return `<h2>${parseInline(block.text)}</h2>`;
      }

      if (block.type === "list") {
        return `<ul class="project-list">${block.items
          .map(renderListItem)
          .join("")}</ul>`;
      }

      if (block.type === "projects") {
        return renderProjectList(readProjectsMarkdown(), block.mode);
      }

      if (block.type === "divider") {
        return '<div class="section-divider"><span class="section-divider-prefix">//</span><span class="section-divider-line"></span></div>';
      }

      return `<p>${parseInline(block.lines.join(" "))}</p>`;
    })
    .join("");
}

module.exports = {
  getProjectItems,
  renderMarkdown,
  renderProjectList,
};
