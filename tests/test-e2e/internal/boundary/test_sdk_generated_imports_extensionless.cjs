const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies both generated SDK outputs retain extensionless local imports.
 *
 * Consumer compilation can resolve some explicit source suffixes while shipping
 * an unusable package; observing actual emitted import spellings pins that ABI.
 *
 * 1. Scan every generated TypeScript file in the primary and propagated output.
 * 2. Reject the original eight local source suffixes and distinguish empty output.
 *
 * @evidence contracts/testing.md#behavioral-verification Every actual generated TypeScript file is scanned with the original import/export matcher; relative or absolute js/jsx/ts/tsx/cjs/mjs/cts/mts imports fail before consumer compilation.
 * @evidence contracts/testing.md#independent-expectations Generated package local imports must be extensionless under the original package contract. The original start.js matcher and literal suffix set establish the oracle; bare external imports remain permitted.
 * @evidence contracts/testing.md#distinguishing-cases Primary and propagated generated ABIs are scanned separately, local imports contrast bare imports and a missing or empty TypeScript population is a distinct failure rather than vacuous success.
 * @evidence contracts/testing.md#execution-ownership The sole installed E2E entry invokes this matching export after both generation operations and before the existing consumer compilation.
 * @evidence contracts/e2e.md#necessary-boundary The assertion reads actual installed-generator output, not a source-policy fixture, and detects an emitted import ABI defect.
 * @evidence contracts/e2e.md#shared-execution The scanner consumes the two already generated outputs without an installation, compiler, generator, backend or child process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity It reads immutable sandbox-owned outputs and holds no handles beyond synchronous reads; existing entry cleanup owns the sandbox.
 * @evidence contracts/e2e.md#preserved-coverage The original scanner's matcher, TypeScript traversal and local-path predicate are retained for both surviving generated SDKs; actual mts/cts input loader boundaries remain pending and are not certified by this output scan.
 */
const test_sdk_generated_imports_extensionless = ({ sandbox, record }) => {
  const observations = [];
  const failures = [];
  for (const name of ["api", "api_propagate"]) {
    const root = path.join(sandbox, "consumer/src", name);
    const files = [];
    const iterate = (location) => {
      for (const file of fs.readdirSync(location)) {
        const next = path.join(location, file);
        const stats = fs.statSync(next);
        if (stats.isDirectory()) iterate(next);
        else if (stats.isFile() && file.endsWith(".ts")) {
          files.push(path.relative(sandbox, next));
          const content = fs.readFileSync(next, "utf8");
          const matcher = /\b(?:from|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from)\s+["']([^"']+\.(?:[cm]?js|jsx|[cm]?ts|tsx))["']/g;
          for (const match of content.matchAll(matcher))
            if (match[1].startsWith(".") || path.isAbsolute(match[1]))
              failures.push(`${path.relative(sandbox, next)} imports ${JSON.stringify(match[1])}`);
        }
      }
    };
    if (fs.existsSync(root)) iterate(root);
    observations.push({ name, files });
    if (files.length === 0) failures.push(`${name}: no generated TypeScript files`);
  }
  record("generated-import-extension-scan.json", { observations, failures });
  assert.equal(failures.length, 0, ["Generated SDK sources must not include source file extensions in import specifiers.", ...failures].join("\n"));
};

module.exports = { test_sdk_generated_imports_extensionless };
