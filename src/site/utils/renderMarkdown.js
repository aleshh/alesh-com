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

function buildLink(label, href, targetToken) {
  const target = targetToken ? targetToken.replace(/\\/g, "") : "";
  const targetAttribute = target ? ` target="${escapeAttribute(target)}"` : "";
  const relAttribute = target === "_blank" ? ' rel="noreferrer"' : "";

  return `<a href="${escapeAttribute(href)}"${relAttribute}${targetAttribute}>${escapeHtml(
    label
  )}</a>`;
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
      html += buildLink(match[2], match[3], match[4]);
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

function renderProjectBody(markdown) {
  const projectMatch = markdown.match(
    /^\[([^\]]+)\]\(([^)]+)\)(?:\{target=(\\?[_a-z]+)\})?\s*→\s*([\s\S]+)$/
  );

  if (!projectMatch) {
    return `<div class="project-copy">${parseInline(markdown)}</div>`;
  }

  const [, label, href, targetToken, description] = projectMatch;

  return `<div class="project-copy"><h3>${buildLink(
    label,
    href,
    targetToken
  )}</h3><p>${parseInline(description)}</p></div>`;
}

function renderListItem(itemLines) {
  const [firstLine, ...remainingLines] = itemLines;
  const imageMatch = firstLine.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(.*)$/);

  if (!imageMatch) {
    return `<li class="project-item">${renderProjectBody(itemLines.join(
      " "
    ))}</li>`;
  }

  const [, alt, src, trailingText] = imageMatch;
  const bodyLines = [trailingText, ...remainingLines].filter(Boolean);

  return `<li class="project-item has-image"><div class="project-image"><img alt="${escapeAttribute(
    alt
  )}" loading="lazy" src="${escapeAttribute(src)}"></div>${renderProjectBody(
    bodyLines.join(" ")
  )}</li>`;
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

      if (block.type === "divider") {
        return '<div class="section-divider"><span class="section-divider-prefix">//</span><span class="section-divider-line"></span></div>';
      }

      return `<p>${parseInline(block.lines.join(" "))}</p>`;
    })
    .join("");
}

module.exports = {
  renderMarkdown,
};
