import fs from "fs";
import path from "path";

/**
 * Verifies generated SDK modules import DTO types with `import type`.
 *
 * Generated SDK code only ever references DTO modules in type positions, so
 * every DTO import must carry the type-only clause. A plain value import would
 * make bundlers and Node.js load pure type modules at runtime and breaks
 * `verbatimModuleSyntax` consumers. The printer has three separate binding
 * branches — named elements, a default binding, and a namespace binding
 * (`import type * as X`) — and each needs its own regression lock, while
 * runtime imports such as the fetcher must stay value imports.
 *
 * 1. Generate the SDK from a controller importing DTOs with a named binding, a
 *    default binding, and a namespace (`import * as`) binding.
 * 2. Scan every generated module under `src/api/functional` and the generated e2e
 *    suite under `src/test/features/api/automated`.
 * 3. Assert every import from the `structures` directory is type-only, all three
 *    type-only binding forms actually appear, and the runtime fetcher import
 *    remains a value import.
 *
 * @evidence contracts/testing.md#behavioral-verification Scans freshly generated SDK/e2e output for named, default and namespace type-only DTO imports and a value fetcher import.
 * @evidence contracts/testing.md#independent-expectations Type-only DTOs require import type under verbatimModuleSyntax while the called runtime fetcher requires a value binding.
 * @evidence contracts/testing.md#distinguishing-cases All three DTO binding forms and the opposite runtime-import control detect overbroad or incomplete type-only printing.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Scans freshly generated SDK/e2e output for named, default and namespace type-only DTO imports and a value fetcher import. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage All three DTO binding forms and the opposite runtime-import control detect overbroad or incomplete type-only printing. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_sdk_dto_import_type = (): void => {
  const roots: string[] = [
    path.resolve(__dirname, "..", "..", "api", "functional"),
    path.resolve(__dirname, "api", "automated"),
  ];
  const violations: string[] = [];
  let named: boolean = false;
  let dflt: boolean = false;
  let namespace: boolean = false;
  let fetcher: boolean = false;

  for (const root of roots) {
    if (fs.existsSync(root) === false)
      throw new Error(`Missing generated directory: ${root}`);
    for (const file of collect(root)) {
      const content: string = fs.readFileSync(file, "utf8");
      for (const match of content.matchAll(/^import[^;]*from "[^"]+";/gm)) {
        const statement: string = match[0];
        if (/^import (type )?\{ (Plain|Encrypted)Fetcher \}/.test(statement)) {
          if (statement.startsWith("import type"))
            violations.push(
              `${path.relative(__dirname, file)}: the fetcher is called at runtime and must stay a value import — ${statement.split("\n")[0]}`,
            );
          fetcher = true;
          continue;
        }
        if (/from "[^"]*structures\/[^"]*";$/.test(statement) === false)
          continue;
        if (statement.startsWith("import type ") === false) {
          violations.push(
            `${path.relative(__dirname, file)}: ${statement.split("\n")[0]}`,
          );
          continue;
        }
        if (statement.startsWith("import type * as ")) namespace = true;
        else if (statement.startsWith("import type {")) named = true;
        else dflt = true;
      }
    }
  }

  if (violations.length !== 0)
    throw new Error(
      ["Generated DTO imports must be type-only:", ...violations].join("\n"),
    );
  if (named === false)
    throw new Error("Fixture must produce a named type-only DTO import.");
  if (dflt === false)
    throw new Error("Fixture must produce a default type-only DTO import.");
  if (namespace === false)
    throw new Error("Fixture must produce a namespace type-only DTO import.");
  if (fetcher === false)
    throw new Error("Fixture must produce a runtime fetcher import.");
};

const collect = (location: string): string[] =>
  fs.readdirSync(location).flatMap((name) => {
    const next: string = path.join(location, name);
    if (fs.statSync(next).isDirectory()) return collect(next);
    return name.endsWith(".ts") ? [next] : [];
  });
