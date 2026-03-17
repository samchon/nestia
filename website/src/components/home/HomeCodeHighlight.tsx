import React from "react";

// VS Code Dark+ inspired colors
const COLORS = {
  keyword: "#c586c0",
  declare: "#569cd6",
  string: "#ce9178",
  comment: "#6a9955",
  type: "#4ec9b0",
  number: "#b5cea8",
  func: "#dcdcaa",
  param: "#9cdcfe",
  operator: "#d4d4d4",
  bracket: "#ffd700",
  default: "#d4d4d4",
};

const KEYWORDS = new Set([
  "import", "from", "export", "return", "if", "else", "throw",
  "await", "async", "new", "typeof", "instanceof", "in", "of",
  "for", "while", "do", "switch", "case", "break", "continue",
  "try", "catch", "finally", "default", "as", "extends", "implements", "satisfies",
]);

const DECLARES = new Set([
  "const", "let", "var", "function", "class", "interface", "type",
  "enum", "namespace", "module", "abstract", "readonly",
]);

const BUILTIN_TYPES = new Set([
  "string", "number", "boolean", "void", "null", "undefined",
  "never", "any", "unknown", "object", "true", "false",
  "Record", "Partial", "Required", "Array", "Promise",
  "Uint8Array", "FormData", "URLSearchParams",
]);

interface Token {
  type: "keyword" | "declare" | "string" | "comment" | "type" | "number" | "func" | "operator" | "default";
  value: string;
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      tokens.push({ type: "comment", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (code[i] === "/" && code[i + 1] === "*") {
      let end = code.indexOf("*/", i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      tokens.push({ type: "comment", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (code[i] === '"') {
      let end = i + 1;
      while (end < code.length && code[end] !== '"') {
        if (code[end] === "\\") end++;
        end++;
      }
      end++;
      tokens.push({ type: "string", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (code[i] === "'") {
      let end = i + 1;
      while (end < code.length && code[end] !== "'") {
        if (code[end] === "\\") end++;
        end++;
      }
      end++;
      tokens.push({ type: "string", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (code[i] === "`") {
      let end = i + 1;
      while (end < code.length && code[end] !== "`") {
        if (code[end] === "\\") end++;
        end++;
      }
      end++;
      tokens.push({ type: "string", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (/[0-9]/.test(code[i]) && (i === 0 || /[\s,;:(=<>!+\-*/&|^~\[\]\{]/.test(code[i - 1]))) {
      let end = i;
      while (end < code.length && /[0-9._eExXa-fA-F]/.test(code[end])) end++;
      tokens.push({ type: "number", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (/[a-zA-Z_$@]/.test(code[i])) {
      let end = i;
      if (code[i] === "@") end++; // consume @ prefix for decorators
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
      const word = code.slice(i, end);

      if (word.startsWith("@")) {
        tokens.push({ type: "keyword", value: word });
      } else if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (DECLARES.has(word)) {
        tokens.push({ type: "declare", value: word });
      } else if (BUILTIN_TYPES.has(word)) {
        tokens.push({ type: "type", value: word });
      } else if (end < code.length && code[end] === "(") {
        tokens.push({ type: "func", value: word });
      } else if (word.length > 0 && word[0] === word[0].toUpperCase() && /[a-z]/.test(word.slice(1))) {
        tokens.push({ type: "type", value: word });
      } else {
        tokens.push({ type: "default", value: word });
      }
      i = end;
      continue;
    }

    if (/\s/.test(code[i])) {
      let end = i;
      while (end < code.length && /\s/.test(code[end])) end++;
      tokens.push({ type: "operator", value: code.slice(i, end) });
      i = end;
      continue;
    }

    tokens.push({ type: "operator", value: code[i] });
    i++;
  }

  return tokens;
}

const COLOR_MAP: Record<Token["type"], string> = {
  keyword: COLORS.keyword,
  declare: COLORS.declare,
  string: COLORS.string,
  comment: COLORS.comment,
  type: COLORS.type,
  number: COLORS.number,
  func: COLORS.func,
  operator: COLORS.operator,
  default: COLORS.default,
};

const HomeCodeHighlight = (props: { children: string }) => {
  const tokens = tokenize(props.children);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} style={{ color: COLOR_MAP[token.type] }}>
          {token.value}
        </span>
      ))}
    </>
  );
};
export default HomeCodeHighlight;
