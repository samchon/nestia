import fs from "fs";
import path from "path";

/**
 * Verifies generated DTO imports are type-only across all three binding forms.
 *
 * The original three binding-presence assertions and every structures-import
 * rejection remain, with runtime imports as the opposite-kind control.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification Every freshly generated SDK/e2e structures import must be type-only; named/default/namespace forms must each appear and runtime fetcher imports remain value imports.
 * @evidence contracts/testing.md#independent-expectations The authored named/default/namespace DTO declarations and runtime fetcher invocation establish the import forms and value-versus-type contract independently of the printer.
 * @evidence contracts/testing.md#distinguishing-cases The original three binding-presence assertions and every structures-import rejection remain, with runtime imports as the opposite-kind control.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from import-type/src/test/features/test_sdk_dto_import_type.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_sdk_dto_import_type_import_type = (): void => {
  const roots: string[] = [
    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "src",
      "api",
      "functional",
    ),
    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "src",
      "test",
      "features",
      "api",
      "automated",
    ),
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
