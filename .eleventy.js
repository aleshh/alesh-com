const { renderMarkdown } = require("./src/site/utils/renderMarkdown");

function renderCircleLinks() {
  return `<section class="extra-links" aria-label="Social links">
    <a href="https://github.com/aleshh">GitHub</a>
    <a href="https://www.linkedin.com/in/alesh/">LinkedIn</a>
    <a href="https://www.instagram.com/alesh/">Instagram</a>
    <a href="mailto:mail@alesh.com?subject=Mail sent from alesh.com">Email</a>
  </section>`;
}

function renderFooter() {
  return `<footer class="footer">
    <div class="footer-meta">
      <a class="footer-repo" href="https://github.com/aleshh/alesh-com-gatsby">main*</a>
      <span>UTF-8</span>
      <span>LF</span>
      <span>TSX</span>
      <span>last updated: 2026-03-31</span>
    </div>
  </footer>`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ static: "." });
  eleventyConfig.addPassthroughCopy({ "src/site/assets": "assets" });
  eleventyConfig.addWatchTarget("src/site/");

  eleventyConfig.setLibrary("md", {
    render(input) {
      return renderMarkdown(input);
    },
    renderInline(input) {
      return renderMarkdown(input);
    },
  });

  eleventyConfig.addShortcode("footer", renderFooter);
  eleventyConfig.addShortcode("circleLinks", renderCircleLinks);

  return {
    dir: {
      input: "src/site",
      output: "public",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: false,
  };
};
