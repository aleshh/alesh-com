# alesh.com

Source for [alesh.com](https://alesh.com).

Migrated from [Gatsby](https://www.gatsbyjs.com/) to [Eleventy (11ty)](https://www.11ty.dev/).

## Local

```sh
pnpm install
pnpm run dev
```

## Build

```sh
pnpm run build
```

The static output goes to `public/`.

## Notes

- Page content lives in `src/site/*.md`.
- Shared layout lives in `src/site/_includes/layout.njk`.
- Static assets in `static/` are copied through to `public/`.
