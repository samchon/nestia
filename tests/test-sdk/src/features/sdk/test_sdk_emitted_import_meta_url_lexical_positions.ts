import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies the `import.meta.url` patch rewrites the token only where it is
 * code.
 *
 * A previous-token scanner cannot distinguish a regular expression following a
 * control-flow condition from division. Parsing syntax also distinguishes
 * property chains and Unicode identifiers from the import.meta meta-property.
 *
 * 1. Write emitted-style files holding the token in code positions and in text
 *    positions: template text, a template substitution, strings, comments and
 *    regular expressions, around divisions.
 * 2. Run the patch over the folder.
 * 3. Assert code positions are rewritten and every text position is byte-for-byte
 *    unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification The built patcher rewrites real files and the file text is compared before and after, so a rewritten text position or a missed code position changes the expected string.
 * @evidence contracts/testing.md#independent-expectations Each expected file is written by hand from the JavaScript lexical grammar: where the token is an expression it becomes the replacement, and where it is template text, a string, a comment or a regular expression it stays.
 * @evidence contracts/testing.md#distinguishing-cases Code, a nested template substitution, a division before the token, a quote inside a regular expression and an apostrophe inside template text are the cases; plain strings, comments and a file without the token are the unchanged controls, and regular expressions following control flow, property lookalikes and Unicode identifiers stay unchanged, spaced expressions are rewritten, and an .mjs file is left alone.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-sdk process against the built SDK utility loaded by absolute path, using a mkdtemp directory removed in finally; no compiler starts.
 */
export async function test_sdk_emitted_import_meta_url_lexical_positions(): Promise<void> {
  const { EmittedJavaScriptPatcher } = require(
    path.resolve(
      process.cwd(),
      "../../packages/sdk/lib/utils/EmittedJavaScriptPatcher",
    ),
  ) as {
    EmittedJavaScriptPatcher: {
      importMetaUrl: (root: string) => Promise<void>;
    };
  };
  const R: string = 'require("url").pathToFileURL(__filename).href';
  const cases: Array<[string, string, string]> = [
    ["code.js", "const a = import.meta.url;", `const a = ${R};`],
    [
      "template-text.js",
      "const a = `x import.meta.url y`;",
      "const a = `x import.meta.url y`;",
    ],
    [
      "template-substitution.js",
      "const a = `it's ${import.meta.url} ok`;",
      `const a = \`it's \${${R}} ok\`;`,
    ],
    [
      "nested-template.js",
      "const a = `${ {b: 1}.b + `n ${import.meta.url}` }` // import.meta.url",
      `const a = \`\${ {b: 1}.b + \`n \${${R}}\` }\` // import.meta.url`,
    ],
    [
      "regex-quote.js",
      'const r = /"/; const b = import.meta.url;',
      `const r = /"/; const b = ${R};`,
    ],
    [
      "regex-class.js",
      "const r = /[/']/g.test(x); const b = import.meta.url;",
      `const r = /[/']/g.test(x); const b = ${R};`,
    ],
    [
      "regex-text.js",
      "return /import.meta.url/.test(x);",
      "return /import.meta.url/.test(x);",
    ],
    [
      "division.js",
      "const d = a / b; const e = import.meta.url; // c / d",
      `const d = a / b; const e = ${R}; // c / d`,
    ],
    [
      "strings-comments.js",
      "const s = 'import.meta.url'; /* import.meta.url */ // import.meta.url",
      "const s = 'import.meta.url'; /* import.meta.url */ // import.meta.url",
    ],
    [
      "regex-after-control.js",
      "if (true) /import.meta.url/.test(value); const u = import.meta.url;",
      `if (true) /import.meta.url/.test(value); const u = ${R};`,
    ],
    [
      "regex-after-block.js",
      "if (false) {} /import.meta.url/.test(value);",
      "if (false) {} /import.meta.url/.test(value);",
    ],
    [
      "property-lookalike.js",
      "const u = object.import.meta.url;",
      "const u = object.import.meta.url;",
    ],
    [
      "spaced-code.js",
      "const u = import /* retained boundary */ . meta . url;",
      `const u = ${R};`,
    ],
    [
      "unicode-identifier.js",
      "const u = \u03c0import.meta.url;",
      "const u = \u03c0import.meta.url;",
    ],
    ["plain.cjs", "module.exports = 1;", "module.exports = 1;"],
    [
      "esm.mjs",
      "export const u = import.meta.url;",
      "export const u = import.meta.url;",
    ],
  ];
  const root: string = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-patch-"));
  try {
    for (const [name, input] of cases)
      fs.writeFileSync(path.join(root, name), input, "utf8");
    await EmittedJavaScriptPatcher.importMetaUrl(root);
    for (const [name, , expected] of cases)
      TestValidator.equals(
        name,
        fs.readFileSync(path.join(root, name), "utf8"),
        expected,
      );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
