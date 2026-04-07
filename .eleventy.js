const { renderMarkdown } = require("./src/site/utils/renderMarkdown");

function icon(name) {
  const icons = {
    github:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  };

  return icons[name];
}

function renderFooter() {
  return `<footer class="footer">
    <div class="status-section">
      <a class="footer-link" href="https://github.com/aleshh">
        ${icon("github")}
        GitHub
      </a>
      <a class="footer-link" href="https://www.linkedin.com/in/alesh/">
        ${icon("linkedin")}
        LinkedIn
      </a>
      <a class="footer-link" href="https://www.instagram.com/alesh/">
        ${icon("instagram")}
        Instagram
      </a>
      <a class="footer-link" href="mailto:mail@alesh.com?subject=Mail sent from alesh.com">
        ${icon("mail")}
        Email
      </a>
    </div>
  </footer>`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ static: "." });
  eleventyConfig.addPassthroughCopy({ "src/site/assets": "assets" });
  eleventyConfig.addWatchTarget("src/site/");
  eleventyConfig.addWatchTarget("src/content/");

  eleventyConfig.setLibrary("md", {
    render(input) {
      return renderMarkdown(input);
    },
    renderInline(input) {
      return renderMarkdown(input);
    },
  });

  eleventyConfig.addShortcode("footer", renderFooter);

  return {
    dir: {
      input: "src/site",
      output: "public",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: false,
  };
};
