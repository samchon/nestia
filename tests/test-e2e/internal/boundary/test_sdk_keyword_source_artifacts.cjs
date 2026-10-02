const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies original keyword documentation and nonclone import/namespace
 * artifacts before the existing consumer compile.
 *
 * The scanner retains the original emitted-import envelope matcher; it is not
 * a general JavaScript/TypeScript parser. The compiler independently resolves
 * those source bindings, while requests own the transport payload verdicts.
 *
 * 1. Read the already-generated Kn/N0/automatic source E2E and common Swagger.
 * 2. Check exact JSDoc text, original alias spelling, all three DTO import forms
 *    and both namespaced paths without modifying the generated files.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual generated source retains _props.props, props.query/props._query and wrapped text, IAccount as Account, type-only named/default/namespace DTO imports, runtime fetcher imports and north/south Swagger routes.
 * @evidence contracts/testing.md#independent-expectations Original controller documentation and explicit source export/import forms supply the exact text/binding expectations; original NamespaceController specifies both independent Swagger paths.
 * @evidence contracts/testing.md#distinguishing-cases Nonempty SDK and automatic E2E roots are separate populations; DTO type-only imports contrast called fetcher value imports, alias contrasts its export name, and two same-named controller methods require distinct paths.
 * @evidence contracts/testing.md#execution-ownership This sole public CommonJS export is invoked by the installed shared E2E entry after explicit generations and before its one consumer compile. Private traversal/matcher responsibility is reviewed through this owning operation.
 * @evidence contracts/e2e.md#necessary-boundary Installed generator output must contain the source ABI and final comments actually consumed by the public compiler; an authored writer fixture cannot prove the final file resolution.
 * @evidence contracts/e2e.md#shared-execution Reads use existing installation/producer/consumer and four explicit additional SDK profiles plus one source-ABI E2E generation; the scanner adds no generation, compiler, application or listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Only sandbox-owned immutable files are read; synchronous reads release handles immediately and the existing entry owns final sandbox cleanup.
 * @evidence contracts/e2e.md#preserved-coverage The original JSDoc four verdicts, alias matcher, import-type scanner over both roots and namespaced Swagger two-path verdict remain explicit; they are not replaced by compilation or cloned output.
 * @evidence contracts/common.md#principled-implementation The original limited top-level import envelope is inspected and counted against independent export-kind requirements; missing roots and empty files cannot satisfy the verdict.
 * @evidence contracts/common.md#clear-and-simple-design One public artifact reader owns its private recursive TypeScript-file collector and fixed matcher; all failures retain their output path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source metadata, generated string, resolver, compiler host or DTO definition is changed by this reader.
 * @evidence contracts/common.md#meaningful-documentation Documents the limited emitted syntax premise and the complementary real compiler/runtime responsibilities rather than claiming a universal parser.
 * @evidence contracts/performance.md#efficient-algorithms Directory traversal is proportional to entries and each file is read once per necessary original scan. The retained multiline import matcher can rescan suffixes for failed import prefixes, giving worst-case quadratic text work; generated well-formed import envelopes are its intended premise, not a linear-time parser guarantee.
 * @evidence contracts/performance.md#reuse-equivalent-work This one post-generation invocation shares the same immutable generated outputs across original artifact assertions; no file collection or content survives into another generation snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close handles before returning, arrays and current file strings are invocation-local and bounded by selected output population, and no compiler/application state is retained.
 * @evidence contracts/portability.md#os-neutral-implementation Native path.join/relative delimit sandbox artifact paths; generated import specifiers are protocol-like POSIX text inspected without treating them as native filesystem separators.
 */
const test_sdk_keyword_source_artifacts = ({ sandbox, record }) => {
  const root = path.join(sandbox, "consumer/src");
  const shadow = fs.readFileSync(path.join(root, "api_keyword_source/functional/keyword_collision/shadow/index.ts"), "utf8");
  const socket = fs.readFileSync(path.join(root, "api_keyword_source/functional/keyword_collision/socket/index.ts"), "utf8");
  assert.ok(shadow.includes("@param _props.props Shadow to echo"));
  assert.ok(socket.includes("@param props.query Path segment named like the query parameter"));
  assert.ok(socket.includes("@param props._query Shadow to search"));
  assert.ok(socket.includes(`\n * ${" ".repeat("@param props.query ".length)}onto a second line\n`));
  const collect = (location) => fs.readdirSync(location).flatMap((name) => {
    const next = path.join(location, name);
    return fs.statSync(next).isDirectory() ? collect(next) : name.endsWith(".ts") ? [next] : [];
  });
  const sourceFiles = collect(path.join(root, "api_source"));
  assert.ok(sourceFiles.some((file) => /\bIAccount\s+as\s+Account\b/.test(fs.readFileSync(file, "utf8"))));
  const forms = { named: false, default: false, namespace: false, fetcher: false };
  const populations = [];
  for (const directory of [path.join(root, "api_source/functional"), path.join(root, "features/generated_source")]) {
    const files = collect(directory);
    assert.ok(files.length > 0, `Empty generated root ${directory}`);
    populations.push({ directory: path.relative(sandbox, directory), files: files.map((file) => path.relative(sandbox, file)) });
    for (const file of files) for (const match of fs.readFileSync(file, "utf8").matchAll(/^import[^;]*from "[^"]+";/gm)) {
      const statement = match[0];
      if (/^import (type )?\{ (Plain|Encrypted)Fetcher \}/.test(statement)) {
        assert.ok(!statement.startsWith("import type"), `Runtime fetcher became type-only: ${file}`);
        forms.fetcher = true;
        continue;
      }
      if (!/from "[^"]*structures\/[^"]*";$/.test(statement)) continue;
      assert.ok(statement.startsWith("import type "), `DTO became a value import: ${file}\n${statement}`);
      if (statement.startsWith("import type * as ")) forms.namespace = true;
      else if (statement.startsWith("import type {")) forms.named = true;
      else forms.default = true;
    }
  }
  for (const [kind, reached] of Object.entries(forms)) assert.equal(reached, true, `Missing original ${kind} import control`);
  const swagger = JSON.parse(fs.readFileSync(path.join(sandbox, "swagger.json"), "utf8"));
  for (const route of ["/north/duplicate", "/south/duplicate"])
    assert.notEqual(swagger.paths?.[route], undefined, `Missing original namespaced route ${route}`);
  record("keyword-source-original-artifacts.json", { populations, forms, namespacedRoutes: ["/north/duplicate", "/south/duplicate"] });
};
module.exports = { test_sdk_keyword_source_artifacts };
