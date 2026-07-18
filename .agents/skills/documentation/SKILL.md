---
name: documentation
description: Defines README and website-guide structure, audience, prose formatting, and voice for nestia. Use before writing, modifying, renaming, or moving repository documentation.
---

# Documentation

## The Root README Is The Only README

`README.md` at the repository root is the single hand-maintained README. `deploy/README.bash` copies it into all eight `packages/*` directories at release time, and `.gitignore` excludes `packages/*/README.md` so no package carries a tracked copy. Never hand-write a package README expecting it to survive: edit the root README instead, and let the release script distribute it.

Because one file serves every package, keep it oriented to the reader arriving at any one of them: what nestia is, the feature list per package, installation, the smallest working setup, and links onward to the guides. Move deep explanations into the website guides rather than growing the README to cover them.

## Guide Documents

User-facing guides live under `website/src/content/docs/**` as MDX and publish at https://nestia.io/docs. The site runs Nextra 4 on Next.js with `output: "export"`, and deploys the static `website/out` tree to the `gh-pages` branch. Keep one audience and one task per page.

The tree is organized by the surface a reader is working with:

- top-level `index.mdx` and `setup.mdx` cover introduction and installation;
- `core/` owns one page per decorator (`TypedRoute`, `TypedBody`, `TypedParam`, `TypedQuery`, `TypedFormData`, `TypedHeaders`, `TypedException`, `PlainBody`, `SwaggerExample`, `SwaggerCustomizer`, `WebSocketRoute`, `McpRoute`);
- `sdk/` covers SDK generation, distribution, monorepo layout, generated e2e, and the mockup simulator;
- `swagger/` covers the Swagger document, its editor and chat surfaces, and generation strategy;
- `e2e/` covers why generated e2e exists, how to develop against it, and benchmarking; and
- `tutorial/` is the ten-step ordered walkthrough, numbered in its `_meta.ts` from `1. Welcome` through `10. Where to Next`.

Every docs folder and `src/content/` itself carries a `_meta.ts` that Nextra reads in declaration order for sidebar order and labels. Three of them — `src/content/_meta.ts`, `src/content/docs/_meta.ts`, and `docs/tutorial/_meta.ts` — use the typed `satisfies MetaRecord` form; the four per-feature folders use the plain default-exported object. Beyond ordering, those meta files carry `type: "page" | "menu" | "separator"` for navigation structure, `display: "hidden"` to keep a page reachable while removing it from the sidebar, and `href` to point an entry at a different target — mostly internal routes such as `/api`, `/blog`, and `/editor`, and occasionally an external URL. Update the matching `_meta.ts` whenever a guide is added, renamed, moved, hidden, or exposed.

When emitted code is the point, pair the TypeScript source with the generated SDK, Swagger, or e2e output in side-by-side tabs so the reader sees what the transform produces. Back performance claims with a specific `benchmark/results/**` figure instead of an adjective.

Building the website is not a plain `next build`. Follow the prerequisites in `.agents/skills/development/SKILL.md`: the site depends on `../deploy/tarballs/editor.tgz` and `../deploy/tarballs/migrate.tgz`, so root `pnpm run package:tgz` must run first, and `prebuild` additionally rebuilds `@nestia/migrate` and `@nestia/editor` and runs TypeDoc over five packages into `website/public/api`.

## Prose line breaks

Write each Markdown or MDX paragraph on one source line. Never hard-wrap a single paragraph at a fixed column: Markdown already soft-wraps it, while manual wrapping makes small edits reflow unrelated lines.

One source line does not mean one long paragraph. Insert a blank line whenever the idea changes. Keep structural line breaks for paragraphs, list items, headings, tables, and fenced code.

This is a manual convention, not a formatter gate. `prettier.config.js` sets `parser: "typescript"`, and root `pnpm format` only ever targets `*.ts`; no `*.md` or `*.mdx` file is formatted, and `proseWrap` is unset. Preserve one-line paragraphs yourself.

`crate-ci/typos` does gate spelling on every pull request through `typos.toml`. Add a genuine new term to `[default.extend-words]` rather than reshaping prose around the checker.

## Voice

Write in the plain, direct, technical voice of the human-authored nestia docs. Do not write like an AI assistant.

- No AI-cliche phrasing: "not only X but also Y", "whether you're X or Y", "it's worth noting", "let's dive in", and reflexive hedging.
- No marketing adjectives such as "seamless", "powerful", "robust", or "effortless". State the behavior; where speed is the point, cite the benchmark.
- No wrap-up sentence that just restates the paragraph. State the fact and stop.
- Em-dashes already fit the existing nestia prose; do not remove them mechanically or impose a punctuation ban.
- Sidebar emoji in `_meta.ts` and the callout blocks in the root README are part of the existing navigation voice. Keep them where they already fit; this exception does not turn guide prose into decorative copy.
