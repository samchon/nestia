import assert from "assert/strict";
import fs from "fs";
import path from "path";

/**
 * Verifies default SDK generation keeps relative imports free of source
 * suffixes.
 *
 * ImportDictionary units own suffix normalization. Actual writers must still
 * use that composition rather than bypassing it for a barrel or route file. One
 * scan of the fresh shared SDK replaces scans after every old fixture.
 *
 * 1. Read every freshly generated TypeScript SDK source under the owned output.
 * 2. Reject relative source-suffixed imports and require nonempty discovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Every actual generated SDK TypeScript file is inspected for the former fixture runner's relative import/export-from source suffixes. A writer bypassing source normalization fails, even if some suffix spelling happens to compile under this consumer's module mode.
 * @evidence contracts/testing.md#independent-expectations Default SDK import composition uses extension-free relative identifiers; declaration and TypeScript/JavaScript source suffixes identify input files rather than the default generated module spelling. The literal forbidden suffix set preserves the previous generated-output assertion. Bare package specifiers are outside this relative-module contract.
 * @evidence contracts/testing.md#distinguishing-cases Every fresh SDK file participates, including barrels and runtime support files outside functional routes. A zero-file guard prevents a missing output from passing. Direct test_sdk_import_source_extensions owns eleven suffixes, three binding kinds, type/value twins and package/unrelated controls.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching export/file after actual SDK generation and compilation. It reads caller-generated source output without compiling another fixture or starting a host.
 * @evidence contracts/e2e.md#necessary-boundary Default route and barrel writers must actually pass their imports through the owning dictionary when the installed application generates a complete SDK. Direct dictionary units cannot detect a caller that bypasses it.
 * @evidence contracts/e2e.md#shared-execution One linear scan reuses the fresh SDK already generated for every shared scenario. No installation, program load, compiler or server is added for source suffixes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The runner recreates its assigned project and generates this SDK once from the actual application. The scan reads only that generation's src/api tree, keeps no state across cases, and changes no output file.
 * @evidence contracts/e2e.md#preserved-coverage The former assertGeneratedImportsAreExtensionless check survives once over all default shared SDK sources rather than once per retired fixture. The direct dictionary unit adds exact protocol and overmatching controls; other generated DTO-import assertions retain the three type-only forms and value-import distinction.
 */
export const test_sdk_default_import_paths = (): void => {
  const root = path.resolve(__dirname, "../../../../src/api");
  let files = 0;
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files++;
        const content = fs.readFileSync(file, "utf8");
        const matcher =
          /\b(?:from|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from)\s+["']([^"']+\.(?:[cm]?js|jsx|[cm]?ts|tsx))["']/g;
        for (const match of content.matchAll(matcher))
          assert(
            !match[1]!.startsWith(".") && !path.isAbsolute(match[1]!),
            `${path.relative(root, file)} imports ${JSON.stringify(match[1])}`,
          );
      }
    }
  };
  visit(root);
  assert(files > 0, "No generated SDK source files were discovered.");
};
