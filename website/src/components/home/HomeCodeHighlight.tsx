import { createHighlighterCoreSync } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import githubDark from "@shikijs/themes/github-dark";
import typescript from "@shikijs/langs/typescript";
import React from "react";

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  themes: [githubDark],
  langs: [typescript],
});

const INNER_RE = /^<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>\s*$/;

const highlight = (code: string): string => {
  const html = highlighter.codeToHtml(code, {
    lang: "typescript",
    theme: "github-dark",
  });
  const match = INNER_RE.exec(html);
  return match ? match[1] : html;
};

const HomeCodeHighlight = (props: { children: string }) => (
  <span
    style={{ color: "inherit" }}
    dangerouslySetInnerHTML={{ __html: highlight(props.children) }}
  />
);
export default HomeCodeHighlight;
